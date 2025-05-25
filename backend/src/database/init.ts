import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { User } from '../users/entities/user.entity';
import { DailyLog } from '../dailylogs/entities/daily-log.entity';
import { Notification } from '../notifications/entities/notification.entity';

config();

const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [User, DailyLog, Notification],
  synchronize: process.env.NODE_ENV !== 'production',
});

AppDataSource.initialize()
  .then(() => {
    console.log('Data Source has been initialized!');
  })
  .catch((err) => {
    console.error('Error during Data Source initialization:', err);
  }); 