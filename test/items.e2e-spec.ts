import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { ConfigModule } from '@nestjs/config';
import { CreateItemDto } from '../src/dto/create-item.dto';
import { getTestDbConfig } from './database-setup';

describe('Items API (e2e)', () => {
  let app: INestApplication;
  let server: any;

  beforeAll(async () => {
    // Override the AppModule's database connection with our test config
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
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/items (GET)', () => {
    it('should return paginated items', () => {
      return request(server)
        .get('/items')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('items');
          expect(res.body).toHaveProperty('meta');
        });
    });

    it('should accept pagination parameters', () => {
      return request(server)
        .get('/items?page=2&limit=5')
        .expect(200)
        .expect((res) => {
          expect(res.body.meta.page).toBe(2);
          expect(res.body.meta.limit).toBe(5);
        });
    });
  });

  describe('/items (POST)', () => {
    it('should create a new item', async () => {
      const createItemDto: CreateItemDto = {
        name: 'New Test Item',
        description: 'Created during E2E test',
        startingPrice: 200,
        auctionEndTime: new Date(Date.now() + 86400000), // 1 day in the future
      };

      const response = await request(server)
        .post('/items')
        .send(createItemDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name', createItemDto.name);
      expect(response.body).toHaveProperty('currentHighestBid', createItemDto.startingPrice);
      
      return response;
    });

    it('should validate request data', () => {
      const invalidItemDto = {
        name: '',
        description: 'Missing required fields',
        startingPrice: -5,
      };

      return request(server)
        .post('/items')
        .send(invalidItemDto)
        .expect(400);
    });
  });
  
  describe('/items/:id (GET)', () => {
    let itemId: number;

    beforeEach(async () => {
      // Create a test item to retrieve
      const createItemDto: CreateItemDto = {
        name: 'Test Item for Get',
        description: 'Test Description',
        startingPrice: 100,
        auctionEndTime: new Date(Date.now() + 86400000), // 1 day in the future
      };

      const response = await request(server)
        .post('/items')
        .send(createItemDto);
        
      if (response.status === 201) {
        itemId = response.body.id;
      } else {
        console.error('Failed to create test item:', response.body);
        throw new Error('Failed to create test item');
      }
    });

    it('should return an item by id', async () => {
      const response = await request(server)
        .get(`/items/${itemId}`)
        .expect(200);
        
      expect(response.body).toHaveProperty('id', itemId);
      expect(response.body).toHaveProperty('name', 'Test Item for Get');
      expect(response.body).toHaveProperty('status');
    });

    it('should return 404 for non-existent item', () => {
      return request(server)
        .get('/items/9999')
        .expect(404);
    });
  });
}); 