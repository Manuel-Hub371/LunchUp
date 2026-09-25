import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common'
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { AuthenticatedUser, CurrentUser } from '../common/decorators'
import { AddCartItemDto, UpdateCartItemDto } from './dto'
import { CartService } from './cart.service'

@ApiTags('cart')
@ApiCookieAuth()
@Controller('cart')
export class CartController {
  constructor(private readonly cart: CartService) {}

  @Get()
  @ApiOperation({ summary: 'Current cart with server-computed totals' })
  get(@CurrentUser() user: AuthenticatedUser) {
    return this.cart.getCart(user.id)
  }

  @Post('items')
  @ApiOperation({ summary: 'Add a food line to the cart (one restaurant per cart)' })
  add(@CurrentUser() user: AuthenticatedUser, @Body() dto: AddCartItemDto) {
    return this.cart.addItem(user.id, dto)
  }

  @Patch('items/:id')
  @ApiOperation({ summary: 'Update quantity, selections or instructions of a line' })
  update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdateCartItemDto) {
    return this.cart.updateItem(user.id, id, dto)
  }

  @Delete('items/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a line from the cart' })
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.cart.removeItem(user.id, id)
  }

  @Delete('clear')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Empty the cart' })
  clear(@CurrentUser() user: AuthenticatedUser) {
    return this.cart.clear(user.id)
  }
}