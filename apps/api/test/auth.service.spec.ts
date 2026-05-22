import { BadRequestException, UnauthorizedException } from '@nestjs/common';

// We test AuthService as a plain class by constructing it with mock dependencies.
// This avoids NestJS TestModule DI complexity for unit tests.

const mockPrisma = {
  user: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
  dealer: { findUnique: jest.fn(), create: jest.fn() },
};

const mockJwtService = {
  sign: jest.fn().mockReturnValue('test-jwt-token'),
};

let authService: any;

// We use require() to avoid TypeScript decorator metadata issues
const { AuthService } = require('../src/modules/auth/auth.service');

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    authService = new AuthService(mockPrisma, mockJwtService);
  });

  describe('register', () => {
    it('should create a CUSTOMER user and return a token', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-1', email: 'test@test.com', name: 'Test', role: 'CUSTOMER',
      });

      const result = await authService.register({
        email: 'test@test.com', password: '123456', name: 'Test',
      });

      expect(result.access_token).toBe('test-jwt-token');
      expect(result.user.role).toBe('CUSTOMER');
    });

    it('should throw if email already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(
        authService.register({ email: 'test@test.com', password: '123456', name: 'Test' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create a DEALER with Dealer record', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.dealer.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-2', email: 'dealer@test.com', name: 'Bayi', role: 'DEALER',
      });

      const result = await authService.register({
        email: 'dealer@test.com', password: '123456', name: 'Bayi',
        role: 'DEALER', company: 'Test Ltd', contactPerson: 'Bayi',
        cariNo: '120.01.0001', taxNo: '1234567890', city: 'Istanbul',
      });

      expect(result.user.role).toBe('DEALER');
      expect(mockPrisma.dealer.create).toHaveBeenCalledTimes(1);
    });

    it('should reject DEALER registration without company', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        authService.register({
          email: 'dealer@test.com', password: '123456', name: 'Bayi', role: 'DEALER',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject duplicate cariNo', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.dealer.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(
        authService.register({
          email: 'dealer@test.com', password: '123456', name: 'Bayi',
          role: 'DEALER', company: 'T', contactPerson: 'X',
          cariNo: '120.01.0001', taxNo: '1', city: 'I',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('login', () => {
    it('should return token for valid credentials', async () => {
      const bcrypt = require('bcryptjs');
      const hash = await bcrypt.hash('asd123', 10);

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1', email: 'test@test.com', password: hash, name: 'Test', role: 'CUSTOMER',
      });

      const result = await authService.login({ email: 'test@test.com', password: 'asd123' });
      expect(result.access_token).toBe('test-jwt-token');
    });

    it('should throw for wrong password', async () => {
      const bcrypt = require('bcryptjs');
      const hash = await bcrypt.hash('asd123', 10);

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1', email: 'test@test.com', password: hash, name: 'Test', role: 'CUSTOMER',
      });

      await expect(
        authService.login({ email: 'test@test.com', password: 'wrongpass' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw for unknown email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        authService.login({ email: 'ghost@test.com', password: 'asd123' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('updateProfile', () => {
    it('should update user profile fields', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1' });
      mockPrisma.user.update.mockResolvedValue({
        id: 'user-1', name: 'Updated', email: 't@t.com', role: 'CUSTOMER',
        phone: '0555', city: 'Istanbul', address: 'New St',
      });

      const result = await authService.updateProfile('user-1', {
        name: 'Updated', phone: '0555', city: 'Istanbul',
      });

      expect(result.name).toBe('Updated');
      expect(result.phone).toBe('0555');
    });
  });
});
