import { IsString, IsNumber, IsArray, ValidateNested, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

class OrderLineDto {
  @IsString()
  productId: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  unitPrice: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  taxRate?: number; // 0.2 for 20% VAT
}

export class CreateOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderLineDto)
  items: OrderLineDto[];

  @IsString()
  customerType: 'B2C' | 'B2B';

  @IsOptional()
  @IsString()
  dealerId?: string;

  @IsString()
  shippingCity: string;

  @IsString()
  shippingAddress: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  logisticsSurcharge?: number;

  @IsOptional()
  @IsString()
  promoCode?: string;

  @IsOptional()
  @IsString()
  paymentMethod?: string; // CREDIT_CARD | BANK_TRANSFER

  @IsOptional()
  @IsString()
  notes?: string;
}
