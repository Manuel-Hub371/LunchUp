import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator'

export class UpdateProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  name?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string
}

export class CreateAddressDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  label?: string

  @ApiProperty({ example: 'Kofi Mensah' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name!: string

  @ApiProperty({ example: '+233 24 000 0000' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  phone!: string

  @ApiProperty({ example: '14 Boundary Road' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  line1!: string

  @ApiPropertyOptional({ example: 'Beside the fuel station' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  landmark?: string

  @ApiProperty({ example: 'Accra' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  city!: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  instructions?: string

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean
}

export class UpdateAddressDto extends CreateAddressDto {}

export class CreateFavoriteDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  restaurantId?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  foodId?: string
}