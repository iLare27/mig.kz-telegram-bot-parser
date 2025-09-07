import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from "typeorm";
import { UserSettings } from "./UserSettings";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn()
  id: number;


  @Column({ type: "bigint", unique: true })
  telegramId: number;

  @Column({ type: "varchar", length: 10, nullable: true })
  language?: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => UserSettings, (settings) => settings.user)
  settings: UserSettings[];
}
