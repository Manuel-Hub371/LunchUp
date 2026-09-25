import { Injectable } from '@nestjs/common'
import { ApiException } from '../common/api-exception'
import { paginate } from '../common/pagination'
import { PaginatedResult } from '../common/response.interceptor'
import { PrismaService } from '../prisma/prisma.service'

type NotificationRow = {
  id: string
  type: string
  title: string
  body: string | null
  data: unknown
  isRead: boolean
  createdAt: Date
}

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  private view(n: NotificationRow) {
    return {
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body ?? undefined,
      data: n.data ?? undefined,
      isRead: n.isRead,
      createdAt: n.createdAt.toISOString(),
    }
  }

  async list(userId: string, query: { page?: number; pageSize?: number; isRead?: boolean }) {
    const page = Math.max(1, query.page || 1)
    const pageSize = Math.min(50, Math.max(1, query.pageSize || 20))
    const where = { userId, ...(query.isRead === undefined ? {} : { isRead: query.isRead }) }
    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.notification.count({ where }),
    ])
    return paginate(notifications.map((n) => this.view(n)), total, page, pageSize)
  }

  async unreadCount(userId: string): Promise<{ count: number }> {
    const count = await this.prisma.notification.count({ where: { userId, isRead: false } })
    return { count }
  }

  async markRead(userId: string, id: string) {
    const notification = await this.prisma.notification.findFirst({ where: { id, userId } })
    if (!notification) throw ApiException.notFound('NOT_FOUND', 'Notification not found.')
    const updated = await this.prisma.notification.update({ where: { id }, data: { isRead: true, readAt: new Date() } })
    return this.view(updated)
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true, readAt: new Date() } })
    return { updated: true }
  }
}