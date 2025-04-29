import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
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
import { UsersController } from './controllers/users.controller';
import { UsersService } from './services/users.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Make config available throughout the application
    }),
    // Configure the ThrottlerModule
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ([
        {
          ttl: config.get('THROTTLE_TTL', 60), // Time window in seconds
          limit: config.get('THROTTLE_LIMIT', 100), // Request limit per window
        },
      ]),
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
        synchronize: true,
        poolSize: 20,                   // Maximum number of connections
        pool: {
          min: 5,                       // Minimum number of connections in pool
          max: 20,                      // Maximum number of connections in pool
          idle: 10000,                  // Close idle connections after 10 seconds
          acquire: 30000,               // Maximum time to acquire connection (30 seconds)
          evict: 30000,                 // Run cleanup every 30 seconds
        },
        extra: {
          // PostgreSQL specific pool settings
          max: 20,                      // Maximum connections same as pool max
          connectionTimeoutMillis: 10000, // Timeout when acquiring a connection
          idleTimeoutMillis: 10000,     // Idle connection timeout
        },
        logging: ['error', 'schema', 'warn'],
        logger: 'advanced-console',
      }),
    }),
    TypeOrmModule.forFeature([User, Item, Bid]),
  ],
  controllers: [AppController, ItemsController, BidsController, UsersController],
  providers: [
    // Add global guard for rate limiting
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    AppService,
    SeederService,
    ItemsService,
    BidsService,
    AuctionGateway,
    UsersService
  ],
})
export class AppModule {}
