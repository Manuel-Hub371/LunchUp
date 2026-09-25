import { Logger } from '@nestjs/common'
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { ConfigService } from '@nestjs/config'
import { SocketHolder } from './socket-holder'

/**
 * Socket.IO orders gateway. Clients authenticate with the `lunchup_access`
 * cookie (withCredentials) or `?token=` in production builds. Realtime order
 * updates are always reconciled against the DB; the socket is a convenient
 * push channel, never the source of truth.
 */
@WebSocketGateway({
  cors: { origin: true, credentials: true },
  transports: ['websocket', 'polling'],
})
export class OrdersGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(OrdersGateway.name)

  @WebSocketServer()
  private server!: Server

  constructor(
    private readonly socketHolder: SocketHolder,
    private readonly config: ConfigService
  ) {}

  afterInit(server: Server) {
    this.socketHolder.server = server
    this.logger.log('Socket.IO gateway ready')
  }

  private extractToken(socket: Socket): string | null {
    const cookie = socket.handshake.headers.cookie || ''
    const match = /lunchup_access=([^;]+)/.exec(cookie)
    if (match) return decodeURIComponent(match[1])
    const query = socket.handshake.auth?.token
    if (typeof query === 'string' && query) return query
    return null
  }

  handleConnection(socket: Socket) {
    const token = this.extractToken(socket)
    if (!token) {
      this.logger.warn('Socket connection without token')
      socket.emit('auth_error', { message: 'Missing authentication token.' })
      socket.disconnect(true)
      return
    }
    socket.data.token = token
    socket.emit('connected', { ok: true })
  }

  handleDisconnect(socket: Socket) {
    this.logger.log(`Socket disconnected: ${socket.id}`)
  }
}