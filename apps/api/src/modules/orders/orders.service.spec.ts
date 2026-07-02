import { Test, TestingModule } from '@nestjs/testing'
import { OrdersService } from './orders.service'
import { PrismaService } from '../../prisma/prisma.service'
import { BadRequestException, NotFoundException } from '@nestjs/common'

describe('OrdersService — unapproveOrder', () => {
  let service: OrdersService
  let prisma: any

  beforeEach(async () => {
    prisma = {
      order: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      stockReservation: { findMany: jest.fn(), updateMany: jest.fn() },
      product: { findUnique: jest.fn(), update: jest.fn() },
      stockMovement: { create: jest.fn() },
      orderStatusHistory: { create: jest.fn() },
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile()

    service = module.get<OrdersService>(OrdersService)
  })

  describe('unapproveOrder', () => {
    it('should revert APPROVED to PENDING_APPROVAL', async () => {
      prisma.order.findUnique.mockResolvedValue({ id: 'ord-1', status: 'APPROVED', customerType: 'B2B' })
      prisma.order.update.mockResolvedValue({ id: 'ord-1', status: 'PENDING_APPROVAL' })

      const result = await service.unapproveOrder('ord-1', 'user-1')
      expect(result.status).toBe('PENDING_APPROVAL')
    })

    it('should throw if order not found', async () => {
      prisma.order.findUnique.mockResolvedValue(null)
      await expect(service.unapproveOrder('bad-id', 'user-1')).rejects.toThrow(NotFoundException)
    })

    it('should throw if order is not APPROVED', async () => {
      prisma.order.findUnique.mockResolvedValue({ id: 'ord-1', status: 'SHIPPED' })
      await expect(service.unapproveOrder('ord-1', 'user-1')).rejects.toThrow(BadRequestException)
    })

    it('should throw if order is PENDING_APPROVAL', async () => {
      prisma.order.findUnique.mockResolvedValue({ id: 'ord-1', status: 'PENDING_APPROVAL' })
      await expect(service.unapproveOrder('ord-1', 'user-1')).rejects.toThrow(BadRequestException)
    })
  })
})
