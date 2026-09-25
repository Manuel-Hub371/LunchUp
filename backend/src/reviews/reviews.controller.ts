import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common'
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { Role } from '@prisma/client'
import { AuthenticatedUser, CurrentUser, Public, Roles } from '../common/decorators'
import { CreateReviewDto, ModerateReviewDto } from './dto'
import { ReviewsService } from './reviews.service'

@ApiTags('reviews')
@Controller()
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Public()
  @Get('reviews')
  @ApiOperation({ summary: 'Approved reviews for a restaurant (public)' })
  listForRestaurant(
    @Query('restaurantId') restaurantId: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string
  ) {
    return this.reviews.listForRestaurant(restaurantId, {
      page: parseInt(page || '1', 10),
      pageSize: parseInt(pageSize || '10', 10),
    })
  }

  @Post('reviews')
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Submit a review for a delivered order' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateReviewDto) {
    return this.reviews.create(user.id, dto)
  }

  @Get('vendor/reviews')
  @Roles(Role.VENDOR)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Reviews for the vendor restaurants' })
  vendorList(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('status') status?: string
  ) {
    return this.reviews.listForVendor(user.id, {
      page: parseInt(page || '1', 10),
      pageSize: parseInt(pageSize || '10', 10),
      status,
    })
  }

  @Get('admin/reviews')
  @Roles(Role.ADMIN)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'All reviews for moderation' })
  adminList(@Query('status') status?: string, @Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    return this.reviews.adminList({ status, page: parseInt(page || '1', 10), pageSize: parseInt(pageSize || '20', 10) })
  }

  @Patch('admin/reviews/:id/moderate')
  @Roles(Role.ADMIN)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Approve or hide a review' })
  moderate(@Param('id') id: string, @Body() dto: ModerateReviewDto) {
    return this.reviews.moderate(id, dto)
  }
}