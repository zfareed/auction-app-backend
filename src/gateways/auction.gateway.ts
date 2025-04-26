import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
  } from '@nestjs/websockets';
  import { Server, Socket } from 'socket.io';
  import { Logger } from '@nestjs/common';
  
  @WebSocketGateway({
    cors: {
      origin: ['http://localhost:3000', 'http://localhost:5173'],
      credentials: true,
    },
  })
  export class AuctionGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly logger = new Logger(AuctionGateway.name);
    
    @WebSocketServer()
    server: Server;
  
    handleConnection(client: Socket) {
      this.logger.log(`Client connected: ${client.id}`);
    }
  
    handleDisconnect(client: Socket) {
      this.logger.log(`Client disconnected: ${client.id}`);
    }
  
    @SubscribeMessage('joinAuction')
    handleJoinAuction(client: Socket, auctionId: number) {
      client.join(`auction-${auctionId}`);
      this.logger.log(`Client ${client.id} joined auction room: auction-${auctionId}`);
    }
  
    @SubscribeMessage('leaveAuction')
    handleLeaveAuction(client: Socket, auctionId: number) {
      client.leave(`auction-${auctionId}`);
      this.logger.log(`Client ${client.id} left auction room: auction-${auctionId}`);
    }
  
    notifyNewBid(auctionId: number, bidData: any) {
      this.server.to(`auction-${auctionId}`).emit('newBid', bidData);
    }
  }