import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { ConfigModule } from '@nestjs/config'
import { configuration } from './config/configuration'
import { PrismaModule } from './prisma/prisma.module'
import { RealtimeModule } from './realtime/events.service'
import { AuthModule } from './auth/auth.module'
import { UsersModule } from './users/users.module'
import { CategoriesModule } from './categories/categories.module'
import { RestaurantsModule } from './restaurants/restaurants.module'
import { FoodsModule } from './foods/foods.module'
import { VendorsModule } from './vendors/vendors.module'
import { CartModule } from './cart/cart.module'
import { OrdersModule } from './orders/orders.module'
import { PaymentsModule } from './payments/payments.module'
import { ReviewsModule } from './reviews/reviews.module'
import { DealsModule } from './deals/deals.module'
import { SearchModule } from './search/search.module'
import { NotificationsModule } from './notifications/notifications.module'
import { SupportModule } from './support/support.module'
import { AdminModule } from './admin/admin.module'
import { HealthModule } from './health/health.module'
import { RateLimitGuard } from './common/rate-limit.guard'
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard'
import { RolesGuard } from './auth/guards/roles.guard'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    PrismaModule,
    RealtimeModule,
    AuthModule,
    UsersModule,
    CategoriesModule,
    RestaurantsModule,
    FoodsModule,
    VendorsModule,
    CartModule,
    OrdersModule,
    PaymentsModule,
    ReviewsModule,
    DealsModule,
    SearchModule,
    NotificationsModule,
    SupportModule,
    AdminModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: RateLimitGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}