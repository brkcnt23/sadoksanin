import { IsEmail, IsString, MinLength, IsOptional, IsIn } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(4)
  password: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  @IsIn(['DEALER', 'PLASIYER', 'ADMIN'])
  role?: 'DEALER' | 'PLASIYER' | 'ADMIN';

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  // Dealer-specific fields (required when role=DEALER)
  @IsOptional()
  @IsString()
  company?: string;

  @IsOptional()
  @IsString()
  contactPerson?: string;

  @IsOptional()
  @IsString()
  taxNo?: string;

  @IsOptional()
  @IsString()
  taxOffice?: string;

  @IsOptional()
  @IsString()
  cariNo?: string;

  @IsOptional()
  @IsString()
  region?: string;
}
