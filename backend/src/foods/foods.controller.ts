import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { Public } from '../common/decorators'
import { FoodQueryDto, PricePreviewDto } from './dto'
import { FoodsService } from './foods.service'

@ApiTags('catalog foods')
@Public()
@Controller('foods')
export class FoodsController {
  constructor(private readonly foods: FoodsService) {}

  @Get()
  @ApiOperation({ summary: 'List foods with filters, sorting and pagination' })
  list(@Query() query: FoodQueryDto) {
    return this.foods.list(query)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Food detail' })
  getById(@Param('id') id: string) {
    return this.foods.getById(id)
  }

  @Get(':id/similar')
  @ApiOperation({ summary: 'Similar foods from the same restaurant' })
  similar(@Param('id') id: string, @Query('limit') limit?: string) {
    return this.foods.similar(id, parseInt(limit || '4', 10))
  }

  @Post('price-preview')
  @ApiOperation({ summary: 'Server-computed price for a food + selection configuration' })
  pricePreview(@Body() dto: PricePreviewDto) {
    return this.foods.pricePreview(dto)
  }
}