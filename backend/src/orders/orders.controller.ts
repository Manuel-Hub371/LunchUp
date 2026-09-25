import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common'
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { Role } from '@prisma/client'
import { AuthenticatedUser, CurrentUser, Public, Roles } from '../common/decorators'
import { AdminUpdateOrderStatusDto, CreateOrderDto, UpdateOrderStatusDto } from './dto'
import { OrdersService } from './orders.service'

@ApiTags('orders')
@ApiCookieAuth()
@Controller()
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post('orders')
  @ApiOperation({ summary: 'Create an order from the current cart (server-priced)' })
  createOrder(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateOrderDto) {
    return this.orders.createOrder(user.id, dto)
  }

  @Get('orders')
  @ApiOperation({ summary: 'Order history for the customer' })
  listForCustomer(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('status') status?: string
  ) {
    return this.orders.listForCustomer(user.id, {
      page: parseInt(page || '1', 10),
      pageSize: parseInt(pageSize || '10', 10),
      status,
    })
  }

  @Get('orders/:id')
  @ApiOperation({ summary: 'Order detail (owner, vendor or admin)' })
  getOrder(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string
  ) {
    return this.orders.getOrderForActor(user.id, user.role, id)
  }

  @Get('orders/:id/track')
  @Public()
  @ApiOperation({ summary: 'Order status timeline' })
  track(@Param('id') id: string) {
    return this.orders.track(id)
  }

  @Post('orders/:id/cancel')
  @ApiOperation({ summary: 'Customer cancels an eligible order' })
  cancel(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.orders.cancel(user.id, id)
  }

  @Get('vendor/orders')
  @Roles(Role.VENDOR)
  @ApiOperation({ summary: 'Orders for the vendor restaurants (vendor)' })
  vendorList(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('status') status?: string,
    @Query('restaurantId') restaurantId?: string
  ) {
    return this.orders.vendorList(user.id, {
      page: parseInt(page || '1', 10),
      pageSize: parseInt(pageSize || '10', 10),
      status,
      restaurantId,
    })
  }

  @Patch('vendor/orders/:id/status')
  @Roles(Role.VENDOR)
  @ApiOperation({ summary: 'Advance an order along the allowed flow (vendor)' })
  vendorStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto
  ) {
    return this.orders.vendorStatus(user.id, id, dto)
  }

  @Patch('admin/orders/:id/status')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Move an order through the state machine (admin)' })
  adminStatus(@Param('id') id: string, @Body() dto: AdminUpdateOrderStatusDto) {
    return this.orders.adminStatus(id, dto)
  }

  @Get('admin/orders')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Search all orders (admin)' })
  adminList(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('status') status?: string,
    @Query('search') search?: string
  ) {
    return this.orders.adminList({
      page: parseInt(page || '1', 10),
      pageSize: parseInt(pageSize || '20', 10),
      status,
      search,
    })
  }
}