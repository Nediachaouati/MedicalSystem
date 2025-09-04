import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne } from 'typeorm';


@Entity()
export class Notification {
  @PrimaryGeneratedColumn()
   id: number;

  @Column()
  userId: number;

  @Column()
  message: string;

  @Column({ default: false })
  read: boolean;

  @CreateDateColumn()
  createdAt: Date;
}