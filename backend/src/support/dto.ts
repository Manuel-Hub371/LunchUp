import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator'

export class SubmitMessageDto {
  @IsString()
  @MinLength(2)
  name!: string

  @IsEmail()
  email!: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  topic?: string

  @IsString()
  @MinLength(10)
  message!: string
}