import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { MailerService } from '../mailer/mailer.service';

@Injectable()
export class DealerService {
  private readonly logger = new Logger(DealerService.name);

  constructor(private prisma: PrismaService, private mailerService: MailerService) {}

  /**
   * Bayi sepetleri — aktif/terkedilen (admin). addedAt guncellenmedigi icin
   * (schema'da @updatedAt yok) "son eklenen urun" tarihini yaklasik son
   * aktivite olarak kullaniyoruz. 3+ gun guncellenmemis sepetler "terkedilmis"
   * sayilir.
   */
  async getDealerCarts() {
    const items = await this.prisma.cartItem.findMany({
      include: {
        product: { select: { name: true, sku: true, basePrice: true } },
        user: { select: { dealer: { select: { id: true, company: true, city: true } } } },
      },
    });

    const byDealer = new Map<
      string,
      { dealerId: string; dealerName: string; city: string; itemCount: number; totalValue: number; lastUpdatedAt: Date; items: any[] }
    >();

    for (const item of items) {
      const dealer = item.user.dealer;
      if (!dealer) continue; // sadece bayi (B2B) sepetleri

      const existing = byDealer.get(dealer.id) || {
        dealerId: dealer.id,
        dealerName: dealer.company,
        city: dealer.city || '',
        itemCount: 0,
        totalValue: 0,
        lastUpdatedAt: item.addedAt,
        items: [] as any[],
      };
      existing.itemCount += item.quantity;
      existing.totalValue += item.quantity * item.product.basePrice;
      if (item.addedAt > existing.lastUpdatedAt) existing.lastUpdatedAt = item.addedAt;
      existing.items.push({ productName: item.product.name, sku: item.product.sku, quantity: item.quantity, addedAt: item.addedAt });
      byDealer.set(dealer.id, existing);
    }

    const now = Date.now();
    return [...byDealer.values()]
      .map((d) => ({
        ...d,
        daysSinceUpdate: Math.floor((now - d.lastUpdatedAt.getTime()) / (24 * 60 * 60 * 1000)),
        isAbandoned: now - d.lastUpdatedAt.getTime() > 3 * 24 * 60 * 60 * 1000,
      }))
      .sort((a, b) => a.lastUpdatedAt.getTime() - b.lastUpdatedAt.getTime());
  }

  /**
   * List all active dealers (for admin dropdowns)
   */
  async getAllDealers() {
    return this.prisma.dealer.findMany({
      where: { status: 'ACTIVE' },
      select: {
        id: true,
        name: true,
        company: true,
        city: true,
        phone: true,
        cariNo: true,
      },
      orderBy: { company: 'asc' },
    });
  }

