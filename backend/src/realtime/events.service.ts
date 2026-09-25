import { Injectable, Logger, Module, OnModuleInit } from '@nestjs/common'
import { Server } from 'socket.io'
import { NotificationType } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { OrdersGateway } from './orders.gateway'
import { SocketHolder } from './socket-holder'

export interface NotifyPayload {
  type: NotificationType
  title: string
  body?: string
  data?: Record<string, unknown>
}

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly socketHolder: SocketHolder
  ) {}

  emitToUser(userId: string, event: string, payload: unknown) {
    this.socketHolder.server?.to(`user:${userId}`).emit(event, payload)
  }

  emitToOrder(orderId: string, event: string, payload: unknown) {
    this.socketHolder.server?.to(`order:${orderId}`).emit(event, payload)
  }

  async notify(userId: string, payload: NotifyPayload): Promise<void> {
    try {
      const notification = await this.prisma.notification.create({
        data: {
          userId,
          type: payload.type,
          channel: 'IN_APP',
          title: payload.title,
          body: payload.body,
          data: (payload.data ?? {}) as never,
        },
      })
      this.emitToUser(userId, 'notification', {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        body: notification.body,
        data: payload.data,
        createdAt: notification.createdAt.toISOString(),
        isRead: false,
      })
    } catch (error) {
      this.logger.warn(`Notification persistence failed: ${(error as Error).message}`)
    }
  }
}

@Module({
  imports: [],
  providers: [SocketHolder, EventsService, OrdersGateway],
  exports: [SocketHolder, EventsService],
})
export class RealtimeModule {}

@Injectable()
export class RealtimeInit implements OnModuleInit {
  onModuleInit() {
    /* no-op */
  }
}