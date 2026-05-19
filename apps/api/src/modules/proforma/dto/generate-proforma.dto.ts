import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  ValidateNested,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

enum ProformaTemplate {
  LOCAL = 'LOCAL',
  INTERNATIONAL = 'INTERNATIONAL',
}

export class ProformaCustomerDto {
  @IsString()
  name: string;

  @IsString()
  address: string;

  @IsString()
  city: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  email?: string;
}

export class ProformaCompanyInfoDto {
  @IsString()
  name: string;

  @IsString()
  address: string;

  @IsString()
  phone: string;

  @IsString()
  email: string;

  @IsOptional()
  @IsString()
  bank?: string;

  @IsOptional()
  @IsString()
  bankAccount?: string;
}

export class ProformaItemDto {
  @IsString()
  sku: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  price: number;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}

export class ProformaInternationalDto {
  @IsOptional()
  @IsString()
  invoiceNumber?: string;

  @IsOptional()
  @IsDateString()
  invoiceDate?: string;

  @IsOptional()
  @IsString()
  exporterRef?: string;

  @IsOptional()
  @IsString()
  countryOrigin?: string;

  @IsOptional()
  @IsString()
  countryDest?: string;

  @IsOptional()
  @IsString()
  preCarriage?: string;

  @IsOptional()
  @IsString()
  pickupLocation?: string;

  @IsOptional()
  @IsString()
  portLoading?: string;

  @IsOptional()
  @IsString()
  portDischarge?: string;

  @IsOptional()
  @IsString()
  vessel?: string;
}

export class GenerateProformaDto {
  @IsEnum(ProformaTemplate)
  templateType: ProformaTemplate;

  @IsOptional()
  @Type(() => Boolean)
  includeLogo?: boolean = false;

  @ValidateNested()
  @Type(() => ProformaCustomerDto)
  customer: ProformaCustomerDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProformaItemDto)
  items: ProformaItemDto[];

  @ValidateNested()
  @Type(() => ProformaCompanyInfoDto)
  companyInfo: ProformaCompanyInfoDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ProformaInternationalDto)
  international?: ProformaInternationalDto;
}

/**
 * DTO for creating draft proformas (without PDF generation)
 */
export class CreateProformaDraftDto {
  @IsEnum(ProformaTemplate)
  templateType: ProformaTemplate;

  @IsString()
  customer: string; // Just customer name for now

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProformaItemDto)
  items: ProformaItemDto[];
}
