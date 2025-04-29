
# Auction App Backend

  

A scalable real-time backend service for an online auction platform, developed using NestJS, TypeORM, PostgreSQL, and Socket.IO. It provides a RESTful API for managing users, auction items, and bids, while supporting real-time bid updates through WebSockets. The backend is fully containerized with Docker for easy deployment and scalability.

  
  

## Prerequisites

  

- Node.js (v20 or later)

- npm (v9 or later)

- PostgreSQL (v15 or later)

  

## Installation

  

1. Clone the repository:

  

```bash

git clone https://github.com/zfareed/auction-app-backend

cd auction-app-backend

```

  

2. Install dependencies:

  

```bash

npm install

```

  

## Configuration

  

Create a `.env` file in the root directory with the following environment variables:

  

```env

# Database Configuration

DB_HOST=localhost

DB_PORT=5432

DB_USERNAME=postgres

DB_PASSWORD=your_password

DB_DATABASE=auction_app

  

# API Configuration

NODE_ENV=development

PORT=3000

```

  

## Running the Application

  

### Development Mode

  

```bash

npm  run  start:dev

```

  

The application will be available at `http://localhost:3000` and will automatically reload when you make changes to the source code.

  

### Debug Mode

  

```bash

npm  run  start:debug

```

  

### Production Mode

  

```bash

npm  run  build

npm  run  start:prod

```

  

## API Endpoints

  

### Items

  

-  **GET**  `/items` - Get all auction items (paginated)

-  **GET**  `/items/:id` - Get a specific auction item with its bids

-  **POST**  `/items` - Create a new auction item

  

### Bids

  

-  **POST**  `/bids` - Place a new bid on an item

-  **GET**  `/bids/item/:itemId` - Get all bids for a specific item

  

### Users

  

-  **GET**  `/users` - Get all users

-  **GET**  `/users/:id` - Get a specific user

  

## WebSocket Events

  

The application uses Socket.IO for real-time updates:

  

-  `joinAuction` - Join an auction room to receive updates

-  `leaveAuction` - Leave an auction room

-  `newBid` - Event emitted when a new bid is placed

  

## Docker Deployment

  

You can use Docker to build and run the application:

  

1. Build the Docker image:

  

```bash

docker build -t auction-app-backend .

```

  

2. Run the container:

  

```bash

sudo docker run --env-file .env -p 3000:3000 --network host auction-app-backend

```

  

## Testing

  

Run tests with Jest:

  

- Run all tests:

  

```bash

npm test

```

  
  

## Database Seeding

  

The application automatically seeds 100 test users when started. This is handled by the `SeederService` in `src/database/seeder.service.ts`.

  

## Architecture & Design Decisions

  

### System Architecture

  

The auction application follows a modular architecture using NestJS's dependency injection system:

  

-  **Controllers**: Handle HTTP requests and define API endpoints

-  **Services**: Contain business logic and database operations

-  **Gateways**: Manage WebSocket connections for real-time updates

-  **Entities**: Define database models and relationships

-  **DTOs**: Ensure type safety and validation for data transfer

  

### Key Design Decisions

  

#### 1. Transaction Management for Bids

  

To maintain data integrity during concurrent bidding, the application uses database transactions with pessimistic locking. This approach prevents race conditions by ensuring only one bid can be processed at a time for a specific item, which is crucial in an auction system where multiple users might attempt to place bids simultaneously.

  

#### 2. Real-time Updates with WebSockets

  

The application uses Socket.IO to provide real-time bid updates to all connected clients:

  

- Clients join specific auction "rooms" to receive targeted updates

- When a new bid is placed, all clients watching that auction receive an immediate notification

- The server emits events only after database transactions are successfully completed

  

This approach ensures users always have the latest bid information without needing to refresh their browsers.

  

#### 3. Connection Pooling & Performance Optimization

  

Database connection pooling is configured to handle high concurrency. By maintaining a pool of database connections, the application can efficiently handle multiple simultaneous requests without the overhead of creating new connections. This significantly improves performance during peak bidding periods.

  

#### 4. Rate Limiting & Security

  

The application implements rate limiting to prevent abuse and API flooding. This protects the system from potential DoS attacks and ensures fair access to the bidding system for all users, especially during high-traffic auctions.

This approach ensures consistent deployment across different environments and facilitates scaling.

  

#### 6. Automated Testing & CI/CD

  

The codebase includes comprehensive unit tests and implements CI/CD using GitHub Actions:

- Tests are run on every pull request

- Successful merges to master trigger automatic deployment to Render

  

This ensures code quality and facilitates rapid, reliable deployment of new features.