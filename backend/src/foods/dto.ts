import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsArray, IsBooleanString, IsInt, IsOptional, IsString, Max, Min } from 'class-validator'

export class FoodQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string

  @ApiPropertyOptional({ description: "Category term, e.g. 'local' | 'fastfood'" })
  @IsOptional()
  @IsString()
  category?: string

  @ApiPropertyOptional({ description: 'Category slug, e.g. local-dishes' })
  @IsOptional()
  @IsString()
  categorySlug?: string

  @ApiPropertyOptional({ description: 'Restaurant / vendor id' })
  @IsOptional()
  @IsString()
  vendorId?: string

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
  dealsOnly?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsBooleanString()
  featuredOnly?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsBooleanString()
  bestSellersOnly?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sort?: string

  @ApiPropertyOptional({ type: Number, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number

  @ApiPropertyOptional({ type: Number, default: 8, maximum: 50 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize?: number
}

export class PricePreviewDto {
  @IsString()
  foodId!: string

  @IsInt()
  @Min(1)
  @Max(50)
  quantity!: number

  @IsOptional()
  @IsArray()
  selections?: { groupId: string; optionIds: string[] }[]
}