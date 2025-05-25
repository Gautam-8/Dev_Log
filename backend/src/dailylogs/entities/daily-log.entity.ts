import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum Mood {
  GREAT = 'GREAT',
  GOOD = 'GOOD',
  NEUTRAL = 'NEUTRAL',
  NOT_GREAT = 'NOT_GREAT',
  BAD = 'BAD'
}

@Entity('daily_logs')
export class DailyLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { eager: true })
  user: User;

  @Column({ type: 'text' })
  tasks: string; // HTML content from rich text editor

  @Column('jsonb')
  timeSpent: Array<{
    taskId: string;
    hours: number;
    minutes: number;
  }>;

  @Column({
    type: 'enum',
    enum: Mood,
    default: Mood.GOOD
  })
  mood: Mood;

  @Column({ type: 'text', nullable: true })
  blockers: string;

  @Column({ type: 'date' })
  logDate: Date;

  @Column({ default: false })
  isReviewed: boolean;

  @Column({ type: 'text', nullable: true })
  reviewComment: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 