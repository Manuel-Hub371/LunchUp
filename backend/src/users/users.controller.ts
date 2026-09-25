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
import { AuthenticatedUser, CurrentUser } from '../common/decorators'
import { CreateAddressDto, CreateFavoriteDto, UpdateAddressDto, UpdateProfileDto } from './dto'
import { UsersService } from './users.service'

@ApiTags('users')
@ApiCookieAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Patch('me')
  @ApiOperation({ summary: 'Update the authenticated user profile' })
  updateProfile(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateProfileDto) {
    return this.users.updateProfile(user.id, dto)
  }

  @Get('me/addresses')
  @ApiOperation({ summary: 'List the user saved delivery addresses' })
  listAddresses(@CurrentUser() user: AuthenticatedUser) {
    return this.users.listAddresses(user.id)
  }

  @Post('me/addresses')
  @ApiOperation({ summary: 'Create a saved delivery address' })
  createAddress(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateAddressDto) {
    return this.users.createAddress(user.id, dto)
  }

  @Patch('me/addresses/:id')
  @ApiOperation({ summary: 'Update a saved delivery address' })
  updateAddress(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateAddressDto
  ) {
    return this.users.updateAddress(user.id, id, dto)
  }

  @Delete('me/addresses/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a saved delivery address' })
  deleteAddress(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.users.deleteAddress(user.id, id)
  }

  @Get('me/favorites')
  @ApiOperation({ summary: 'List the user favorites' })
  listFavorites(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string
  ) {
    return this.users.listFavorites(user.id, parseInt(page || '1', 10), parseInt(pageSize || '20', 10))
  }

  @Post('me/favorites')
  @ApiOperation({ summary: 'Add a restaurant or food to favorites' })
  addFavorite(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateFavoriteDto) {
    return this.users.addFavorite(user.id, dto)
  }

  @Delete('me/favorites/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a favorite' })
  removeFavorite(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.users.removeFavorite(user.id, id)
  }
}