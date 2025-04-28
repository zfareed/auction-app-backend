import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { ConfigModule } from '@nestjs/config';
import { CreateItemDto } from '../src/dto/create-item.dto';
import { CreateBidDto } from '../src/dto/create-bid.dto';
import { getTestDbConfig } from './database-setup';

describe('Bids API (e2e)', () => {
  let app: INestApplication;
  let server: any;
  let itemId: number;
  let userId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        getTestDbConfig(),
        AppModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
    
    server = app.getHttpServer();
    
    // Wait a bit to ensure database is ready
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Find or create a user for testing bids
    try {
      const usersResponse = await request(server).get('/users');
      if (usersResponse.body && usersResponse.body.length > 0) {
        userId = usersResponse.body[0].id;
      } else {
        // If no users exist, we'll use ID 1 assuming the seeder creates users
        userId = 1;
      }
      
      // Create a test item for bids
      const createItemDto: CreateItemDto = {
        name: 'Test Item for Bids',
        description: 'Item used for testing bids',
        startingPrice: 100,
        auctionEndTime: new Date(Date.now() + 86400000), // 1 day in the future
      };

      const itemResponse = await request(server)
        .post('/items')
        .send(createItemDto);
        
      if (itemResponse.status === 201) {
        itemId = itemResponse.body.id;
      } else {
        console.error('Failed to create test item:', itemResponse.body);
        throw new Error('Failed to create test item');
      }
    } catch (error) {
      console.error('Setup error:', error);
      throw error;
    }
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/bids (POST)', () => {
    it('should create a new bid', async () => {
      const createBidDto: CreateBidDto = {
        userId: userId,
        itemId: itemId,
        amount: 150,
      };

      const response = await request(server)
        .post('/bids')
        .send(createBidDto)
        .expect(201);
        
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('amount', createBidDto.amount);
    });

    it('should reject a bid lower than current highest', async () => {
      const lowBidDto: CreateBidDto = {
        userId: userId,
        itemId: itemId,
        amount: 120, // Lower than previous bid of 150
      };

      await request(server)
        .post('/bids')
        .send(lowBidDto)
        .expect(400);
    });

    it('should create a higher bid', async () => {
      const higherBidDto: CreateBidDto = {
        userId: userId,
        itemId: itemId,
        amount: 200, // Higher than previous bid
      };

      await request(server)
        .post('/bids')
        .send(higherBidDto)
        .expect(201);
    });
  });

  describe('/bids/item/:itemId (GET)', () => {
    it('should return all bids for an item', async () => {
      const response = await request(server)
        .get(`/bids/item/${itemId}`)
        .expect(200);
        
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty('amount');
        expect(response.body[0]).toHaveProperty('userId');
      }
    });

    it('should return empty array for item with no bids', async () => {
      // Create a new item with no bids
      const newItemDto: CreateItemDto = {
        name: 'No Bids Item',
        description: 'Item with no bids',
        startingPrice: 100,
        auctionEndTime: new Date(Date.now() + 86400000),
      };

      const itemResponse = await request(server)
        .post('/items')
        .send(newItemDto)
        .expect(201);
      
      const newItemId = itemResponse.body.id;

      // Check bids for this item
      const response = await request(server)
        .get(`/bids/item/${newItemId}`)
        .expect(200);
        
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });
  });
}); 