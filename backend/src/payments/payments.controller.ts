import { Body, Controller, Post } from '@nestjs/common'
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { AuthenticatedUser, CurrentUser } from '../common/decorators'
import { PaymentInitiateDto, PaymentVerifyDto } from './dto'
import { PaymentsService } from './payments.service'

@ApiTags('payments')
@ApiCookieAuth()
@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Post('initiate')
  @ApiOperation({ summary: 'Start an online payment for a pending order (sandbox gateway by default)' })
  initiate(@CurrentUser() user: AuthenticatedUser, @Body() dto: PaymentInitiateDto) {
    return this.payments.initiate(user.id, dto)
  }

  @Post('verify')
  @ApiOperation({ summary: 'Verify a payment reference and advance the order when successful' })
  verify(@CurrentUser() user: AuthenticatedUser, @Body() dto: PaymentVerifyDto) {
    return this.payments.verify(user.id, dto)
  }
}