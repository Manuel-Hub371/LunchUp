import { Injectable } from '@nestjs/common'
import { MessageStatus } from '@prisma/client'
import { ApiException } from '../common/api-exception'
import { paginate } from '../common/pagination'
import { PaginatedResult } from '../common/response.interceptor'
import { PrismaService } from '../prisma/prisma.service'
import { SubmitMessageDto } from './dto'

@Injectable()
export class SupportService {
  constructor(private readonly prisma: PrismaService) {}

  async submit(userId: string | null, dto: SubmitMessageDto) {
    const message = await this.prisma.supportMessage.create({
      data: {
        userId,
        name: dto.name,
        email: dto.email,
        topic: dto.topic ?? null,
        message: dto.message,
      },
    })
    return { id: message.id, status: message.status, createdAt: message.createdAt.toISOString() }
  }

  async adminList(query: { page?: number; pageSize?: number; status?: string }) {
    const page = Math.max(1, query.page || 1)
    const pageSize = Math.min(100, Math.max(1, query.pageSize || 20))
    const where = query.status ? { status: query.status as MessageStatus } : {}
    const [messages, total] = await Promise.all([
      this.prisma.supportMessage.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.supportMessage.count({ where }),
    ])
    return paginate(
      messages.map((m) => ({
        id: m.id,
        name: m.name,
        email: m.email,
        topic: m.topic ?? undefined,
        message: m.message,
        status: m.status,
        createdAt: m.createdAt.toISOString(),
        respondedAt: m.respondedAt?.toISOString() ?? undefined,
      })),
      total,
      page,
      pageSize
    )
  }

  async respond(id: string, response: string) {
    if (!response?.trim()) throw ApiException.validation('A response is required.')
    const message = await this.prisma.supportMessage.update({
      where: { id },
      data: { status: MessageStatus.RESOLVED, respondedAt: new Date() },
    })
    return { id: message.id, status: message.status, respondedAt: message.respondedAt?.toISOString() ?? undefined }
  }
}