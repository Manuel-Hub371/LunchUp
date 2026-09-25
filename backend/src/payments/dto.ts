import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsIn, IsObject, IsOptional, IsString } from 'class-validator'

export class PaymentInitiateDto {
  @IsString()
  orderId!: string

  @IsIn(['mobile_money', 'card'])
  method!: 'mobile_money' | 'card'

  @ApiPropertyOptional({
    example: { accountNumber: '0241111111' },
    description: 'Sandbox details. For mobile_money: accountNumber. For card: cardLast4.',
  })
  @IsOptional()
  @IsObject()
  details?: Record<string, string>
}

export class PaymentVerifyDto {
  @IsString()
  orderId!: string

  @IsString()
  reference!: string
}