import { DataSource } from 'typeorm';
import { User } from '../entities/user.entity';

export const seedUsers = async (dataSource: DataSource) => {
  const userRepository = dataSource.getRepository(User);
  
  // Check if users already exist
  const count = await userRepository.count();
  if (count > 0) {
    console.log('Users already seeded');
    return;
  }

  const users = Array.from({ length: 100 }, (_, i) => ({
    username: `user${i + 1}`,
    email: `user${i + 1}@example.com`,
  }));

  await userRepository.save(users);
  console.log('Users seeded successfully');
}; 