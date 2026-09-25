import { ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator'

export class AddCartItemDto {
  @IsString()
  foodId!: string

  @IsInt()
  @Min(1)
  @Max(50)
  quantity!: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => SelectionDto)
  selections?: SelectionDto[]

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  specialInstructions?: string
}

export class SelectionDto {
  @IsString()
  groupId!: string

  @IsArray()
  @ArrayMaxSize(6)
  @IsString({ each: true })
  optionIds!: string[]
}

export class UpdateCartItemDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  quantity?: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => SelectionDto)
  selections?: SelectionDto[]

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  specialInstructions?: string
}