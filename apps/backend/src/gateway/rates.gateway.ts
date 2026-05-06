import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Server, Socket } from 'socket.io';
import { RateTick, DashboardSnapshot, SOCKET_EVENTS } from 'shared-types';
import { RatesService } from '../rates/rates.service';

@WebSocketGateway({ cors: { origin: process.env.FRONTEND_ORIGIN ?? '*' } })
export class RatesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private server: Server;

  private readonly logger = new Logger(RatesGateway.name);

  constructor(private readonly rates: RatesService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    const snapshot: DashboardSnapshot = { pairs: this.rates.getAllSnapshots() };
    client.emit(SOCKET_EVENTS.SNAPSHOT, snapshot);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @OnEvent('rate.tick')
  broadcastTick(tick: RateTick) {
    this.server?.emit(SOCKET_EVENTS.TICK, tick);
  }
}
