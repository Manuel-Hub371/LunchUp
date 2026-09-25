import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsBooleanString, IsInt, IsOptional, IsString, Max, Min } from 'class-validator'

export class RestaurantQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsInt()
  @Min(0)
  minRating?: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsBooleanString()
  onlyOpen?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsBooleanString()
  featuredOnly?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsBooleanString()
  verifiedOnly?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsBooleanString()
  hasDeals?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sort?: string

  @ApiPropertyOptional({ type: Number, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number

  @ApiPropertyOptional({ type: Number, default: 6, maximum: 50 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize?: number
}