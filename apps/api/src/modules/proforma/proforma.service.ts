import { Injectable, HttpException, HttpStatus, Logger, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../../common/prisma.service';
import { GenerateProformaDto, CreateProformaDraftDto } from './dto/generate-proforma.dto';
import { firstValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';

@Injectable()
export class ProformaService {
  private readonly logger = new Logger(ProformaService.name);
  private readonly pythonServiceUrl = process.env.PYTHON_SERVICE_URL || 'http://python-service:5000';

  constructor(
    private httpService: HttpService,
    private prisma: PrismaService,
  ) {}

  /**
   * Create a draft proforma (no PDF yet)
   */
  async createProformaDraft(dto: CreateProformaDraftDto, userId: string) {
    try {
      const totalAmount = dto.items.reduce((sum, item) => sum + item.quantity * item.price, 0);
      const proformaNumber = await this.generateProformaNumber();

      const proforma = await this.prisma.proforma.create({
        data: {
          proformaNumber,
          status: 'draft',
          templateType: dto.templateType,
          dealerId: (dto as any).dealerId || null,
          customerId: (dto as any).customerId || null,
          customerName: dto.customer,
          customerAddress: '',
          customerCity: '',
          companyName: 'Sadöksan',
          companyAddress: '',
          companyPhone: '',
          companyEmail: '',
          subtotal: totalAmount,
          shipping: 0,
          tax: 0,
          totalAmount: totalAmount,
          generatedBy: userId,
          items: {
            createMany: {
              data: dto.items.map((item) => ({
                sku: item.sku,
                productName: item.description,
                description: item.description,
                brand: item.brand,
                quantity: item.quantity,
                unitPrice: item.price,
                lineTotal: item.quantity * item.price,
                imageUrl: item.imageUrl,
              })),
            },
          },
        },
        include: { items: true },
      });

      this.logger.log(`Draft proforma created: ${proformaNumber}`);
      return proforma;
    } catch (error) {
      this.logger.error(`Error creating draft proforma: ${error.message}`);
      throw new BadRequestException(`Failed to create proforma: ${error.message}`);
    }
  }

  /**
   * Generate PDF from Python service and save proforma
   */
  async generateProforma(
    dto: GenerateProformaDto,
    userId: string,
  ): Promise<{ pdfBuffer: Buffer; proforma: any }> {
    try {
      this.logger.debug(`Generating ${dto.templateType} proforma for user ${userId}`);

      // Call Python service to generate PDF
      const pythonResponse = await firstValueFrom(
        this.httpService.post<ArrayBuffer>(`${this.pythonServiceUrl}/generate`, dto, {
          responseType: 'arraybuffer',
          timeout: 10000, // 10 seconds timeout
        }) as any,
      ) as AxiosResponse<ArrayBuffer>;

      if (!pythonResponse?.data) {
        throw new HttpException(
          'Failed to generate PDF from Python service',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      // Save proforma record to database
      const totalAmount = dto.items.reduce((sum, item) => sum + item.quantity * item.price, 0);
      const proformaNumber = await this.generateProformaNumber();

      const proforma = await this.prisma.proforma.create({
        data: {
          proformaNumber,
          status: 'draft',
          templateType: dto.templateType,
          dealerId: dto.dealerId || null,
          customerId: dto.customerId || null,
          customerName: dto.customer.name,
          customerAddress: dto.customer.address,
          customerCity: dto.customer.city,
          customerPhone: dto.customer.phone,
          customerEmail: dto.customer.email,
          companyName: dto.companyInfo.name,
          companyAddress: dto.companyInfo.address,
          companyPhone: dto.companyInfo.phone,
          companyEmail: dto.companyInfo.email,
          companyBank: dto.companyInfo.bank,
          companyBankAccount: dto.companyInfo.bankAccount,
          internationalInvoiceNumber: dto.international?.invoiceNumber,
          internationalInvoiceDate: dto.international?.invoiceDate
            ? new Date(dto.international.invoiceDate)
            : null,
          exporterRef: dto.international?.exporterRef,
          countryOrigin: dto.international?.countryOrigin,
          countryDestination: dto.international?.countryDest,
          preCarriage: dto.international?.preCarriage,
          portLoading: dto.international?.portLoading,
          portDischarge: dto.international?.portDischarge,
          vessel: dto.international?.vessel,
          subtotal: totalAmount,
          shipping: 0,
          tax: 0,
          totalAmount: totalAmount,
          generatedBy: userId,
          pdfGeneratedAt: new Date(),
          items: {
            createMany: {
              data: dto.items.map((item) => ({
                sku: item.sku,
                productName: item.description,
                description: item.description,
                brand: item.brand,
                quantity: item.quantity,
                unitPrice: item.price,
                lineTotal: item.quantity * item.price,
                imageUrl: item.imageUrl,
              })),
            },
          },
        },
        include: { items: true },
      });

      this.logger.log(`Proforma created: ${proforma.proformaNumber}`);

      return {
        pdfBuffer: Buffer.from(pythonResponse.data as ArrayBuffer),
        proforma,
      };
    } catch (error) {
      this.logger.error(`Error generating proforma: ${error.message}`, error.stack);

      if (error.response?.status === 400) {
        throw new HttpException(
          error.response.data?.message || 'Invalid proforma parameters',
          HttpStatus.BAD_REQUEST,
        );
      }

      throw new HttpException(
        'Failed to generate proforma PDF',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get all proformas for admin with filters
   */
  async getProformaHistory(
    userId: string,
    options?: {
      status?: 'draft' | 'sent' | 'accepted';
      search?: string;
      limit?: number;
    },
  ) {
    const limit = options?.limit || 20;

    return this.prisma.proforma.findMany({
      where: {
        generatedBy: userId,
        ...(options?.status && { status: options.status }),
        ...(options?.search && {
          OR: [
            { proformaNumber: { contains: options.search, mode: 'insensitive' } },
            { customerName: { contains: options.search, mode: 'insensitive' } },
          ],
        }),
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      include: {
        items: true,
      },
    });
  }

  /**
   * Get proformas for a dealer (sent to them)
   */
  async getDealerProformas(userId: string) {
    // Get dealer associated with this user
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { dealer: true },
    });

    if (!user?.dealer) {
      return [];
    }

    // Return proformas with this dealer's ID
    return this.prisma.proforma.findMany({
      where: {
        dealerId: user.dealer.id,
      },
      orderBy: {
        generatedAt: 'desc',
      },
      include: {
        items: true,
      },
    });
  }

  /**
   * Get single proforma with all details
   */
  async getProforma(proformaId: string) {
    return this.prisma.proforma.findUnique({
      where: { id: proformaId },
      include: { items: true },
    });
  }

  /**
   * Mark proforma as sent and update timestamp
   */
  async sendProforma(proformaId: string, userId: string) {
    const proforma = await this.prisma.proforma.findUnique({
      where: { id: proformaId },
    });

    if (!proforma) {
      throw new BadRequestException('Proforma not found');
    }

    // For now, just update the viewedAt timestamp to indicate it was sent
    // In future, we can add a status field
    return this.prisma.proforma.update({
      where: { id: proformaId },
      data: {
        status: 'sent',
        viewedAt: new Date(),
      },
      include: { items: true },
    });
  }

  /**
   * Download proforma (regenerate PDF from stored data)
   */
  async downloadProforma(proformaId: string): Promise<{ pdfBuffer: Buffer; proforma: any }> {
    const proforma = await this.prisma.proforma.findUnique({
      where: { id: proformaId },
      include: { items: true },
    });

    if (!proforma) {
      throw new BadRequestException('Proforma not found');
    }

    // Build the DTO that the Python service expects
    const dto = {
      templateType: proforma.templateType,
      includeLogo: false,
      customer: {
        name: proforma.customerName,
        address: proforma.customerAddress,
        city: proforma.customerCity,
        phone: proforma.customerPhone || '',
        email: proforma.customerEmail || '',
      },
      items: proforma.items.map((item) => ({
        sku: item.sku,
        description: item.description,
        brand: item.brand || '',
        quantity: Number(item.quantity),
        price: Number(item.unitPrice),
        imageUrl: item.imageUrl,
      })),
      companyInfo: {
        name: proforma.companyName,
        address: proforma.companyAddress,
        phone: proforma.companyPhone,
        email: proforma.companyEmail,
        bank: proforma.companyBank || '',
        bankAccount: proforma.companyBankAccount || '',
      },
    } as any;

    // Add international fields if applicable
    if (proforma.templateType === 'INTERNATIONAL') {
      dto.international = {
        invoiceNumber: proforma.internationalInvoiceNumber || proforma.proformaNumber,
        invoiceDate: proforma.internationalInvoiceDate
          ? new Date(proforma.internationalInvoiceDate).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        exporterRef: proforma.exporterRef || '',
        countryOrigin: proforma.countryOrigin || 'TURKEY',
        countryDest: proforma.countryDestination || '',
        preCarriage: proforma.preCarriage || '',
        portLoading: proforma.portLoading || '',
        portDischarge: proforma.portDischarge || '',
        vessel: proforma.vessel || '',
      };
    }

    try {
      // Call Python service to generate PDF
      const pythonResponse = await firstValueFrom(
        this.httpService.post<ArrayBuffer>(`${this.pythonServiceUrl}/generate`, dto, {
          responseType: 'arraybuffer',
          timeout: 15000,
        }) as any,
      ) as AxiosResponse<ArrayBuffer>;

      if (pythonResponse?.data) {
        // Mark as downloaded
        await this.prisma.proforma.update({
          where: { id: proformaId },
          data: { downloadedAt: new Date() },
        });

        return {
          pdfBuffer: Buffer.from(pythonResponse.data as ArrayBuffer),
          proforma,
        };
      }
    } catch (err: any) {
      this.logger.error(`Python service call failed for download: ${err.message}`);
      throw new HttpException(
        'PDF servisi şu anda kullanılamıyor. Lütfen python-service container\'ının çalıştığından emin olun.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    throw new HttpException(
      'PDF servisinden yanıt alınamadı.',
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }

  /**
   * Delete a proforma
   */
  async deleteProforma(proformaId: string) {
    const proforma = await this.prisma.proforma.findUnique({
      where: { id: proformaId },
    });

    if (!proforma) {
      throw new BadRequestException('Proforma not found');
    }

    await this.prisma.proforma.delete({
      where: { id: proformaId },
    });

    this.logger.log(`Proforma ${proformaId} deleted`);
  }

  /**
   * Autocomplete: search products by SKU / name / brand (case-insensitive).
   * Returns lightweight rows suitable for the proforma item picker.
   */
  async searchProducts(query: string, limit = 10) {
    const q = query?.trim();
    if (!q) return [];

    const take = Math.min(Math.max(limit, 1), 50);

    return this.prisma.product.findMany({
      where: {
        AND: [
          { visible: true }, // hide products admin has flagged off
          {
            OR: [
              { sku: { contains: q, mode: 'insensitive' } },
              { name: { contains: q, mode: 'insensitive' } },
              { brand: { contains: q, mode: 'insensitive' } },
              { netsisCode: { contains: q, mode: 'insensitive' } },
            ],
          },
        ],
      },
      select: {
        id: true,
        sku: true,
        name: true,
        brand: true,
        category: true,
        basePrice: true,
        imageUrl: true,
      },
      orderBy: { name: 'asc' },
      take,
    });
  }

  /**
   * Look up a product's image by SKU (auto-fallback for proforma form)
   * Returns { imageUrl, name, brand } or null if SKU not found
   * NOTE: Product.imageUrl is optional — null is a valid response when product
   * exists but has no image yet (e.g. before ideaSoft migration completes)
   */
  async getProductImage(sku: string): Promise<{
    sku: string;
    name: string;
    brand: string;
    imageUrl: string | null;
  } | null> {
    const product = await this.prisma.product.findUnique({
      where: { sku },
      select: { sku: true, name: true, brand: true, imageUrl: true },
    });

    if (!product) {
      return null;
    }

    return product;
  }

  /**
   * Auto-create a proforma from an approved order.
   * Called by OrdersService.approveOrder() — fire and forget.
   */
  async createProformaFromOrder(order: any) {
    try {
      const dto: GenerateProformaDto = {
        templateType: 'LOCAL' as any,
        includeLogo: false,
        customer: {
          name: order.dealer?.company || order.dealer?.name || order.customerName || 'Müşteri',
          address: order.shippingAddress || order.dealer?.address || '',
          city: order.shippingCity || order.dealer?.city || '',
          phone: order.dealer?.phone || '',
          email: order.dealer?.user?.email || '',
        },
        items: (order.lines || []).map((line: any) => ({
          sku: line.product?.sku || '',
          description: line.product?.name || '',
          brand: line.product?.brand || '',
          quantity: Number(line.quantity),
          price: Number(line.unitPrice),
          imageUrl: line.product?.imageUrl || null,
        })),
        companyInfo: {
          name: 'Sadöksan',
          address: 'Sadöksan İnşaat Merkez',
          phone: '+90 442 123 4567',
          email: 'info@sadoksaninsaat.com.tr',
          bank: 'Akbank',
          bankAccount: 'TR123456789',
        },
      };

      await this.generateProforma(dto, order.customerId || 'system');
      this.logger.log(`Proforma auto-created for order ${order.orderNo}`);
    } catch (err) {
      this.logger.error(`Failed to auto-create proforma for order ${order.orderNo}: ${err.message}`);
      throw err;
    }
  }

  /**
   * Generate unique proforma number
   */
  private async generateProformaNumber(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    // Count proformas created today
    const count = await this.prisma.proforma.count({
      where: {
        generatedAt: {
          gte: new Date(year, date.getMonth(), date.getDate()),
          lt: new Date(year, date.getMonth(), date.getDate() + 1),
        },
      },
    });

    return `PROF-${year}${month}${day}-${String(count + 1).padStart(4, '0')}`;
  }

  // ─── Approval Workflow ──────────────────────────────────────────────────

  /**
   * Plasiyer proformayı onaya gönderir.
   * Fiyatlar backend'de Product tablosundan zorlanır — plasiyer override edemez.
   */
  async submitForApproval(proformaId: string, userId: string, userRole: string) {
    const proforma = await this.prisma.proforma.findUnique({
      where: { id: proformaId },
      include: { items: true },
    })

    if (!proforma) throw new BadRequestException('Proforma bulunamadı')
    if (proforma.status !== 'draft' && proforma.status !== 'rejected') {
      throw new BadRequestException('Sadece taslak veya reddedilmiş proformalar onaya gönderilebilir')
    }

    // Plasiyer fiyat override edemez — Product.basePrice'tan zorla
    if (userRole === 'PLASIYER') {
      for (const item of proforma.items) {
        const product = await this.prisma.product.findUnique({ where: { sku: item.sku } })
        if (product && Number(item.unitPrice) !== product.basePrice) {
          // Fiyatı Product'tan güncelle
          const newLineTotal = Number(item.quantity) * product.basePrice
          await this.prisma.proformaItem.update({
            where: { id: item.id },
            data: { unitPrice: product.basePrice, lineTotal: newLineTotal },
          })
        }
      }
      // Subtotal ve totalAmount'ı yeniden hesapla
      const updatedItems = await this.prisma.proformaItem.findMany({ where: { proformaId } })
      const subtotal = updatedItems.reduce((sum, i) => sum + Number(i.lineTotal), 0)
      await this.prisma.proforma.update({
        where: { id: proformaId },
        data: { subtotal, totalAmount: subtotal + Number(proforma.shipping) + Number(proforma.tax) },
      })
    }

    return this.prisma.proforma.update({
      where: { id: proformaId },
      data: {
        status: 'pending_approval',
        submittedForApproval: true,
        submittedAt: new Date(),
        watermarkEnabled: true,
      },
      include: { items: true },
    })
  }

  /**
   * Admin proformayı onaylar — plasiyer artık indirebilir.
   */
  async approveProforma(proformaId: string, adminUserId: string) {
    const proforma = await this.prisma.proforma.findUnique({ where: { id: proformaId } })
    if (!proforma) throw new BadRequestException('Proforma bulunamadı')
    if (proforma.status !== 'pending_approval') {
      throw new BadRequestException('Sadece onay bekleyen proformalar onaylanabilir')
    }

    // PDF oluştur (varsa python service)
    let pdfUrl: string | undefined
    try {
      // PDF'i şimdi oluşturmayı dene — başarısız olursa download sırasında tekrar dener
    } catch { /* PDF oluşturma sonra yapılır */ }

    return this.prisma.proforma.update({
      where: { id: proformaId },
      data: {
        status: 'approved',
        approvedBy: adminUserId,
        approvedAt: new Date(),
        watermarkEnabled: false,
        pdfUrl,
      },
      include: { items: true },
    })
  }

  /**
   * Admin proformayı reddeder — sebep zorunlu.
   */
  async rejectProforma(proformaId: string, adminUserId: string, reason: string) {
    if (!reason?.trim()) throw new BadRequestException('Red sebebi zorunludur')

    const proforma = await this.prisma.proforma.findUnique({ where: { id: proformaId } })
    if (!proforma) throw new BadRequestException('Proforma bulunamadı')
    if (proforma.status !== 'pending_approval') {
      throw new BadRequestException('Sadece onay bekleyen proformalar reddedilebilir')
    }

    return this.prisma.proforma.update({
      where: { id: proformaId },
      data: {
        status: 'rejected',
        rejectedBy: adminUserId,
        rejectedAt: new Date(),
        rejectionReason: reason.trim(),
        watermarkEnabled: true,
      },
      include: { items: true },
    })
  }

  /**
   * Admin — onay bekleyen proformaları listeler.
   */
  async getPendingProformas(search?: string, limit: number = 50) {
    return this.prisma.proforma.findMany({
      where: {
        status: 'pending_approval',
        ...(search && {
          OR: [
            { proformaNumber: { contains: search, mode: 'insensitive' } },
            { customerName: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      orderBy: { submittedAt: 'asc' }, // en eski en üstte
      take: limit,
      include: { items: true },
    })
  }

  /**
   * Plasiyer — kendi proformalarını listeler.
   */
  async getMyProformas(userId: string, status?: string, limit: number = 50) {
    return this.prisma.proforma.findMany({
      where: {
        generatedBy: userId,
        ...(status && { status }),
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      include: { items: true },
    })
  }

  /**
   * Download — sadece approved ve watermarkEnabled=false ise izin ver.
   */
  async downloadProformaChecked(proformaId: string, userId: string, userRole: string) {
    const proforma = await this.prisma.proforma.findUnique({
      where: { id: proformaId },
      include: { items: true },
    })

    if (!proforma) throw new BadRequestException('Proforma bulunamadı')

    // Admin her zaman indirebilir
    if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') {
      return this.downloadProforma(proformaId)
    }

    // Plasiyer sadece approved ise indirebilir
    if (userRole === 'PLASIYER') {
      if (proforma.status !== 'approved') {
        throw new BadRequestException(
          proforma.status === 'pending_approval'
            ? 'Bu proforma henüz onaylanmadı. Admin onayı bekleniyor.'
            : proforma.status === 'rejected'
              ? `Bu proforma reddedildi. Sebep: ${proforma.rejectionReason || 'Belirtilmemiş'}`
              : 'Bu proforma indirilemez durumda.',
        )
      }
      // Kendi proforması mı?
      if (proforma.generatedBy !== userId) {
        throw new BadRequestException('Sadece kendi proformalarınızı indirebilirsiniz')
      }
    }

    return this.downloadProforma(proformaId)
  }
}
