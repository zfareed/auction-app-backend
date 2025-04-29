
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
npm run start:dev
```

The application will be available at `http://localhost:3000` and will automatically reload when you make changes to the source code.

### Debug Mode

```bash
npm run start:debug
```

### Production Mode

```bash
npm run build
npm run start:prod
```

## API Endpoints

### Items

- **GET** `/items` - Get all auction items (paginated)
- **GET** `/items/:id` - Get a specific auction item with its bids
- **POST** `/items` - Create a new auction item

### Bids

- **POST** `/bids` - Place a new bid on an item
- **GET** `/bids/item/:itemId` - Get all bids for a specific item

### Users

- **GET** `/users` - Get all users
- **GET** `/users/:id` - Get a specific user

## WebSocket Events

The application uses Socket.IO for real-time updates:

- `joinAuction` - Join an auction room to receive updates
- `leaveAuction` - Leave an auction room
- `newBid` - Event emitted when a new bid is placed

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

## CI/CD

The project uses GitHub Actions for CI/CD with tests running on pull requests and automatic deployment to Render when merging to the `master` branch.