import { Test, TestingModule } from '@nestjs/testing';
import { AuctionGateway } from './auction.gateway';
import { Socket, Server } from 'socket.io';

describe('AuctionGateway', () => {
  let gateway: AuctionGateway;
  let mockServer: any;
  
  beforeEach(async () => {
    mockServer = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [AuctionGateway],
    }).compile();

    gateway = module.get<AuctionGateway>(AuctionGateway);
    gateway.server = mockServer as any;
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('handleConnection', () => {
    it('should log when client connects', () => {
      // Arrange
      const mockClient = { id: 'test-client-id' } as Socket;
      const logSpy = jest.spyOn(gateway['logger'], 'log');
      
      // Act
      gateway.handleConnection(mockClient);
      
      // Assert
      expect(logSpy).toHaveBeenCalledWith(`Client connected: test-client-id`);
    });
  });

  describe('handleDisconnect', () => {
    it('should log when client disconnects', () => {
      // Arrange
      const mockClient = { id: 'test-client-id' } as Socket;
      const logSpy = jest.spyOn(gateway['logger'], 'log');
      
      // Act
      gateway.handleDisconnect(mockClient);
      
      // Assert
      expect(logSpy).toHaveBeenCalledWith(`Client disconnected: test-client-id`);
    });
  });

  describe('handleJoinAuction', () => {
    it('should join client to auction room', () => {
      // Arrange
      const mockClient = { 
        id: 'test-client-id',
        join: jest.fn(),
      } as unknown as Socket;
      const auctionId = 123;
      const logSpy = jest.spyOn(gateway['logger'], 'log');
      
      // Act
      gateway.handleJoinAuction(mockClient, auctionId);
      
      // Assert
      expect(mockClient.join).toHaveBeenCalledWith(`auction-123`);
      expect(logSpy).toHaveBeenCalledWith(`Client test-client-id joined auction room: auction-123`);
    });
  });

  describe('notifyNewBid', () => {
    it('should emit to the auction room', () => {
      // Arrange
      const auctionId = 123;
      const bidData = { amount: 150, user: 'test-user' };
      
      // Act
      gateway.notifyNewBid(auctionId, bidData);
      
      // Assert
      expect(mockServer.to).toHaveBeenCalledWith(`auction-123`);
      expect(mockServer.emit).toHaveBeenCalledWith('newBid', bidData);
    });
  });
}); 