import { ApiPropertyOptional } from '@nestjs/swagger'
import { PartialType } from '@nestjs/mapped-types'
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator'

export class VendorOnboardingDto {
  @IsString()
  @MaxLength(120)
  businessName!: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(600)
  description?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(160)
  email?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  logoUrl?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bannerUrl?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  idDocumentUrl?: string
}

export class CreateRestaurantDto {
  @IsString()
  @MaxLength(120)
  name!: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  location?: string

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsNumber()
  @Min(0)
  deliveryFee?: number

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(180)
  deliveryTimeMin?: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  opensAt?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  closesAt?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  services?: string[]

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  logoUrl?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bannerUrl?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  email?: string

  @ApiPropertyOptional({ description: 'Category slugs the restaurant belongs to' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[]
}

export class UpdateRestaurantDto extends CreateRestaurantDto {}

export class RestaurantOpenDto {
  @IsBoolean()
  isOpen!: boolean
}

export class CustomizationOptionInput {
  @IsString()
  name!: string

  @IsOptional()
  @IsNumber()
  priceModifier?: number

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean

  @IsOptional()
  @IsBoolean()
  available?: boolean
}

export class CustomizationGroupInput {
  @IsString()
  name!: string

  @IsOptional()
  @IsBoolean()
  required?: boolean

  @IsOptional()
  @IsInt()
  minSelections?: number

  @IsOptional()
  @IsInt()
  maxSelections?: number

  @IsArray()
  options!: CustomizationOptionInput[]
}

export class CreateFoodDto {
  @IsString()
  restaurantId!: string

  @IsString()
  @MaxLength(120)
  name!: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string

  @IsNumber()
  @Min(0)
  @Max(100000)
  price!: number

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(90)
  discount?: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  image?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[]

  @ApiPropertyOptional({ description: 'Category slug e.g. local-dishes' })
  @IsOptional()
  @IsString()
  categorySlug?: string

  @ApiPropertyOptional({ description: 'Category term e.g. local, fastfood' })
  @IsOptional()
  @IsString()
  categoryTerm?: string

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(180)
  deliveryTimeMin?: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  includedItems?: string[]

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  available?: boolean

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  featured?: boolean

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  customizationGroups?: CustomizationGroupInput[]
}

export class UpdateFoodDto extends PartialType(CreateFoodDto) {}