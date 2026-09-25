import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common'
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { Role } from '@prisma/client'
import { AuthenticatedUser, CurrentUser, Public, Roles } from '../common/decorators'
import { SubmitMessageDto } from './dto'
import { SupportService } from './support.service'

@ApiTags('support')
@Controller()
export class SupportController {
  constructor(private readonly support: SupportService) {}

  @Public()
  @Post('support')
  @ApiOperation({ summary: 'Contact form (public or logged-in)' })
  submit(@CurrentUser() user: AuthenticatedUser | null, @Body() dto: SubmitMessageDto) {
    return this.support.submit(user?.id ?? null, dto)
  }

  @Get('admin/support')
  @Roles(Role.ADMIN)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Support inbox (admin)' })
  adminList(@Query('status') status?: string, @Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    return this.support.adminList({ status, page: parseInt(page || '1', 10), pageSize: parseInt(pageSize || '20', 10) })
  }

  @Post('admin/support/:id/respond')
  @Roles(Role.ADMIN)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Respond to a message (admin)' })
  respond(@Param('id') id: string, @Body('response') response: string) {
    return this.support.respond(id, response)
  }
}