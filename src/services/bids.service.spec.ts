import { Test, TestingModule } from '@nestjs/testing';
import { BidsService } from './bids.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Bid } from '../entities/bid.entity';
import { Item } from '../entities/item.entity';
import { User } from '../entities/user.entity';
import { Repository } from 'typeorm';
import { CreateBidDto } from '../dto/create-bid.dto';
import { AuctionGateway } from '../gateways/auction.gateway';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('BidsService', () => {
  let service: BidsService;
  let bidRepository: Repository<Bid>;
  let itemRepository: Repository<Item>;
  let userRepository: Repository<User>;
  let auctionGateway: AuctionGateway;

  const mockBidRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };

  const mockItemRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
  };

  const mockAuctionGateway = {
    notifyNewBid: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BidsService,
        {
          provide: getRepositoryToken(Bid),
          useValue: mockBidRepository,
        },
        {
          provide: getRepositoryToken(Item),
          useValue: mockItemRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: AuctionGateway,
          useValue: mockAuctionGateway,
        },
      ],
    }).compile();

    service = module.get<BidsService>(BidsService);
    bidRepository = module.get<Repository<Bid>>(getRepositoryToken(Bid));
    itemRepository = module.get<Repository<Item>>(getRepositoryToken(Item));
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    auctionGateway = module.get<AuctionGateway>(AuctionGateway);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a valid bid', async () => {
      // Arrange
      const now = new Date();
      const createBidDto: CreateBidDto = {
        userId: 1,
        itemId: 1,
        amount: 150,
      };
      
      const user = { id: 1, username: 'testuser' };
      const item = { 
        id: 1, 
        name: 'Test Item', 
        currentHighestBid: 100,
        auctionEndTime: new Date(now.getTime() + 10000) // 10 seconds in future
      };
      const bid = { id: 1, amount: 150, user, item };
      
      mockUserRepository.findOne.mockResolvedValue(user);
      mockItemRepository.findOne.mockResolvedValue(item);
      mockBidRepository.create.mockReturnValue(bid);
      mockBidRepository.save.mockResolvedValue(bid);

      // Act
      const result = await service.create(createBidDto);

      // Assert
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(mockItemRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(mockBidRepository.create).toHaveBeenCalled();
      expect(mockBidRepository.save).toHaveBeenCalled();
      expect(mockItemRepository.save).toHaveBeenCalledWith({ 
        ...item, 
        currentHighestBid: 150 
      });
      expect(mockAuctionGateway.notifyNewBid).toHaveBeenCalledWith(1, expect.any(Object));
      expect(result).toEqual(bid);
    });

    it('should throw BadRequestException if bid amount is too low', async () => {
      // Arrange
      const createBidDto: CreateBidDto = {
        userId: 1,
        itemId: 1,
        amount: 50,
      };
      
      const user = { id: 1, username: 'testuser' };
      const item = { id: 1, name: 'Test Item', currentHighestBid: 100 };
      
      mockUserRepository.findOne.mockResolvedValue(user);
      mockItemRepository.findOne.mockResolvedValue(item);

      // Act & Assert
      await expect(service.create(createBidDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if user not found', async () => {
      // Arrange
      const createBidDto: CreateBidDto = {
        userId: 999,
        itemId: 1,
        amount: 150,
      };
      
      mockUserRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.create(createBidDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getItemBids', () => {
    it('should return bids for an item', async () => {
      // Arrange
      const itemId = 1;
      const bids = [
        { 
          id: 1, 
          amount: 110, 
          createdAt: new Date(),
          user: { id: 1, username: 'user1' }
        },
        { 
          id: 2, 
          amount: 120, 
          createdAt: new Date(),
          user: { id: 2, username: 'user2' }
        },
      ];
      
      mockBidRepository.find.mockResolvedValue(bids);

      // Act
      const result = await service.getItemBids(itemId);

      // Assert
      expect(mockBidRepository.find).toHaveBeenCalledWith({
        where: { item: { id: itemId } },
        relations: ['user'],
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(bids.map(bid => ({
        id: bid.id,
        amount: bid.amount,
        createdAt: bid.createdAt,
        userId: bid.user.id,
        username: bid.user.username,
      })));
    });
  });
}); 