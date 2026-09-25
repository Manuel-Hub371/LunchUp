import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator'

export class RegisterDto {
  @ApiProperty({ example: 'Kofi Mensah' })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name!: string

  @ApiProperty({ example: 'kofi@example.com' })
  @IsEmail()
  @MaxLength(160)
  email!: string

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string
}

export class LoginDto {
  @ApiProperty({ example: 'demo@lunchup.com' })
  @IsEmail()
  @MaxLength(160)
  email!: string

  @ApiProperty()
  @IsString()
  @MinLength(8)
  password!: string
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'demo@lunchup.com' })
  @IsEmail()
  @MaxLength(160)
  email!: string
}

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  @MinLength(8)
  @MaxLength(64)
  token!: string

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string
}