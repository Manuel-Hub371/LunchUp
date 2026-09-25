import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString, MaxLength } from 'class-validator'

export class CreateCategoryDto {
  @IsString()
  @MaxLength(60)
  name!: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(60)
  slug?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  image?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  description?: string
}

export class UpdateCategoryDto extends CreateCategoryDto {}