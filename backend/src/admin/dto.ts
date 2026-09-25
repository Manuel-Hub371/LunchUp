import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator'

export class CreateCategoryDto {
  @IsString()
  name!: string

  @IsString()
  slug!: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  image?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string
}

export class UpdateCategoryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  image?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string
}

export class ApproveRestaurantDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string
}

export class RejectRestaurantDto {
  @IsString()
  reason!: string
}

export class ToggleUserStatusDto {
  @IsIn(['ACTIVE', 'DISABLED'])
  status!: 'ACTIVE' | 'DISABLED'
}

export class AdminStatsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  from?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  to?: string
}