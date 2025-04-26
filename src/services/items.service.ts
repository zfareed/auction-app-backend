import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Item } from '../entities/item.entity';
import { CreateItemDto } from '../dto/create-item.dto';
import { GetItemsDto } from '../dto/get-items.dto';
import { Like } from 'typeorm';

@Injectable()
export class ItemsService {
  constructor(
    @InjectRepository(Item)
    private itemsRepository: Repository<Item>,
  ) {}

  async create(createItemDto: CreateItemDto): Promise<Item> {
    const item = this.itemsRepository.create({
      ...createItemDto,
      currentHighestBid: createItemDto.startingPrice,
    });
    
    return this.itemsRepository.save(item);
  }

  async findAll(getItemsDto: GetItemsDto) {
    const page = getItemsDto.page || 1;
    const limit = getItemsDto.limit || 10;
    const { search } = getItemsDto;
    
    const skip = (page - 1) * limit;

    const queryBuilder = this.itemsRepository.createQueryBuilder('item');

    if (search) {
      queryBuilder.where('item.name ILIKE :search OR item.description ILIKE :search', {
        search: `%${search}%`,
      });
    }

    const [items, total] = await queryBuilder
      .orderBy('item.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    const totalPages = Math.ceil(total / limit);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findOne(id: number) {
    const item = await this.itemsRepository.findOne({
      where: { id },
      relations: ['bids', 'bids.user'],
      order: {
        bids: {
          createdAt: 'DESC'
        }
      }
    });

    if (!item) {
      throw new NotFoundException(`Item with ID ${id} not found`);
    }

    // Calculate time remaining
    const timeRemaining = new Date(item.auctionEndTime).getTime() - new Date().getTime();
    const isActive = timeRemaining > 0;

    return {
      ...item,
      bids: item.bids.map(bid => ({
        id: bid.id,
        amount: bid.amount,
        createdAt: bid.createdAt,
        userId: bid.user.id,
        username: bid.user.username
      })),
      timeRemaining: isActive ? timeRemaining : 0,
      status: isActive ? 'active' : 'ended'
    };
  }
} 