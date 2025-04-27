import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { User } from './entities/user.entity';
import { Item } from './entities/item.entity';
import { Bid } from './entities/bid.entity';
import { SeederService } from './database/seeder.service';
import { ItemsController } from './controllers/items.controller';
import { ItemsService } from './services/items.service';
import { BidsController } from './controllers/bids.controller';
import { BidsService } from './services/bids.service';
import { AuctionGateway } from './gateways/auction.gateway';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Make config available throughout the application
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: parseInt(configService.get('DB_PORT', '5432')),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_DATABASE'),
        entities: [User, Item, Bid],
        synchronize: false,
      }),
    }),
    TypeOrmModule.forFeature([User, Item, Bid]),
  ],
  controllers: [AppController, ItemsController, BidsController],
  providers: [AppService, SeederService, ItemsService, BidsService, AuctionGateway],
})
export class AppModule {}
