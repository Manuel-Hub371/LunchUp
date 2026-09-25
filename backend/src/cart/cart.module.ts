import { Module } from '@nestjs/common'
import { FoodsModule } from '../foods/foods.module'
import { RestaurantsModule } from '../restaurants/restaurants.module'
import { CartController } from './cart.controller'
import { CartService } from './cart.service'

@Module({
  imports: [FoodsModule, RestaurantsModule],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {}