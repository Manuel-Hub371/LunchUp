import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common'
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { Role } from '@prisma/client'
import { Roles } from '../common/decorators'
import { AdminService } from './admin.service'
import {
  ApproveRestaurantDto,
  CreateCategoryDto,
  RejectRestaurantDto,
  ToggleUserStatusDto,
  UpdateCategoryDto,
} from './dto'

@ApiTags('admin')
@ApiCookieAuth()
@Roles(Role.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Platform summary for the admin console' })
  dashboard() {
    return this.admin.dashboard()
  }

  @Get('restaurants')
  @ApiOperation({ summary: 'Restaurants for moderation/list' })
  restaurants(@Query('status') status?: string, @Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    return this.admin.listRestaurants({ status, page: parseInt(page || '1', 10), pageSize: parseInt(pageSize || '20', 10) })
  }

  @Patch('restaurants/:id/approve')
  @ApiOperation({ summary: 'Approve a restaurant (and its vendor)' })
  approveRestaurant(@Param('id') id: string, @Body() dto: ApproveRestaurantDto) {
    return this.admin.approveRestaurant(id, dto)
  }

  @Patch('restaurants/:id/reject')
  @ApiOperation({ summary: 'Reject a restaurant with a reason' })
  rejectRestaurant(@Param('id') id: string, @Body() dto: RejectRestaurantDto) {
    return this.admin.rejectRestaurant(id, dto)
  }

  @Post('categories')
  @ApiOperation({ summary: 'Create a food category' })
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.admin.createCategory(dto)
  }

  @Patch('categories/:id')
  @ApiOperation({ summary: 'Update a food category' })
  updateCategory(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.admin.updateCategory(id, dto)
  }

  @Get('users')
  @ApiOperation({ summary: 'List users (search + role filter)' })
  users(@Query('search') search?: string, @Query('role') role?: string, @Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    return this.admin.listUsers({ search, role, page: parseInt(page || '1', 10), pageSize: parseInt(pageSize || '20', 10) })
  }

  @Patch('users/:id/status')
  @ApiOperation({ summary: 'Enable or disable a user account' })
  setUserStatus(@Param('id') id: string, @Body() dto: ToggleUserStatusDto) {
    return this.admin.setUserStatus(id, dto)
  }
}