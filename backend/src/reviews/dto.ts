import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator'

export class CreateReviewDto {
  @IsString()
  restaurantId!: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  foodId?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  orderId?: string

  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  comment?: string
}

export class ModerateReviewDto {
  @IsIn(['APPROVED', 'HIDDEN'])
  status!: 'APPROVED' | 'HIDDEN'
}