import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { seedUsers } from '../seeds/user.seed';

@Injectable()
export class SeederService implements OnApplicationBootstrap {
  constructor(private dataSource: DataSource) {}

  async onApplicationBootstrap() {
    await seedUsers(this.dataSource);
  }
} 