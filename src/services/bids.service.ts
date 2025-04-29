import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Bid } from '../entities/bid.entity';
import { Item } from '../entities/item.entity';
import { User } from '../entities/user.entity';
import { CreateBidDto } from '../dto/create-bid.dto';
import { AuctionGateway } from '../gateways/auction.gateway';

@Injectable()
export class BidsService {
  constructor(
    @InjectRepository(Bid)
    private bidsRepository: Repository<Bid>,
    @InjectRepository(Item)
    private itemsRepository: Repository<Item>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private auctionGateway: AuctionGateway,
    private dataSource: DataSource,
  ) {}

  async create(createBidDto: CreateBidDto): Promise<Bid> {
    const { userId, itemId, amount } = createBidDto;

    // Use a transaction with SERIALIZABLE isolation to prevent race conditions
    return this.dataSource.transaction(async (transactionalEntityManager) => {
      // Find the item - using the transaction manager
      const item = await transactionalEntityManager.findOne(Item, {
        where: { id: itemId },
        lock: { mode: 'pessimistic_write' }, // Add a lock to prevent concurrent modifications
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
      const user = await transactionalEntityManager.findOne(User, {
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Create the bid
      const bid = transactionalEntityManager.create(Bid, {
        amount,
        user,
        item,
      });

      // Update the item's current highest bid
      item.currentHighestBid = amount;
      await transactionalEntityManager.save(item);

      // Save the bid
      const savedBid = await transactionalEntityManager.save(bid);
      
      // Format the bid data for notification
      const bidData = {
        id: savedBid.id,
        amount: savedBid.amount,
        createdAt: savedBid.createdAt,
        userId: user.id,
        username: user.username,
      };

      // We'll notify clients after the transaction completes
      // to ensure we only notify on successful bids
      
      return { savedBid, bidData, itemId };
    }).then(({ savedBid, bidData, itemId }) => {
      // Notify all clients about the new bid after transaction completes
      this.auctionGateway.notifyNewBid(itemId, bidData);
      return savedBid;
    });
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