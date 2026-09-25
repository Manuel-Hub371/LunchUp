import { Controller, Get, Query } from '@nestjs/common'
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger'
import { Public } from '../common/decorators'
import { DealsService } from './deals.service'

@ApiTags('deals')
@Public()
@Controller('deals')
export class DealsController {
  constructor(private readonly deals: DealsService) {}

  @Get()
  @ApiOperation({ summary: 'Active deals across approved restaurants' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  list(@Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    return this.deals.list({ page: parseInt(page || '1', 10), pageSize: parseInt(pageSize || '12', 10) })
  }
}