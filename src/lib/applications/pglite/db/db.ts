import { PGlite, Transaction } from "@electric-sql/pglite";
import {
  DatabaseError,
  TransactionError,
  StorageQuotaError,
  ErrorPresenter,
} from "./error";
import { CryptoService, StorageManager } from "./security";
import { Migration } from "./type";
import { PerformanceMonitor } from "./monitor";

async function migrateLatest(
  db: PGlite,
  migrations: Record<string, Migration>
) {
  try {
    await StorageManager.ensureStorageAccess();

    await db.transaction(async (trx) => {
      try {
        await trx.query(
          "create table if not exists migrations (id serial primary key, name text not null unique);"
        );

        const existing = await trx.query<{ name: string }>(
          "select name from migrations;"
        );

        Object.keys(migrations)
          .sort()
          .forEach(async (name) => {
            if (!existing.rows.some((r) => r.name === name)) {
              await migrations[name].up(trx);
              await trx.query("insert into migrations (name) values ($1)", [
                name,
              ]);
            }
          });
      } catch (error) {
        await trx.rollback();
        await StorageManager.handleStorageError(error);
        throw error;
      }
    });
  } catch (error) {
    await StorageManager.handleStorageError(error);
    throw error;
  }
}

function connectDB(connectionString?: string) {
  const db = new PGlite(connectionString);

  return db;
}

// 初始化数据库
async function initializeDB(db: PGlite, migrations: Record<string, Migration>) {
  try {
    await StorageManager.ensureStorageAccess();

    await migrateLatest(db, migrations);
  } catch (error) {
    await StorageManager.handleStorageError(error);
    throw error;
  }
}

export async function init(
  migrations: Record<string, Migration>,
  connectionString?: string,
  password = process.env.NEXT_PUBLIC_DB_CRYPTO_KEY
) {
  try {
    if (!password) {
      throw new Error("DB crypto password is required");
    }
    const db = connectDB(connectionString);
    await CryptoService.init(password);
    await StorageManager.ensureStorageAccess();
    await initializeDB(db, migrations);

    setInterval(() => PerformanceMonitor.reportMetrics(), 60_000);

    return db;
  } catch (error) {
    ErrorPresenter.showError(error);
    throw error;
  }
}

export abstract class BaseDAO<T extends Record<string, any>> {
  protected abstract tableName: string;
  protected readonly db: PGlite;
  constructor(db: PGlite) {
    this.db = db;
  }

  protected async withTransaction<R>(
    operation: (trx: Transaction) => Promise<R>
  ): Promise<R> {
    const result = await this.db.transaction(async (trx) => {
      try {
        return await operation(trx);
      } catch (error) {
        if (trx) await trx.rollback();
        if (error instanceof DatabaseError) throw error;
        throw new TransactionError("Database operation failed", error);
      }
    });
    return result;
  }

  protected handleQueryError(method: string, error: unknown): never {
    if (error instanceof DatabaseError) throw error;
    throw new DatabaseError(`Database ${method} operation failed`, error);
  }

  protected async insert<
    T extends Record<string, any>,
    U extends Record<string, any>
  >(trx: Transaction, data: T) {
    return trx.query<U>(
      `insert into ${this.tableName} (${Object.keys(data).join(
        ","
      )}) values (${Object.keys(data)
        .map((_, i) => `$${i + 1}`)
        .join(",")}) returning *`,
      Object.values(data)
    );
  }
}
