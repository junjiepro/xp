import { PGlite, Transaction } from "@electric-sql/pglite";
import { uuid_ossp } from "@electric-sql/pglite/contrib/uuid_ossp";
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

    const existing = await db.transaction(async (trx) => {
      try {
        await trx.query(
          "create table if not exists migrations (id serial primary key, name text not null unique);"
        );

        const existing = await trx.query<{ name: string }>(
          "select name from migrations;"
        );

        return existing;
      } catch (error) {
        await trx.rollback();
        await StorageManager.handleStorageError(error);
      }
    });

    if (!existing) return;
    Object.keys(migrations)
      .sort()
      .forEach(async (name) => {
        await db.transaction(async (trx) => {
          try {
            if (!existing.rows.some((r) => r.name === name)) {
              await migrations[name].up(trx);
              await trx.query("insert into migrations (name) values ($1)", [
                name,
              ]);
            }
          } catch (error) {
            await trx.rollback();
            await StorageManager.handleStorageError(error);
          }
        });
      });
  } catch (error) {
    await StorageManager.handleStorageError(error);
  }
}

function connectDB(connectionString?: string) {
  const db = new PGlite(connectionString, { extensions: { uuid_ossp } });

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

async function initDB(
  db: PGlite,
  migrations: Record<string, Migration>,
  password: string
) {
  await CryptoService.init(password);
  await StorageManager.ensureStorageAccess();
  await initializeDB(db, migrations);
}

export function init(
  migrations: Record<string, Migration>,
  connectionString?: string,
  password = process.env.NEXT_PUBLIC_DB_CRYPTO_KEY
) {
  try {
    if (typeof window === "undefined") return undefined;
    if (!password) {
      throw new Error("DB crypto password is required");
    }
    const db = connectDB(connectionString);

    initDB(db, migrations, password);

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
    console.error(error);
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
