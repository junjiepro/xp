import { type Knex } from "knex";

export interface Migration {
  up(knex: Knex): Promise<void>;
  down(knex: Knex): Promise<void>;
}

export interface PerformanceMetric {
  operation: string;
  status: "success" | "error";
  duration: number;
  timestamp: Date;
  error?: string;
}
