import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { User } from "./User";

@Entity("user_settings")
export class UserSettings {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "int" })
  userId: number;


  @Column({ type: "varchar", length: 10, default: "USD" })
  currency: string;

  @Column({ type: "varchar", length: 20, default: "mig.kz" })
  source: string;

  @Column({ type: "decimal", precision: 5, scale: 2, default: 1.0 })
  thresholdPercent: number;

  @Column({ type: "boolean", default: false })
  notifyEnabled: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.settings)
  @JoinColumn({ name: "userId" })
  user: User;
}
