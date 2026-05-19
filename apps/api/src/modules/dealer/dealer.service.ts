import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class DealerService {
  private readonly logger = new Logger(DealerService.name);

  constructor(private prisma: PrismaService) {}

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
   * Export cari statement as Excel buffer
   */
  async exportCariStatement(userId: string): Promise<Buffer> {
    try {
      const transactions = await this.getCariTransactions(userId);

      // For now, return a mock Excel buffer
      // In production, use xlsx library to generate proper Excel file
      const mockExcel = Buffer.from('Mock Excel Content for Cari Statement');
      return mockExcel;
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
        case 'stock':
          return await this.generateStockReport(user.dealer.id);
        default:
          throw new BadRequestException(`Unknown report type: ${reportType}`);
      }
    } catch (error) {
      this.logger.error(`Error generating report: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate monthly report
   */
  private async generateMonthlyReport(dealerId: string): Promise<Buffer> {
    this.logger.debug(`Generating monthly report for dealer ${dealerId}`);

    const currentMonth = new Date();
    const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

    const orders = await this.prisma.order.findMany({
      where: {
        dealerId,
        createdAt: {
          gte: firstDay,
          lte: lastDay,
        },
      },
      include: {
        lines: true,
      },
    });

    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const totalOrders = orders.length;

    // Return mock Excel buffer
    const mockData = `Monthly Report\nTotal Orders: ${totalOrders}\nTotal Revenue: ${totalRevenue}`;
    return Buffer.from(mockData);
  }

  /**
   * Generate yearly report
   */
  private async generateYearlyReport(dealerId: string): Promise<Buffer> {
    this.logger.debug(`Generating yearly report for dealer ${dealerId}`);

    const currentYear = new Date().getFullYear();
    const firstDay = new Date(currentYear, 0, 1);
    const lastDay = new Date(currentYear, 11, 31);

    const orders = await this.prisma.order.findMany({
      where: {
        dealerId,
        createdAt: {
          gte: firstDay,
          lte: lastDay,
        },
      },
    });

    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const totalOrders = orders.length;

    const mockData = `Yearly Report ${currentYear}\nTotal Orders: ${totalOrders}\nTotal Revenue: ${totalRevenue}`;
    return Buffer.from(mockData);
  }

  /**
   * Generate invoice report (all invoices)
   */
  private async generateInvoiceReport(dealerId: string): Promise<Buffer> {
    this.logger.debug(`Generating invoice report for dealer ${dealerId}`);

    const orders = await this.prisma.order.findMany({
      where: {
        dealerId,
      },
      include: {
        lines: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const mockData = `Invoice Report\nTotal Invoices: ${orders.length}\nTotal Value: ${orders.reduce((sum, o) => sum + o.total, 0)}`;
    return Buffer.from(mockData);
  }

  /**
   * Generate stock report (product pricing and availability)
   */
  private async generateStockReport(dealerId: string): Promise<Buffer> {
    this.logger.debug(`Generating stock report for dealer ${dealerId}`);

    const products = await this.prisma.product.findMany({
      where: {
        visible: true,
        purchasable: true,
      },
      take: 100,
    });

    const mockData = `Stock Report\nTotal Products: ${products.length}\nProducts with stock: ${products.filter((p) => p.displayStock > 0).length}`;
    return Buffer.from(mockData);
  }

  /**
   * Admin: List all dealers with full details
   */
  async adminListAll() {
    return this.prisma.dealer.findMany({
      include: { user: { select: { email: true, name: true, phone: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Admin: Approve a dealer
   */
  async approveDealer(dealerId: string, adminUserId: string) {
    const dealer = await this.prisma.dealer.findUnique({ where: { id: dealerId } });
    if (!dealer) throw new NotFoundException('Dealer not found');
    if (dealer.status !== 'PENDING') throw new BadRequestException('Sadece PENDING durumundaki bayiler onaylanabilir');

    return this.prisma.dealer.update({
      where: { id: dealerId },
      data: {
        status: 'ACTIVE',
        cariValidated: true,
        approvedAt: new Date(),
        approvedBy: adminUserId,
      },
    });
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
}
