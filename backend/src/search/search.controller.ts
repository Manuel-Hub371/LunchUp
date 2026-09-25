import { Controller, Get, Query } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { Public } from '../common/decorators'
import { SearchService } from './search.service'

@ApiTags('search')
@Public()
@Controller('search')
export class SearchController {
  constructor(private readonly search: SearchService) {}

  @Get()
  @ApiOperation({ summary: 'Search restaurants and foods in one request' })
  async combined(@Query('q') q = '', @Query('location') location?: string, @Query('term') term?: string) {
    const [restaurants, foods] = await Promise.all([
      this.search.searchRestaurants(q, location),
      this.search.searchFoods(q, term),
    ])
    return { query: q, restaurants, foods }
  }

  @Get('restaurants')
  @ApiOperation({ summary: 'Search restaurants' })
  restaurants(@Query('q') q = '', @Query('location') location?: string) {
    return this.search.searchRestaurants(q, location)
  }

  @Get('foods')
  @ApiOperation({ summary: 'Search foods, grouped by category term' })
  foods(@Query('q') q = '', @Query('term') term?: string, @Query('sort') sort?: string) {
    return this.search.searchFoods(q, term, sort)
  }
}