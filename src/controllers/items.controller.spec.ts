import { Test, TestingModule } from '@nestjs/testing';
import { ItemsController } from './items.controller';
import { ItemsService } from '../services/items.service';
import { CreateItemDto } from '../dto/create-item.dto';
import { GetItemsDto } from '../dto/get-items.dto';

describe('ItemsController', () => {
  let controller: ItemsController;
  let service: ItemsService;

  const mockItemsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ItemsController],
      providers: [
        {
          provide: ItemsService,
          useValue: mockItemsService,
        },
      ],
    }).compile();

    controller = module.get<ItemsController>(ItemsController);
    service = module.get<ItemsService>(ItemsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
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
        currentHighestBid: 100,
      };
      
      mockItemsService.create.mockResolvedValue(createdItem);

      // Act
      const result = await controller.create(createItemDto);

      // Assert
      expect(service.create).toHaveBeenCalledWith(createItemDto);
      expect(result).toEqual(createdItem);
    });
  });

  describe('findAll', () => {
    it('should return paginated items', async () => {
      // Arrange
      const getItemsDto: GetItemsDto = { page: 1, limit: 10 };
      const paginatedResult = {
        items: [{ id: 1, name: 'Item 1' }, { id: 2, name: 'Item 2' }],
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
      };
      
      mockItemsService.findAll.mockResolvedValue(paginatedResult);

      // Act
      const result = await controller.findAll(getItemsDto);

      // Assert
      expect(service.findAll).toHaveBeenCalledWith(getItemsDto);
      expect(result).toEqual(paginatedResult);
    });
  });

  describe('findOne', () => {
    it('should return an item by id', async () => {
      // Arrange
      const id = 1;
      const item = { id, name: 'Item 1' };
      mockItemsService.findOne.mockResolvedValue(item);

      // Act
      const result = await controller.findOne(id);

      // Assert
      expect(service.findOne).toHaveBeenCalledWith(id);
      expect(result).toEqual(item);
    });
  });
}); 