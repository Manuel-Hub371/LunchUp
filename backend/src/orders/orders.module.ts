import { Module } from '@nestjs/common'
import { OrdersController } from './orders.controller'
import { OrdersService } from './orders.service'
import { CartModule } from '../cart/cart.module'
import { RealtimeModule } from '../realtime/events.service'

@Module({
  imports: [CartModule, RealtimeModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}