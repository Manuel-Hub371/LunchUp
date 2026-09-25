import { Module } from '@nestjs/common'
import { OrdersModule } from '../orders/orders.module'
import { RealtimeModule } from '../realtime/events.service'
import { PaymentsController } from './payments.controller'
import { PaymentsService } from './payments.service'

@Module({
  imports: [OrdersModule, RealtimeModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}