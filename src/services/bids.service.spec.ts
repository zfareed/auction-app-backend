import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { BidsService } from './bids.service';
import { Bid } from '../entities/bid.entity';
import { Item } from '../entities/item.entity';
import { User } from '../entities/user.entity';
import { AuctionGateway } from '../gateways/auction.gateway';
import { CreateBidDto } from '../dto/create-bid.dto';
import { DataSource } from 'typeorm';

describe('BidsService', () => {
  let service: BidsService;
  let mockBidsRepository: any;
  let mockItemsRepository: any;
  let mockUsersRepository: any;
  let mockAuctionGateway: any;
  let mockDataSource: any;

  beforeEach(async () => {
    mockBidsRepository = {
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    mockItemsRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
    };

    mockUsersRepository = {
      findOne: jest.fn(),
    };

    mockAuctionGateway = {
      notifyNewBid: jest.fn(),
    };

    mockDataSource = {
      transaction: jest.fn().mockImplementation(callback => {
        const transactionalEntityManager = {
          findOne: jest.fn(),
          create: jest.fn(),
          save: jest.fn(),
        };
        return callback(transactionalEntityManager);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BidsService,
        {
          provide: getRepositoryToken(Bid),
          useValue: mockBidsRepository,
        },
        {
          provide: getRepositoryToken(Item),
          useValue: mockItemsRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUsersRepository,
        },
        {
          provide: AuctionGateway,
          useValue: mockAuctionGateway,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<BidsService>(BidsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new bid successfully', async () => {
      // Arrange
      const createBidDto: CreateBidDto = {
        userId: 1,
        itemId: 1,
        amount: 200,
      };

      const mockUser = { id: 1, username: 'testuser' };
      const mockItem = {
        id: 1,
        currentHighestBid: 100,
        auctionEndTime: new Date(Date.now() + 3600000), // 1 hour in the future
      };
      const mockBid = {
        id: 1,
        amount: createBidDto.amount,
        createdAt: new Date(),
        user: mockUser,
        item: mockItem,
      };

      // Mock the transaction manager's methods
      mockDataSource.transaction.mockImplementation(async (callback) => {
        const transactionalEntityManager = {
          findOne: jest.fn()
            .mockImplementationOnce(() => mockItem) // For the item
            .mockImplementationOnce(() => mockUser), // For the user
          create: jest.fn().mockReturnValue(mockBid),
          save: jest.fn()
            .mockImplementationOnce(() => Promise.resolve(mockItem)) // For updating item
            .mockImplementationOnce(() => Promise.resolve(mockBid)), // For saving bid
        };
        
        return callback(transactionalEntityManager);
      });

      // Act
      const result = await service.create(createBidDto);

      // Assert
      expect(result).toEqual(mockBid);
      expect(mockAuctionGateway.notifyNewBid).toHaveBeenCalledWith(
        createBidDto.itemId,
        expect.objectContaining({
          amount: createBidDto.amount,
          userId: mockUser.id,
          username: mockUser.username,
        })
      );
    });

    it('should throw NotFoundException when item does not exist', async () => {
      // Arrange
      const createBidDto: CreateBidDto = {
        userId: 1,
        itemId: 999,
        amount: 200,
      };

      mockDataSource.transaction.mockImplementation(async (callback) => {
        const transactionalEntityManager = {
          findOne: jest.fn().mockResolvedValueOnce(null), // Item not found
        };
        return callback(transactionalEntityManager);
      });

      // Act & Assert
      await expect(service.create(createBidDto)).rejects.toThrow(NotFoundException);
      await expect(service.create(createBidDto)).rejects.toThrow('Item not found');
    });

    it('should throw BadRequestException when auction has ended', async () => {
      // Arrange
      const createBidDto: CreateBidDto = {
        userId: 1,
        itemId: 1,
        amount: 200,
      };

      const mockItem = {
        id: 1,
        currentHighestBid: 100,
        auctionEndTime: new Date(Date.now() - 3600000), // 1 hour in the past
      };

      mockDataSource.transaction.mockImplementation(async (callback) => {
        const transactionalEntityManager = {
          findOne: jest.fn().mockResolvedValueOnce(mockItem),
        };
        return callback(transactionalEntityManager);
      });

      // Act & Assert
      await expect(service.create(createBidDto)).rejects.toThrow(BadRequestException);
      await expect(service.create(createBidDto)).rejects.toThrow('Auction has ended');
    });

    it('should throw BadRequestException when bid amount is too low', async () => {
      // Arrange
      const createBidDto: CreateBidDto = {
        userId: 1,
        itemId: 1,
        amount: 90, // Lower than current bid of 100
      };

      const mockItem = {
        id: 1,
        currentHighestBid: 100,
        auctionEndTime: new Date(Date.now() + 3600000), // 1 hour in the future
      };

      mockDataSource.transaction.mockImplementation(async (callback) => {
        const transactionalEntityManager = {
          findOne: jest.fn().mockResolvedValueOnce(mockItem),
        };
        return callback(transactionalEntityManager);
      });

      // Act & Assert
      await expect(service.create(createBidDto)).rejects.toThrow(BadRequestException);
      await expect(service.create(createBidDto)).rejects.toThrow(
        `Bid amount must be higher than current highest bid: ${mockItem.currentHighestBid}`
      );
    });

    it('should throw NotFoundException when user does not exist', async () => {
      // Arrange
      const createBidDto: CreateBidDto = {
        userId: 999,
        itemId: 1,
        amount: 200,
      };

      const mockItem = {
        id: 1,
        currentHighestBid: 100,
        auctionEndTime: new Date(Date.now() + 3600000), // 1 hour in the future
      };

      mockDataSource.transaction.mockImplementation(async (callback) => {
        const transactionalEntityManager = {
          findOne: jest.fn()
            .mockImplementationOnce(() => mockItem) // Item found
            .mockImplementationOnce(() => null),    // User not found
        };
        return callback(transactionalEntityManager);
      });

      // Act & Assert
      await expect(service.create(createBidDto)).rejects.toThrow(NotFoundException);
      await expect(service.create(createBidDto)).rejects.toThrow('User not found');
    });
  });

  describe('getItemBids', () => {
    it('should return all bids for an item', async () => {
      // Arrange
      const itemId = 1;
      const mockBids = [
        {
          id: 1,
          amount: 150,
          createdAt: new Date(),
          user: { id: 1, username: 'user1' },
        },
        {
          id: 2,
          amount: 200,
          createdAt: new Date(),
          user: { id: 2, username: 'user2' },
        },
      ];

      mockBidsRepository.find.mockResolvedValue(mockBids);

      // Act
      const result = await service.getItemBids(itemId);

      // Assert
      expect(mockBidsRepository.find).toHaveBeenCalledWith({
        where: { item: { id: itemId } },
        relations: ['user'],
        order: { createdAt: 'DESC' },
      });

      expect(result).toEqual([
        {
          id: 1,
          amount: 150,
          createdAt: mockBids[0].createdAt,
          userId: 1,
          username: 'user1',
        },
        {
          id: 2,
          amount: 200,
          createdAt: mockBids[1].createdAt,
          userId: 2,
          username: 'user2',
        },
      ]);
    });

    it('should return an empty array when no bids found', async () => {
      // Arrange
      const itemId = 1;
      mockBidsRepository.find.mockResolvedValue([]);

      // Act
      const result = await service.getItemBids(itemId);

      // Assert
      expect(result).toEqual([]);
    });
  });
}); 