  /**
   * Get dealer profile information
   */
  async getDealerProfile(userId: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { dealer: true },
      });

      if (!user || !user.dealer) {
        throw new BadRequestException('Dealer profile not found for this user');
      }

      const dealer = user.dealer;

      return {
        id: dealer.id,
        name: dealer.name,
        company: dealer.company,
        contactPerson: dealer.contactPerson,
        phone: dealer.phone,
        email: user.email,
        address: dealer.address,
        city: dealer.city,
        region: dealer.region,
        cariBalance: dealer.cariBalance,
        creditLimit: dealer.creditLimit,
        totalOrders: dealer.totalOrders,
        lastOrderAt: dealer.lastOrderAt,
        status: dealer.status,
      };
    } catch (error) {
      this.logger.error(`Error fetching dealer profile: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get cari account transactions/history
   * For now, returns mock data. In production, fetch from Netsis
   */
  async getCariTransactions(userId: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { dealer: true },
      });

      if (!user || !user.dealer) {
        throw new BadRequestException('Dealer not found');
      }

      // Get orders for this dealer and convert to transactions
      const orders = await this.prisma.order.findMany({
        where: {
          dealerId: user.dealer.id,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 50,
      });

      // Convert orders to transaction format
      let runningBalance = user.dealer.cariBalance;
      const transactions = orders.map((order) => {
        const transaction = {
          id: order.id,
          date: order.createdAt,
          type: 'debit' as const, // Orders are debits
          amount: Math.round(order.total * 100) / 100,
          description: `Order ${order.orderNo}`,
          balance: runningBalance,
        };
        runningBalance -= transaction.amount;
        return transaction;
      });

      return transactions;
    } catch (error) {
      this.logger.error(`Error fetching cari transactions: ${error.message}`);
      throw error;
    }
  }

  /**
   * Export cari statement as CSV (Excel-compatible with UTF-8 BOM)
   */
  async exportCariStatement(userId: string): Promise<Buffer> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { dealer: true },
      });
      if (!user || !user.dealer) throw new BadRequestException('Dealer not found');

      const orders = await this.prisma.order.findMany({
        where: { dealerId: user.dealer.id },
        orderBy: { createdAt: 'asc' },
      });

      const BOM = '﻿';
      const headers = ['Tarih', 'Sipariş No', 'İşlem Türü', 'Tutar (TL)', 'KDV', 'Toplam', 'Bakiye'];
      const rows: string[] = [BOM + headers.join(',')];

      let balance = 0;
      for (const o of orders) {
        balance += o.total;
        rows.push([
          o.createdAt.toISOString().split('T')[0],
          o.orderNo,
          'Borç',
          o.subtotal.toFixed(2),
          o.tax.toFixed(2),
          o.total.toFixed(2),
          balance.toFixed(2),
        ].join(','));
      }

      return Buffer.from(rows.join('\n'), 'utf-8');
    } catch (error) {
      this.logger.error(`Error exporting cari statement: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate report (monthly, yearly, invoice, stock)
   */
  async generateReport(userId: string, reportType: string): Promise<Buffer> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { dealer: true },
      });

      if (!user || !user.dealer) {
        throw new BadRequestException('Dealer not found');
      }

      switch (reportType) {
        case 'monthly':
          return await this.generateMonthlyReport(user.dealer.id);
        case 'yearly':
          return await this.generateYearlyReport(user.dealer.id);
        case 'invoice':
          return await this.generateInvoiceReport(user.dealer.id);
        case 'detailed':
          return await this.generateDetailedReport(user.dealer.id);
        case 'stock':
          return await this.generateStockReport(user.dealer.id);
        case 'risk':
          return await this.generateRiskReport(user.dealer.id);
        case 'aging':
          return await this.generateAgingReport(user.dealer.id);
        case 'performance':
          return await this.generatePerformanceReport(user.dealer.id);
        default:
          throw new BadRequestException(`Unknown report type: ${reportType}`);
      }
    } catch (error) {
      this.logger.error(`Error generating report: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate monthly report as CSV
   */
  private async generateMonthlyReport(dealerId: string): Promise<Buffer> {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const orders = await this.prisma.order.findMany({
      where: { dealerId, createdAt: { gte: firstDay, lte: lastDay } },
      include: { lines: true },
      orderBy: { createdAt: 'asc' },
    });

    const BOM = '﻿';
    const tl = (n: number) => `₺${n.toFixed(2)}`;
    const headers = ['Tarih', 'Sipariş No', 'Ürün Adedi', 'Ara Toplam', 'KDV', 'Nakliye', 'Toplam'];
    const rows: string[] = [BOM + headers.join(',')];
    let tSub = 0, tTax = 0, tLog = 0, tTotal = 0, tItems = 0;
    for (const o of orders) {
      rows.push([
        o.createdAt.toISOString().split('T')[0], o.orderNo, o.lines.length.toString(),
        tl(o.subtotal), tl(o.tax), tl(o.logisticsSurcharge), tl(o.total),
      ].join(','));
      tSub += o.subtotal; tTax += o.tax; tLog += o.logisticsSurcharge; tTotal += o.total; tItems += o.lines.length;
    }
    // Summary row
    rows.push('');
    rows.push(['TOPLAM', `${orders.length} sipariş`, tItems.toString(), tl(tSub), tl(tTax), tl(tLog), tl(tTotal)].join(','));
    return Buffer.from(rows.join('\n'), 'utf-8');
  }

  /**
   * Generate yearly report as CSV
   */
  private async generateYearlyReport(dealerId: string): Promise<Buffer> {
    const year = new Date().getFullYear();
    const firstDay = new Date(year, 0, 1);
    const lastDay = new Date(year, 11, 31);

    const orders = await this.prisma.order.findMany({
      where: { dealerId, createdAt: { gte: firstDay, lte: lastDay } },
      orderBy: { createdAt: 'asc' },
    });

    const tl = (n: number) => `₺${n.toFixed(2)}`;
    const BOM = '﻿';
    const headers = ['Ay', 'Sipariş Sayısı', 'Toplam Tutar (TL)', 'Ortalama Sipariş'];
    const monthNames = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
    const monthly: Record<number, { count: number; total: number }> = {};
    for (const o of orders) {
      const m = new Date(o.createdAt).getMonth();
      if (!monthly[m]) monthly[m] = { count: 0, total: 0 };
      monthly[m].count++;
      monthly[m].total += o.total;
    }
    const rows: string[] = [BOM + headers.join(',')];
    let yCount = 0, yTotal = 0;
    for (let m = 0; m < 12; m++) {
      const d = monthly[m] || { count: 0, total: 0 };
      rows.push([monthNames[m], d.count.toString(), tl(d.total), d.count > 0 ? tl(d.total / d.count) : '₺0.00'].join(','));
      yCount += d.count; yTotal += d.total;
    }
    rows.push('');
    rows.push(['YILLIK TOPLAM', yCount.toString(), tl(yTotal), yCount > 0 ? tl(yTotal / yCount) : '₺0.00'].join(','));
    return Buffer.from(rows.join('\n'), 'utf-8');
  }

  /**
   * Generate invoice report as CSV
   */
  private async generateInvoiceReport(dealerId: string): Promise<Buffer> {
    const orders = await this.prisma.order.findMany({
      where: { dealerId },
      include: { lines: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const tl = (n: number) => `₺${n.toFixed(2)}`;
    const BOM = '﻿';
    const headers = ['Tarih', 'Sipariş No', 'Durum', 'Ürün', 'Adet', 'Birim Fiyat', 'Satır Toplamı'];
    const rows: string[] = [BOM + headers.join(',')];
    let grandTotal = 0;
    for (const o of orders) {
      for (const l of o.lines) {
        rows.push([
          o.createdAt.toISOString().split('T')[0], o.orderNo, o.status,
          `"${l.product?.name || l.productId}"`, l.quantity.toString(),
          tl(l.unitPrice), tl(l.total),
        ].join(','));
      }
      rows.push([`Sipariş ${o.orderNo} Toplam`, '', '', '', '', tl(o.subtotal + o.tax + o.logisticsSurcharge), tl(o.total)].join(','));
      rows.push('');
      grandTotal += o.total;
    }
    rows.push(['GENEL TOPLAM', '', '', '', '', '', tl(grandTotal)].join(','));
    return Buffer.from(rows.join('\n'), 'utf-8');
  }

  /**
   * Generate detailed report with full product breakdown
   */
  private async generateDetailedReport(dealerId: string): Promise<Buffer> {
    const orders = await this.prisma.order.findMany({
      where: { dealerId },
      include: { lines: { include: { product: true } } },
      orderBy: { createdAt: 'asc' },
    });

    const tl = (n: number) => `₺${n.toFixed(2)}`;
    const BOM = '﻿';
    const headers = ['Sipariş No', 'Tarih', 'Ürün Adı', 'Marka', 'Kategori', 'Adet', 'Birim Fiyat', 'Satır Toplamı', 'KDV Oranı', 'Sipariş Toplamı', 'Durum'];
    const rows: string[] = [BOM + headers.join(',')];
    let grandTotal = 0;

    for (const o of orders) {
      for (const l of o.lines) {
        const p = l.product;
        rows.push([
          o.orderNo,
          o.createdAt.toISOString().split('T')[0],
          `"${p?.name || l.productId}"`,
          p?.brand || '-',
          p?.category || '-',
          l.quantity.toString(),
          tl(l.unitPrice),
          tl(l.total),
          `%${((l.taxRate || 0.2) * 100).toFixed(0)}`,
          tl(o.total),
          o.status,
        ].join(','));
      }
      grandTotal += o.total;
    }

    rows.push('');
    rows.push(['GENEL TOPLAM', '', '', '', '', '', '', tl(grandTotal), '', '', ''].join(','));
    return Buffer.from(rows.join('\n'), 'utf-8');
  }

  /**
   * Generate stock report as CSV
   */
  private async generateStockReport(_dealerId: string): Promise<Buffer> {
    const products = await this.prisma.product.findMany({
      where: { visible: true },
      orderBy: { category: 'asc' },
    });

    const BOM = '﻿';
    const headers = ['Stok Kodu', 'NetSis Kodu', 'Ürün Adı', 'Marka', 'Kategori', 'Birim Fiyat', 'Stok', 'Görünür', 'Satın Alınabilir'];
    const rows: string[] = [BOM + headers.join(',')];
    for (const p of products) {
      rows.push([
        p.sku, p.netsisCode, p.name, p.brand, p.category,
        p.basePrice.toFixed(2), p.displayStock.toString(),
        p.visible ? 'Evet' : 'Hayır', p.purchasable ? 'Evet' : 'Hayır',
      ].join(','));
    }
    return Buffer.from(rows.join('\n'), 'utf-8');
  }

  // ─── RISK REPORT ──────────────────────────────────────────────────────

  private async generateRiskReport(dealerId: string): Promise<Buffer> {
    const dealer = await this.prisma.dealer.findUnique({ where: { id: dealerId } });
    if (!dealer) throw new BadRequestException('Dealer not found');

    const orders = await this.prisma.order.findMany({
      where: { dealerId },
    });

    const total = orders.length;
    if (total === 0) {
      const BOM = '﻿';
      return Buffer.from(BOM + 'Bayi Risk Raporu\n\nBu bayi için henüz sipariş bulunmamaktadır.\nRisk değerlendirmesi yapılamadı.', 'utf-8');
    }

    const cancelled = orders.filter(o => o.status === 'CANCELLED').length;
    const returned = orders.filter(o => o.status === 'RETURNED').length;
    const completed = orders.filter(o => o.status === 'COMPLETED' || o.status === 'SHIPPED').length;
    const cancelledRate = (cancelled / total) * 100;
    const returnRate = (returned / total) * 100;
    const debt = Math.abs(dealer.cariBalance);
    const creditUtilization = dealer.creditLimit > 0 ? (debt / dealer.creditLimit) * 100 : 0;

    // Risk score: 0-100, lower is better
    let riskScore = 50;
    riskScore += Math.min(cancelledRate * 2, 30);
    riskScore += Math.min(returnRate * 2, 20);
    riskScore += Math.min(creditUtilization * 0.2, 20);
    riskScore = Math.max(0, Math.min(riskScore, 100));

    const tier = riskScore <= 40 ? 'DÜŞÜK RİSK' : riskScore <= 70 ? 'ORTA RİSK' : 'YÜKSEK RİSK';

    const tl = (n: number) => `₺${n.toFixed(2)}`;
    const BOM = '﻿';
    const rows: string[] = [
      BOM + 'BAYİ RİSK DEĞERLENDİRME RAPORU',
      '',
      `Bayi: ${dealer.company}`,
      `Şehir/Bölge: ${dealer.city}/${dealer.region}`,
      `Cari No: ${dealer.cariNo}`,
      `Rapor Tarihi: ${new Date().toLocaleDateString('tr-TR')}`,
      '',
      '--- RİSK METRİKLERİ ---',
      `Toplam Sipariş: ${total}`,
      `Tamamlanan: ${completed} (${((completed/total)*100).toFixed(1)}%)`,
      `İptal Edilen: ${cancelled} (${cancelledRate.toFixed(1)}%)`,
      `İade Edilen: ${returned} (${returnRate.toFixed(1)}%)`,
      '',
      `--- FİNANSAL ---`,
      `Cari Borç: ${tl(dealer.cariBalance)}`,
      `Kredi Limiti: ${tl(dealer.creditLimit)}`,
      `Kredi Kullanım Oranı: %${creditUtilization.toFixed(1)}`,
      '',
      `--- RİSK SKORU: ${riskScore.toFixed(0)}/100 — ${tier} ---`,
    ];

    return Buffer.from(rows.join('\n'), 'utf-8');
  }

  // ─── AGING REPORT ────────────────────────────────────────────────────

  private async generateAgingReport(dealerId: string): Promise<Buffer> {
    const dealer = await this.prisma.dealer.findUnique({ where: { id: dealerId } });
    if (!dealer) throw new BadRequestException('Dealer not found');

    const now = new Date();
    const orders = await this.prisma.order.findMany({
      where: {
        dealerId,
        status: { in: ['APPROVED', 'SHIPPED', 'COMPLETED'] },
      },
      orderBy: { createdAt: 'asc' },
    });

    let bucket30 = 0, bucket60 = 0, bucket90 = 0, bucketOver90 = 0;

    for (const o of orders) {
      const days = Math.floor((now.getTime() - o.createdAt.getTime()) / (1000 * 60 * 60 * 24));
      if (days <= 30) bucket30 += o.total;
      else if (days <= 60) bucket60 += o.total;
      else if (days <= 90) bucket90 += o.total;
      else bucketOver90 += o.total;
    }

    const tl = (n: number) => `₺${n.toFixed(2)}`;
    const BOM = '﻿';
    const total = bucket30 + bucket60 + bucket90 + bucketOver90;
    const rows: string[] = [
      BOM + 'CARİ HESAP YAŞLANDIRMA RAPORU',
      '',
      `Bayi: ${dealer.company}`,
      `Rapor Tarihi: ${new Date().toLocaleDateString('tr-TR')}`,
      '',
      'Vade Dilimi,Tutar (TL),Oran',
      `0-30 Gün,${tl(bucket30)},%${total > 0 ? ((bucket30/total)*100).toFixed(1) : '0.0'}`,
      `31-60 Gün,${tl(bucket60)},%${total > 0 ? ((bucket60/total)*100).toFixed(1) : '0.0'}`,
      `61-90 Gün,${tl(bucket90)},%${total > 0 ? ((bucket90/total)*100).toFixed(1) : '0.0'}`,
      `90+ Gün,${tl(bucketOver90)},%${total > 0 ? ((bucketOver90/total)*100).toFixed(1) : '0.0'}`,
      '',
      `TOPLAM,${tl(total)},%100.0`,
    ];

    return Buffer.from(rows.join('\n'), 'utf-8');
  }

  // ─── PERFORMANCE REPORT ───────────────────────────────────────────────

  private async generatePerformanceReport(dealerId: string): Promise<Buffer> {
    const dealer = await this.prisma.dealer.findUnique({ where: { id: dealerId } });
    if (!dealer) throw new BadRequestException('Dealer not found');

    const year = new Date().getFullYear();
    const orders = await this.prisma.order.findMany({
      where: {
        dealerId,
        status: { in: ['APPROVED', 'SHIPPED', 'COMPLETED'] },
        createdAt: { gte: new Date(year, 0, 1) },
      },
      include: { lines: { include: { product: true } } },
      orderBy: { createdAt: 'asc' },
    });

    const tl = (n: number) => `₺${n.toFixed(2)}`;
    const BOM = '﻿';

    if (orders.length === 0) {
      return Buffer.from(BOM + `${dealer.company} — ${year} Performans Raporu\n\nBu yıl henüz sipariş bulunmamaktadır.`, 'utf-8');
    }

    // Monthly breakdown
    const monthNames = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
    const monthly: Record<number, { count: number; total: number }> = {};
    for (const o of orders) {
      const m = new Date(o.createdAt).getMonth();
      if (!monthly[m]) monthly[m] = { count: 0, total: 0 };
      monthly[m].count++;
      monthly[m].total += o.total;
    }

    const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
    const avgOrder = totalRevenue / orders.length;
    const totalItems = orders.reduce((s, o) => s + o.lines.length, 0);
    const avgItems = totalItems / orders.length;

    // Top products
    const productCounts: Record<string, { name: string; qty: number; total: number }> = {};
    for (const o of orders) {
      for (const l of o.lines) {
        const key = l.productId;
        if (!productCounts[key]) productCounts[key] = { name: l.product?.name || key, qty: 0, total: 0 };
        productCounts[key].qty += l.quantity;
        productCounts[key].total += l.total;
      }
    }
    const topProducts = Object.values(productCounts)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    const rows: string[] = [
      BOM + `${dealer.company} — ${year} YILI PERFORMANS RAPORU`,
      '',
      `Rapor Tarihi: ${new Date().toLocaleDateString('tr-TR')}`,
      '',
      '--- GENEL ÖZET ---',
      `Toplam Sipariş: ${orders.length}`,
      `Toplam Ciro: ${tl(totalRevenue)}`,
      `Ortalama Sipariş: ${tl(avgOrder)}`,
      `Toplam Kalem: ${totalItems}`,
      `Ortalama Kalem/Sipariş: ${avgItems.toFixed(1)}`,
      '',
      '--- AYLIK DAĞILIM ---',
      'Ay,Sipariş,Tutar (TL),Ortalama',
    ];

    for (let m = 0; m < 12; m++) {
      const d = monthly[m] || { count: 0, total: 0 };
      rows.push(`${monthNames[m]},${d.count},${tl(d.total)},${d.count > 0 ? tl(d.total / d.count) : '₺0.00'}`);
    }

    rows.push('');
    rows.push('--- EN ÇOK SATIN ALINAN ÜRÜNLER (Top 10) ---');
    rows.push('Ürün,Adet,Toplam');
    for (const p of topProducts) {
      rows.push(`"${p.name}",${p.qty},${tl(p.total)}`);
    }

    return Buffer.from(rows.join('\n'), 'utf-8');
  }

  // ─── RISK SCORE (JSON) ───────────────────────────────────────────────

  async getRiskScore(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { dealer: true },
    });
    if (!user?.dealer) throw new BadRequestException('Dealer not found');

    const dealer = user.dealer;

    // Önce DB'deki güncel risk skorunu döndür (zaten hesaplanmış)
    // Bu skor reports.service.ts'deki dealerRisk() ile aynı formülle hesaplanır
    return {
      dealerId: dealer.id,
      company: dealer.company,
      totalOrders: dealer.totalOrders,
      score: dealer.riskScore,
      level: dealer.riskLevel,
    };
  }

  /**
   * Admin: List all dealers with full details
   */
  async adminListAll(user?: { sub?: string; id?: string; role?: string }) {
    // PLASIYER sadece kendisine atanmış bayileri görür; ADMIN/SUPER_ADMIN hepsini.
    const where =
      user?.role === 'PLASIYER' ? { salesRepId: user.sub || user.id } : {};

    return this.prisma.dealer.findMany({
      where,
      include: {
        user: { select: { email: true, name: true, phone: true } },
        salesRep: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Bayiye sorumlu plasiyer ata (veya kaldır: plasiyerId=null).
   * Sadece ADMIN/SUPER_ADMIN çağırır (controller guard'ı ile korunur).
   */
  async assignSalesRep(dealerId: string, plasiyerId: string | null) {
    const dealer = await this.prisma.dealer.findUnique({ where: { id: dealerId } });
    if (!dealer) throw new NotFoundException('Bayi bulunamadı');

    if (plasiyerId) {
      const plasiyer = await this.prisma.user.findUnique({ where: { id: plasiyerId } });
      if (!plasiyer) throw new NotFoundException('Plasiyer bulunamadı');
      if (plasiyer.role !== 'PLASIYER') {
        throw new BadRequestException('Seçilen kullanıcı plasiyer değil');
      }
    }

    const updated = await this.prisma.dealer.update({
      where: { id: dealerId },
      data: { salesRepId: plasiyerId },
      include: { salesRep: { select: { id: true, name: true, email: true } } },
    });
    this.logger.log(
      `Dealer ${dealer.company} → plasiyer ${plasiyerId ?? '(kaldırıldı)'}`,
    );
    return updated;
  }

  /**
   * Admin: Approve a dealer
   */
  async approveDealer(dealerId: string, adminUserId: string) {
    const dealer = await this.prisma.dealer.findUnique({ where: { id: dealerId } });
    if (!dealer) throw new NotFoundException('Dealer not found');
    if (dealer.status !== 'PENDING') throw new BadRequestException('Sadece PENDING durumundaki bayiler onaylanabilir');

    const updated = await this.prisma.dealer.update({
      where: { id: dealerId },
      data: {
        status: 'ACTIVE',
        cariValidated: true,
        approvedAt: new Date(),
        approvedBy: adminUserId,
      },
    });
    // Fire-and-forget email
    const user = await this.prisma.user.findUnique({ where: { id: updated.userId }, select: { email: true } });
    if (user) this.mailerService.sendDealerApproved(user.email, updated.company).catch(() => {});
    return updated;
  }

  /**
   * Admin: Reject a dealer
   */
  async rejectDealer(dealerId: string, adminUserId: string, reason: string) {
    const dealer = await this.prisma.dealer.findUnique({ where: { id: dealerId } });
    if (!dealer) throw new NotFoundException('Dealer not found');

    return this.prisma.dealer.update({
      where: { id: dealerId },
      data: {
        status: 'REJECTED',
        rejectionReason: reason,
        approvedBy: adminUserId,
      },
    });
  }

  async updateCreditLimit(dealerId: string, creditLimit: number) {
    const dealer = await this.prisma.dealer.findUnique({ where: { id: dealerId } });
    if (!dealer) throw new NotFoundException('Dealer not found');

    return this.prisma.dealer.update({
      where: { id: dealerId },
      data: { creditLimit },
    });
  }
}
