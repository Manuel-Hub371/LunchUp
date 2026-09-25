import { Controller, Get, Param, Query } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { Public } from '../common/decorators'
import { RestaurantQueryDto } from './dto'
import { RestaurantsService } from './restaurants.service'

@ApiTags('catalog restaurants')
@Public()
@Controller('restaurants')
export class RestaurantsController {
  constructor(private readonly restaurants: RestaurantsService) {}

  @Get()
  @ApiOperation({ summary: 'List approved restaurants with filters, sorting and pagination' })
  list(@Query() query: RestaurantQueryDto) {
    return this.restaurants.list(query)
  }

  @Get('featured')
  @ApiOperation({ summary: 'Featured restaurants' })
  featured(@Query('limit') limit?: string) {
    return this.restaurants.featured(parseInt(limit || '3', 10))
  }

  @Get(':id')
  @ApiOperation({ summary: 'Restaurant detail' })
  getById(@Param('id') id: string) {
    return this.restaurants.getById(id)
  }

  @Get(':id/availability')
  @ApiOperation({ summary: 'Whether a restaurant is currently accepting orders' })
  availability(@Param('id') id: string) {
    return this.restaurants.availability(id)
  }
}