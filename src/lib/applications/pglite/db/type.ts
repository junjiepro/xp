import { type Transaction } from "@electric-sql/pglite";

export interface Migration {
  up(trx: Transaction): Promise<void>;
  down(trx: Transaction): Promise<void>;
}

export interface PerformanceMetric {
  operation: string;
  status: "success" | "error";
  duration: number;
  timestamp: Date;
  error?: string;
}
