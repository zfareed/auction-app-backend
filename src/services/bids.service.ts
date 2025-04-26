import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bid } from '../entities/bid.entity';
import { Item } from '../entities/item.entity';
import { User } from '../entities/user.entity';
import { CreateBidDto } from '../dto/create-bid.dto';

@Injectable()
export class BidsService {
  constructor(
    @InjectRepository(Bid)
    private bidsRepository: Repository<Bid>,
    @InjectRepository(Item)
    private itemsRepository: Repository<Item>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createBidDto: CreateBidDto): Promise<Bid> {
    const { userId, itemId, amount } = createBidDto;

    // Find the item
    const item = await this.itemsRepository.findOne({
      where: { id: itemId },
    });

    if (!item) {
      throw new NotFoundException('Item not found');
    }

    // Check if auction is still active
    if (new Date() > item.auctionEndTime) {
      throw new BadRequestException('Auction has ended');
    }

    // Check if bid amount is higher than current highest bid
    if (amount <= item.currentHighestBid) {
      throw new BadRequestException(
        `Bid amount must be higher than current highest bid: ${item.currentHighestBid}`,
      );
    }

    // Find the user
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Create and save the bid
    const bid = this.bidsRepository.create({
      amount,
      user,
      item,
    });

    // Update the item's current highest bid
    item.currentHighestBid = amount;
    await this.itemsRepository.save(item);

    return this.bidsRepository.save(bid);
  }

  async getItemBids(itemId: number) {
    const bids = await this.bidsRepository.find({
      where: { item: { id: itemId } },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });

    return bids.map(bid => ({
      id: bid.id,
      amount: bid.amount,
      createdAt: bid.createdAt,
      userId: bid.user.id,
      username: bid.user.username,
    }));
  }
} 