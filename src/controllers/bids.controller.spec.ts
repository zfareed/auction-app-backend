import { Test, TestingModule } from '@nestjs/testing';
import { BidsController } from './bids.controller';
import { BidsService } from '../services/bids.service';
import { CreateBidDto } from '../dto/create-bid.dto';

describe('BidsController', () => {
  let controller: BidsController;
  let service: BidsService;

  const mockBidsService = {
    create: jest.fn(),
    getItemBids: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BidsController],
      providers: [
        {
          provide: BidsService,
          useValue: mockBidsService,
        },
      ],
    }).compile();

    controller = module.get<BidsController>(BidsController);
    service = module.get<BidsService>(BidsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new bid', async () => {
      // Arrange
      const createBidDto: CreateBidDto = {
        userId: 1,
        itemId: 1,
        amount: 150,
      };
      
      const createdBid = {
        id: 1,
        ...createBidDto,
        createdAt: new Date(),
      };
      
      mockBidsService.create.mockResolvedValue(createdBid);

      // Act
      const result = await controller.create(createBidDto);

      // Assert
      expect(service.create).toHaveBeenCalledWith(createBidDto);
      expect(result).toEqual(createdBid);
    });
  });

  describe('getItemBids', () => {
    it('should return bids for an item', async () => {
      // Arrange
      const itemId = 1;
      const bids = [
        { id: 1, amount: 110, createdAt: new Date() },
        { id: 2, amount: 120, createdAt: new Date() },
      ];
      
      mockBidsService.getItemBids.mockResolvedValue(bids);

      // Act
      const result = await controller.getItemBids(itemId);

      // Assert
      expect(service.getItemBids).toHaveBeenCalledWith(itemId);
      expect(result).toEqual(bids);
    });
  });
}); 