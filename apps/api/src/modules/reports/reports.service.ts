import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../../common/prisma.service'
import { parseDateRange } from './utils/date-range.helper'

export interface ReportFilters {
  from?: string
  to?: string
  plasiyerId?: string
  dealerId?: string
  format?: 'json' | 'csv' | 'xlsx'
}

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name)

  constructor(private prisma: PrismaService) {}

  // ─── 1. Plasiyer Bazlı Satış Raporu ────────────────────────────────────

  async plasiyerSales(filters: ReportFilters) {
    const { start, end } = parseDateRange(filters.from, filters.to)

    // Plasiyer tarafından oluşturulan onaylanmış proformalar üzerinden
    const proformas = await this.prisma.proforma.findMany({
      where: {
        generatedByRole: 'PLASIYER',
        status: 'approved',
        approvedAt: { gte: start, lte: end },
        ...(filters.plasiyerId && { generatedBy: filters.plasiyerId }),
      },
      include: { items: true },
    })

    // Plasiyer bazında grupla
    const byPlasiyer = new Map<string, { count: number; total: number; items: number }>()
    for (const p of proformas) {
      const key = p.generatedBy || 'unknown'
      const existing = byPlasiyer.get(key) || { count: 0, total: 0, items: 0 }
      existing.count++
      existing.total += Number(p.totalAmount)
      existing.items += p.items.length
      byPlasiyer.set(key, existing)
    }

    // Kullanıcı isimlerini çöz
    const userIds = [...byPlasiyer.keys()]
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true },
    })
    const userMap = new Map(users.map(u => [u.id, u]))

    return [...byPlasiyer.entries()].map(([userId, stats]) => ({
      plasiyerId: userId,
      plasiyerName: userMap.get(userId)?.name || 'Bilinmeyen',
      plasiyerEmail: userMap.get(userId)?.email || '',
      proformaCount: stats.count,
      totalAmount: stats.total,
      itemCount: stats.items,
      averageAmount: stats.count > 0 ? stats.total / stats.count : 0,
    }))
  }

  // ─── 2. Sipariş Durum Pipeline ─────────────────────────────────────────

  async orderPipeline(filters: ReportFilters) {
    const { start, end } = parseDateRange(filters.from, filters.to)

    const orders = await this.prisma.order.findMany({
      where: { createdAt: { gte: start, lte: end } },
      select: { status: true, total: true },
    })

    const byStatus = new Map<string, { count: number; total: number }>()
    for (const o of orders) {
      const existing = byStatus.get(o.status) || { count: 0, total: 0 }
      existing.count++
      existing.total += Number(o.total)
      byStatus.set(o.status, existing)
    }

    const stages = ['PENDING_APPROVAL', 'APPROVED', 'PREPARING', 'SHIPPED', 'COMPLETED', 'CANCELLED']
    return stages.map(stage => ({
      status: stage,
      count: byStatus.get(stage)?.count || 0,
      totalAmount: byStatus.get(stage)?.total || 0,
    }))
  }

  // ─── 3. Bayi Risk Skoru ────────────────────────────────────────────────

  async dealerRisk(filters: ReportFilters) {
    const dealers = await this.prisma.dealer.findMany({
      where: {
        status: 'ACTIVE',
        ...(filters.dealerId && { id: filters.dealerId }),
      },
      include: {
        user: { select: { name: true, email: true } },
        orders: {
          where: { createdAt: { gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) } },
          select: { status: true, total: true },
        },
      },
    })

    return dealers.map(d => {
      const totalOrders = d.orders.length
      const cancelledOrders = d.orders.filter(o => o.status === 'CANCELLED').length
      const totalRevenue = d.orders.reduce((sum, o) => sum + Number(o.total), 0)
      const cancelRate = totalOrders > 0 ? cancelledOrders / totalOrders : 0
      const creditUsage = d.creditLimit > 0 ? Math.abs(d.cariBalance) / d.creditLimit : 0
      const now = Date.now()
      const lastOrderDate = d.lastOrderAt ? new Date(d.lastOrderAt).getTime() : 0
      const daysSinceLastOrder = lastOrderDate > 0 ? Math.floor((now - lastOrderDate) / (24 * 60 * 60 * 1000)) : 999

      // Risk score calculation (0-100, higher = riskier)
      let riskScore = 0
      riskScore += creditUsage > 0.9 ? 30 : creditUsage > 0.7 ? 20 : creditUsage > 0.5 ? 10 : 0
      riskScore += cancelRate > 0.3 ? 25 : cancelRate > 0.15 ? 15 : cancelRate > 0.05 ? 5 : 0
      riskScore += daysSinceLastOrder > 90 ? 25 : daysSinceLastOrder > 60 ? 15 : daysSinceLastOrder > 30 ? 5 : 0
      riskScore += Math.abs(d.cariBalance) > d.creditLimit * 0.8 ? 20 : 0

      return {
        dealerId: d.id,
        dealerName: d.company,
        cariNo: d.cariNo,
        city: d.city,
        creditLimit: d.creditLimit,
        cariBalance: d.cariBalance,
        creditUsagePct: Math.round(creditUsage * 100),
        totalOrders,
        totalRevenue,
        cancelRate: Math.round(cancelRate * 100),
        daysSinceLastOrder,
        riskScore,
        riskLevel: riskScore >= 60 ? 'HIGH' : riskScore >= 30 ? 'MEDIUM' : 'LOW',
      }
    }).sort((a, b) => b.riskScore - a.riskScore)
  }

  // ─── 4. Kritik Stok Seviyesi ──────────────────────────────────────────

  async criticalStock() {
    const products = await this.prisma.product.findMany({
      where: { visible: true },
      select: {
        id: true, sku: true, name: true, brand: true, category: true,
        netsisStock: true, minimumStock: true, middleStock: true, displayStock: true,
      },
    })

    const critical = products
      .filter(p => p.displayStock <= p.minimumStock)
      .map(p => ({
        productId: p.id,
        sku: p.sku,
        name: p.name,
        brand: p.brand,
        category: p.category,
        currentStock: p.displayStock,
        minimumStock: p.minimumStock,
        deficit: p.minimumStock - p.displayStock,
        level: 'CRITICAL',
      }))
      .sort((a, b) => b.deficit - a.deficit)

    const warning = products
      .filter(p => p.displayStock > p.minimumStock && p.middleStock && p.displayStock <= p.middleStock)
      .map(p => ({
        productId: p.id,
        sku: p.sku,
        name: p.name,
        brand: p.brand,
        category: p.category,
        currentStock: p.displayStock,
        middleStock: p.middleStock!,
        surplus: p.displayStock - p.middleStock!,
        level: 'WARNING',
      }))
      .sort((a, b) => a.surplus - b.surplus)

    return { critical, warning, summary: { criticalCount: critical.length, warningCount: warning.length } }
  }

  // ─── 5. Hareketsiz Stok ───────────────────────────────────────────────

  async slowMovingStock(filters: ReportFilters) {
    const daysThreshold = filters.from ? 30 : 90 // default 90 gün

    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - daysThreshold)

    // Hareketsiz: son N günde hiç sipariş hattı olmayan stoktaki ürünler
    const products = await this.prisma.product.findMany({
      where: { visible: true, displayStock: { gt: 0 } },
      select: {
        id: true, sku: true, name: true, brand: true, category: true,
        displayStock: true, basePrice: true,
      },
    })

    // Bu ürünlerin son sipariş tarihlerini bul
    const result: any[] = []
    for (const p of products) {
      const lastOrder = await this.prisma.orderLine.findFirst({
        where: { productId: p.id, createdAt: { gte: cutoff } },
        orderBy: { createdAt: 'desc' },
      })

      if (!lastOrder) {
        // Bu ürün için hiç sipariş yok (veya cutoff'tan eski)
        const veryLast = await this.prisma.orderLine.findFirst({
          where: { productId: p.id },
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true },
        })

        const daysSinceLastSale = veryLast
          ? Math.floor((Date.now() - new Date(veryLast.createdAt).getTime()) / (24 * 60 * 60 * 1000))
          : 999

        result.push({
          productId: p.id,
          sku: p.sku,
          name: p.name,
          brand: p.brand,
          category: p.category,
          currentStock: p.displayStock,
          stockValue: p.displayStock * p.basePrice,
          daysSinceLastSale,
          level: daysSinceLastSale > 180 ? 'DEAD' : daysSinceLastSale > 90 ? 'SLOW' : 'WATCH',
        })
      }
    }

    return result.sort((a, b) => b.stockValue - a.stockValue)
  }

  // ─── 6. Kredi Limiti Kullanım ─────────────────────────────────────────

  async creditUsage() {
    const dealers = await this.prisma.dealer.findMany({
      where: { status: 'ACTIVE', creditLimit: { gt: 0 } },
      select: {
        id: true, company: true, cariNo: true, city: true,
        creditLimit: true, cariBalance: true, totalOrders: true, totalRevenue: true,
        user: { select: { name: true, email: true } },
      },
    })

    return dealers
      .map(d => {
        const usagePct = Math.round((Math.abs(d.cariBalance) / d.creditLimit) * 100)
        return {
          dealerId: d.id,
          company: d.company,
          cariNo: d.cariNo,
          city: d.city,
          contactName: d.user?.name,
          creditLimit: d.creditLimit,
          currentBalance: d.cariBalance,
          availableCredit: d.creditLimit - Math.abs(d.cariBalance),
          usagePct,
          level: usagePct >= 95 ? 'BLOCKED' : usagePct >= 80 ? 'WARNING' : 'OK',
          totalOrders: d.totalOrders,
          totalRevenue: d.totalRevenue,
        }
      })
      .sort((a, b) => b.usagePct - a.usagePct)
  }

  // ─── 7. Plasiyer Performans Dashboard ──────────────────────────────────

  async plasiyerDashboard(filters: ReportFilters) {
    const { start, end } = parseDateRange(filters.from, filters.to)

    const plasiyers = await this.prisma.user.findMany({
      where: { role: 'PLASIYER' },
      select: { id: true, name: true, email: true, createdAt: true },
    })

    const result: any[] = []
    for (const p of plasiyers) {
      // Proformaları
      const proformas = await this.prisma.proforma.findMany({
        where: { generatedBy: p.id, generatedAt: { gte: start, lte: end } },
        select: { status: true, totalAmount: true },
      })

      const totalProformas = proformas.length
      const approvedProformas = proformas.filter(pf => pf.status === 'approved')
      const pendingProformas = proformas.filter(pf => pf.status === 'pending_approval')
      const rejectedProformas = proformas.filter(pf => pf.status === 'rejected')
      const totalAmount = approvedProformas.reduce((s, pf) => s + Number(pf.totalAmount), 0)
      const conversionRate = totalProformas > 0 ? Math.round((approvedProformas.length / totalProformas) * 100) : 0

      // En çok sattığı ürünler (proforma kalemlerinden)
      // Basitleştirilmiş: proforma başına ortalama

      result.push({
        plasiyerId: p.id,
        plasiyerName: p.name,
        plasiyerEmail: p.email,
        since: p.createdAt,
        totalProformas,
        approvedCount: approvedProformas.length,
        pendingCount: pendingProformas.length,
        rejectedCount: rejectedProformas.length,
        totalAmount,
        averageAmount: approvedProformas.length > 0 ? totalAmount / approvedProformas.length : 0,
        conversionRate,
      })
    }

    return result.sort((a, b) => b.totalAmount - a.totalAmount)
  }

  // ─── 8. Plasiyer Yönetimi (Faz 2) ──────────────────────────────────────

  async getPlasiyers() {
    const plasiyers = await this.prisma.user.findMany({
      where: { role: 'PLASIYER' },
      select: {
        id: true, name: true, email: true, phone: true, city: true, createdAt: true,
      },
      orderBy: { name: 'asc' },
    })

    const result: any[] = []
    for (const p of plasiyers) {
      const proformas = await this.prisma.proforma.count({ where: { generatedBy: p.id } })
      const approved = await this.prisma.proforma.count({ where: { generatedBy: p.id, status: 'approved' } })
      const pending = await this.prisma.proforma.count({ where: { generatedBy: p.id, status: 'pending_approval' } })

      result.push({
        ...p,
        totalProformas: proformas,
        approvedProformas: approved,
        pendingProformas: pending,
      })
    }

    return result
  }
}
