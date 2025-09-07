import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from "typeorm";

@Entity("currency_rates")
@Index(["source", "currency", "timestamp"])
export class CurrencyRate {
  @PrimaryGeneratedColumn()
  id: number;


  @Column({ type: "varchar", length: 20 })
  source: string;

  @Column({ type: "varchar", length: 10 })
  currency: string;

  @Column({ type: "decimal", precision: 10, scale: 4 })
  value: number;

  @CreateDateColumn()
  timestamp: Date;
}
