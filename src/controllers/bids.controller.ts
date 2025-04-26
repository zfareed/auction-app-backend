import { Controller, Post, Body, Get, Param, ValidationPipe } from '@nestjs/common';
import { BidsService } from '../services/bids.service';
import { CreateBidDto } from '../dto/create-bid.dto';

@Controller('bids')
export class BidsController {
  constructor(private readonly bidsService: BidsService) {}

  @Post()
  async create(@Body(ValidationPipe) createBidDto: CreateBidDto) {
    return this.bidsService.create(createBidDto);
  }

  @Get('item/:itemId')
  async getItemBids(@Param('itemId') itemId: number) {
    return this.bidsService.getItemBids(itemId);
  }
} 