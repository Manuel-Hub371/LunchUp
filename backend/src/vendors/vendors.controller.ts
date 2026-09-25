import {
  Body,
  Controller,
  Delete,
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
import { AuthenticatedUser, CurrentUser, Roles } from '../common/decorators'
import {
  CreateFoodDto,
  CreateRestaurantDto,
  RestaurantOpenDto,
  UpdateFoodDto,
  UpdateRestaurantDto,
  VendorOnboardingDto,
} from './dto'
import { VendorsService } from './vendors.service'

@ApiTags('vendor portal')
@ApiCookieAuth()
@Roles(Role.VENDOR)
@Controller('vendor')
export class VendorsController {
  constructor(private readonly vendors: VendorsService) {}

  @Post('onboarding')
  @ApiOperation({ summary: 'Create or update the vendor business profile' })
  onboarding(@CurrentUser() user: AuthenticatedUser, @Body() dto: VendorOnboardingDto) {
    return this.vendors.onboarding(user.id, dto)
  }

  @Get('profile')
  @ApiOperation({ summary: 'Vendor profile with all owned restaurants' })
  profile(@CurrentUser() user: AuthenticatedUser) {
    return this.vendors.profile(user.id)
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update vendor business details' })
  updateProfile(@CurrentUser() user: AuthenticatedUser, @Body() dto: VendorOnboardingDto) {
    return this.vendors.updateProfile(user.id, dto)
  }

  @Get('restaurants')
  @ApiOperation({ summary: 'All restaurants owned by the vendor' })
  listRestaurants(@CurrentUser() user: AuthenticatedUser) {
    return this.vendors.listRestaurants(user.id)
  }

  @Post('restaurants')
  @ApiOperation({ summary: 'Create a restaurant (submitted for admin approval)' })
  createRestaurant(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateRestaurantDto) {
    return this.vendors.createRestaurant(user.id, dto)
  }

  @Patch('restaurants/:id')
  @ApiOperation({ summary: 'Update an owned restaurant' })
  updateRestaurant(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateRestaurantDto
  ) {
    return this.vendors.updateRestaurant(user.id, id, dto)
  }

  @Patch('restaurants/:id/open')
  @ApiOperation({ summary: 'Toggle whether the restaurant accepts orders' })
  setOpen(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: RestaurantOpenDto
  ) {
    return this.vendors.setOpen(user.id, id, dto)
  }

  @Get('foods')
  @ApiOperation({ summary: 'Menu foods (optionally filtered by restaurant)' })
  listFoods(
    @CurrentUser() user: AuthenticatedUser,
    @Query('restaurantId') restaurantId?: string
  ) {
    return this.vendors.listFoods(user.id, restaurantId)
  }

  @Post('foods')
  @ApiOperation({ summary: 'Create a menu item with customizations' })
  createFood(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateFoodDto) {
    return this.vendors.createFood(user.id, dto)
  }

  @Patch('foods/:id')
  @ApiOperation({ summary: 'Update a menu item' })
  updateFood(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateFoodDto
  ) {
    return this.vendors.updateFood(user.id, id, dto)
  }

  @Delete('foods/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft-delete a menu item' })
  deleteFood(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.vendors.deleteFood(user.id, id)
  }
}