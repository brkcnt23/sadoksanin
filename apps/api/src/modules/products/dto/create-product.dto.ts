import { IsString, IsNumber, IsOptional, IsBoolean, Min } from 'class-validator';

export class CreateProductDto {
  @IsString()
  sku: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsString()
  category: string;

  @IsNumber()
  @Min(0)
  basePrice: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  taxRate?: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsString()
  netsisCode?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  netsisStock?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  netsisPendingQuantity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minimumStock?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  middleStock?: number;

  @IsOptional()
  @IsBoolean()
  visible?: boolean;

  @IsOptional()
  @IsBoolean()
  purchasable?: boolean;

  @IsOptional()
  @IsString()
  imageUrl?: string;
  images?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number;
}
