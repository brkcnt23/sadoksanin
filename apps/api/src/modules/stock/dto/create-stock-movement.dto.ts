import { IsString, IsNumber, IsOptional, IsIn, Min, MinLength } from 'class-validator';

export class ManualStockEntryDto {
  @IsString()
  productId: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsString()
  @MinLength(10)
  note: string;
}

export class ManualStockExitDto {
  @IsString()
  productId: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsString()
  @IsIn(['MANUAL_EXIT', 'DAMAGE_LOSS'])
  type: 'MANUAL_EXIT' | 'DAMAGE_LOSS';

  @IsString()
  @MinLength(10)
  note: string;
}

export class CountAdjustDto {
  @IsString()
  productId: string;

  @IsNumber()
  @Min(0)
  actualCount: number;

  @IsString()
  @MinLength(10)
  note: string;
}
