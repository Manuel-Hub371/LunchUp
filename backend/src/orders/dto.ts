import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator'

export class DeliveryAddressInputDto {
  @IsString()
  @MinLength(2)
  name!: string

  @IsString()
  @MinLength(5)
  phone!: string

  @IsString()
  @MinLength(3)
  address!: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  landmark?: string

  @IsString()
  @MinLength(2)
  city!: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(400)
  instructions?: string
}

export class CreateOrderDto {
  @ApiPropertyOptional({ description: 'A saved address id. Use this OR deliveryAddress.' })
  @IsOptional()
  @IsString()
  addressId?: string

  @ApiPropertyOptional({ type: DeliveryAddressInputDto })
  @IsOptional()
  deliveryAddress?: DeliveryAddressInputDto

  @IsIn(['standard', 'express'])
  deliveryMethod!: 'standard' | 'express'

  @IsIn(['mobile_money', 'card', 'pay_on_delivery'])
  paymentMethod!: 'mobile_money' | 'card' | 'pay_on_delivery'

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  couponCode?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string
}

export class UpdateOrderStatusDto {
  @IsIn(['CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'REJECTED'])
  status!: 'CONFIRMED' | 'PREPARING' | 'READY' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'REJECTED'

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  note?: string
}

export class AdminUpdateOrderStatusDto {
  @IsIn([
    'PAID',
    'CONFIRMED',
    'PREPARING',
    'READY',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'CANCELLED',
    'REJECTED',
    'REFUNDED',
  ])
  status!: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  note?: string
}