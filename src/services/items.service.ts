import { Injectable } from '@nestjs/common';
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
} 