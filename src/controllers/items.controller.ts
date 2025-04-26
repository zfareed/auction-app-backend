import { Controller, Post, Body, Get, ValidationPipe, Query } from '@nestjs/common';
import { ItemsService } from '../services/items.service';
import { CreateItemDto } from '../dto/create-item.dto';
import { Item } from '../entities/item.entity';
import { GetItemsDto } from '../dto/get-items.dto';

@Controller('items')
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Post()
  async create(@Body(ValidationPipe) createItemDto: CreateItemDto): Promise<Item> {
    return this.itemsService.create(createItemDto);
  }

  @Get()
  async findAll(@Query(ValidationPipe) getItemsDto: GetItemsDto) {
    return this.itemsService.findAll(getItemsDto);
  }
} 