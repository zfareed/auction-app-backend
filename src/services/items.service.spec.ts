import { Test, TestingModule } from '@nestjs/testing';
import { ItemsService } from './items.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Item } from '../entities/item.entity';
import { Repository } from 'typeorm';
import { CreateItemDto } from '../dto/create-item.dto';
import { GetItemsDto } from '../dto/get-items.dto';

describe('ItemsService', () => {
  let service: ItemsService;
  let itemRepository: Repository<Item>;

  const mockItemRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn(),
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ItemsService,
        {
          provide: getRepositoryToken(Item),
          useValue: mockItemRepository,
        },
      ],
    }).compile();

    service = module.get<ItemsService>(ItemsService);
    itemRepository = module.get<Repository<Item>>(getRepositoryToken(Item));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new item', async () => {
      // Arrange
      const createItemDto: CreateItemDto = {
        name: 'Test Item',
        description: 'Test Description',
        startingPrice: 100,
        auctionEndTime: new Date(),
      };
      
      const createdItem = {
        id: 1,
        ...createItemDto,
        currentHighestBid: createItemDto.startingPrice,
      };
      
      mockItemRepository.create.mockReturnValue(createdItem);
      mockItemRepository.save.mockResolvedValue(createdItem);

      // Act
      const result = await service.create(createItemDto);

      // Assert
      expect(mockItemRepository.create).toHaveBeenCalledWith({
        ...createItemDto,
        currentHighestBid: createItemDto.startingPrice,
      });
      expect(mockItemRepository.save).toHaveBeenCalledWith(createdItem);
      expect(result).toEqual(createdItem);
    });
  });

  describe('findAll', () => {
    it('should return paginated items', async () => {
      // Arrange
      const getItemsDto: GetItemsDto = { page: 1, limit: 10 };
      const items = [{ id: 1, name: 'Item 1' }, { id: 2, name: 'Item 2' }];
      const queryBuilder = mockItemRepository.createQueryBuilder();
      queryBuilder.getManyAndCount.mockResolvedValue([items, 2]);

      // Act
      const result = await service.findAll(getItemsDto);

      // Assert
      expect(queryBuilder.skip).toHaveBeenCalledWith(0);
      expect(queryBuilder.take).toHaveBeenCalledWith(10);
      expect(result).toEqual({
        items,
        meta: {
          total: 2,
          page: 1,
          limit: 10,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false
        }
      });
    });
  });

  describe('findOne', () => {
    it('should return an item by id', async () => {
      // Arrange
      const id = 1;
      const item = { 
        id, 
        name: 'Item 1',
        bids: [] // Empty bids array to prevent undefined error
      };
      mockItemRepository.findOne.mockResolvedValue(item);

      // Act
      const result = await service.findOne(id);

      // Assert
      expect(mockItemRepository.findOne).toHaveBeenCalledWith({
        where: { id },
        relations: ['bids', 'bids.user'],
        order: {
          bids: {
            createdAt: 'DESC',
          },
        },
      });
      
      // The service adds status and timeRemaining properties
      expect(result).toEqual({
        ...item,
        status: 'ended',
        timeRemaining: 0
      });
    });
  });
}); 