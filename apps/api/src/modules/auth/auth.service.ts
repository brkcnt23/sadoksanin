import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../common/prisma.service';
import * as bcrypt from 'bcryptjs';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: CreateUserDto) {
    // Check if user exists
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new BadRequestException('Email already registered');
    }

    const role = dto.role || 'CUSTOMER';

    // Validate dealer-specific fields
    if (role === 'DEALER') {
      if (!dto.company) throw new BadRequestException('İşletme adı zorunludur');
      if (!dto.contactPerson) throw new BadRequestException('İletişim kişisi zorunludur');
      if (!dto.cariNo) throw new BadRequestException('Cari hesap numarası zorunludur');
      if (!dto.taxNo) throw new BadRequestException('Vergi numarası zorunludur');
      if (!dto.city) throw new BadRequestException('Şehir zorunludur');

      const existingCari = await this.prisma.dealer.findUnique({
        where: { cariNo: dto.cariNo },
      });
      if (existingCari) {
        throw new BadRequestException('Bu cari hesap numarası zaten kayıtlı');
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        password: hashedPassword,
        role,
        phone: dto.phone,
        address: dto.address,
        city: dto.city,
      },
    });

    // If dealer, create Dealer record (PENDING status - requires admin approval)
    if (role === 'DEALER') {
      await this.prisma.dealer.create({
        data: {
          userId: user.id,
          name: dto.company!,
          company: dto.company!,
          contactPerson: dto.contactPerson!,
          phone: dto.phone || '',
          cariNo: dto.cariNo!,
          taxNo: dto.taxNo!,
          taxOffice: dto.taxOffice || '',
          city: dto.city!,
          region: dto.region || 'Marmara',
          address: dto.address || '',
          status: 'PENDING',
        },
      });
    }

    // Return token
    return this.generateToken(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateToken(user);
  }

  async updateProfile(userId: string, data: { name?: string; phone?: string; city?: string; address?: string }) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('Kullanıcı bulunamadı');

    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        city: true,
        address: true,
      },
    });
  }

  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        dealer: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Don't reveal whether the email exists
      return { message: 'Şifre sıfırlama bağlantısı email adresinize gönderildi.' };
    }

    const resetToken = this.jwtService.sign(
      { sub: user.id, email: user.email, purpose: 'password-reset' },
      { expiresIn: '15m' },
    );

    // In production, send this via email. For dev, return the reset URL.
    const resetUrl = `${process.env.STOREFRONT_URL || 'http://localhost:3000'}/sifre-sifirla?token=${resetToken}`;

    return {
      message: 'Şifre sıfırlama bağlantısı email adresinize gönderildi.',
      resetUrl,
    };
  }

  async resetPassword(token: string, newPassword: string) {
    let payload: { sub: string; email: string; purpose: string };
    try {
      payload = this.jwtService.verify(token);
    } catch {
      throw new BadRequestException('Geçersiz veya süresi dolmuş bağlantı.');
    }

    if (payload.purpose !== 'password-reset') {
      throw new BadRequestException('Geçersiz bağlantı.');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: payload.sub },
      data: { password: hashedPassword },
    });

    return { message: 'Şifreniz başarıyla değiştirildi.' };
  }

  // ─── Address Book ──────────────────────────────────────────────────────

  async listAddresses(userId: string) {
    return this.prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async createAddress(
    userId: string,
    data: { title: string; address: string; city: string; district?: string; isDefault?: boolean },
  ) {
    if (data.isDefault) {
      await this.prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
    }
    const count = await this.prisma.address.count({ where: { userId } });
    return this.prisma.address.create({
      data: {
        userId,
        title: data.title,
        address: data.address,
        city: data.city,
        district: data.district,
        isDefault: data.isDefault ?? count === 0,
      },
    });
  }

  async updateAddress(
    userId: string,
    addressId: string,
    data: { title?: string; address?: string; city?: string; district?: string; isDefault?: boolean },
  ) {
    const addr = await this.prisma.address.findUnique({ where: { id: addressId } });
    if (!addr || addr.userId !== userId) throw new BadRequestException('Adres bulunamadı');

    if (data.isDefault) {
      await this.prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
    }
    return this.prisma.address.update({ where: { id: addressId }, data });
  }

  async deleteAddress(userId: string, addressId: string) {
    const addr = await this.prisma.address.findUnique({ where: { id: addressId } });
    if (!addr || addr.userId !== userId) throw new BadRequestException('Adres bulunamadı');

    const deleted = await this.prisma.address.delete({ where: { id: addressId } });

    // If deleted was the default, make another one default
    if (deleted.isDefault) {
      const next = await this.prisma.address.findFirst({ where: { userId }, orderBy: { createdAt: 'asc' } });
      if (next) {
        await this.prisma.address.update({ where: { id: next.id }, data: { isDefault: true } });
      }
    }
    return deleted;
  }

  private generateToken(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const token = this.jwtService.sign(payload, {
      expiresIn: '7d',
    });

    return {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }
}
