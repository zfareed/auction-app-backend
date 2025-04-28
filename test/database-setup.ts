import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DataSource, DataSourceOptions } from 'typeorm';

export const getTestDbConfig = () => {
  return TypeOrmModule.forRootAsync({
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: (configService: ConfigService) => ({
      type: 'postgres',
      host: configService.get('DB_HOST', 'localhost'),
      port: configService.get<number>('DB_PORT', 5432),
      username: configService.get('DB_USERNAME', 'postgres'),
      password: configService.get('DB_PASSWORD', 'postgres'),
      database: configService.get('DB_DATABASE', 'auction_test'),
      entities: [__dirname + '/../src/**/*.entity{.ts,.js}'],
      synchronize: true, // This will be true for tests
      dropSchema: true,  // Clean the database before tests
    }),
    dataSourceFactory: async (options) => {
      if (!options) {
        throw new Error('DataSource options is undefined');
      }
      const dataSource = await new DataSource(options as DataSourceOptions).initialize();
      // Ensure tables are fully created before tests begin
      await dataSource.synchronize(true);
      return dataSource;
    },
  });
}; 