import { Injectable } from '@nestjs/common'
import { Server } from 'socket.io'

/** Holds the live Socket.IO server so services can broadcast without a gateway dependency. */
@Injectable()
export class SocketHolder {
  server: Server | null = null
}