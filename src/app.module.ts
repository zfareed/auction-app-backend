import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { User } from './entities/user.entity';
import { Item } from './entities/item.entity';
import { Bid } from './entities/bid.entity';
import { SeederService } from './database/seeder.service';
import { ItemsController } from './controllers/items.controller';
import { ItemsService } from './services/items.service';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'zain93',
      password: 'zain123*',
      database: 'auction-app',
      entities: [User, Item, Bid],
      synchronize: true, // Set to false in production
    }),
    TypeOrmModule.forFeature([User, Item, Bid]),
  ],
  controllers: [AppController, ItemsController],
  providers: [AppService, SeederService, ItemsService],
})
export class AppModule {}
