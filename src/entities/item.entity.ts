import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn } from 'typeorm';
import { Bid } from './bid.entity';

@Entity()
export class Item {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column('text')
  description: string;

  @Column('decimal', { precision: 10, scale: 2 })
  startingPrice: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  currentHighestBid: number;

  @CreateDateColumn()
  createdAt: Date;

  @Column()
  auctionEndTime: Date;

  @OneToMany(() => Bid, (bid) => bid.item)
  bids: Bid[];
} 