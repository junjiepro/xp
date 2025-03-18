import { PGlite } from "@electric-sql/pglite";
import knex, { Knex } from "knex";
import ClientPgLite from "knex-pglite";

import {
  DatabaseError,
  TransactionError,
  StorageQuotaError,
  ErrorPresenter,
} from "./error";
import { CryptoService, StorageManager } from "./security";
import { Migration } from "./type";
import { PerformanceMonitor } from "./monitor";

class BrowserMigrationSource {
  private migrations: Record<string, Migration> = {};

  constructor(migrations: Record<string, Migration>) {
    this.migrations = migrations;
  }

  async getMigrations(): Promise<string[]> {
    return Object.keys(this.migrations).sort();
  }

  getMigrationName(migration: string): string {
    return migration;
  }

  async getMigration(migration: string): Promise<Migration> {
    return this.migrations[migration];
  }
}

async function migrateLatest(db: Knex, migrations: Record<string, Migration>) {
  try {
    await StorageManager.ensureStorageAccess();

    await db.transaction(async (trx) => {
      await db.migrate.latest({
        migrationSource: new BrowserMigrationSource(migrations),
        // storage: {
        //   async get() {
        //     const record = await trx("knex_migrations")
        //       .select("name")
        //       .orderBy("id", "asc")
        //       .catch((error) => {
        //         throw new TransactionError("Failed to get migrations", error);
        //       });
        //     return record.map((r) => r.name);
        //   },
        //   async set(completed) {
        //     const existing = await trx("knex_migrations")
        //       .select("name")
        //       .catch((error) => {
        //         throw new TransactionError("Failed to query migrations", error);
        //       });

        //     const toDelete = existing.filter(
        //       (r) => !completed.includes(r.name)
        //     );
        //     const toInsert = completed.filter(
        //       (name) => !existing.some((r) => r.name === name)
        //     );

        //     await db.transaction(async (trx) => {
        //       if (toDelete.length > 0) {
        //         await trx("knex_migrations").whereIn("name", toDelete).del();
        //       }
        //       for (const name of toInsert) {
        //         await trx("knex_migrations").insert({ name });
        //       }
        //     });
        //   },
        // },
      });
    });
  } catch (error) {
    await StorageManager.handleStorageError(error);
    throw error;
  }
}

function connectDB(connectionString: string) {
  const db = knex({
    client: ClientPgLite,
    dialect: "postgres",
    connection: { connectionString },
    useNullAsDefault: true,
    wrapIdentifier: (value, origImpl) => origImpl(value), // 防止SQL注入
    postProcessResponse: (result) => {
      // 安全清洗返回数据
      return JSON.parse(JSON.stringify(result));
    },
  });

  return db;
}

// 初始化数据库
async function initializeDB(db: Knex, migrations: Record<string, Migration>) {
  try {
    await StorageManager.ensureStorageAccess();

    // if (!(await db.schema.hasTable("knex_migrations"))) {
    //   await db.schema
    //     .createTable("knex_migrations", (table) => {
    //       table.increments("id").primary();
    //       table.string("name").notNullable();
    //       table.timestamp("migration_time").defaultTo(db.fn.now());
    //     })
    //     .catch((error) => {
    //       throw new DatabaseError("Failed to create migrations table", error);
    //     });
    // }

    await migrateLatest(db, migrations);
  } catch (error) {
    await StorageManager.handleStorageError(error);
    throw error;
  }
}

export async function init(
  connectionString: string,
  password: string,
  migrations: Record<string, Migration>
) {
  try {
    await CryptoService.init(password);
    await StorageManager.ensureStorageAccess();
    await initializeDB(connectDB(connectionString), migrations);

    setInterval(() => PerformanceMonitor.reportMetrics(), 60_000);
  } catch (error) {
    ErrorPresenter.showError(error);
    throw error;
  }
}

export abstract class BaseDAO<T extends Record<string, any>> {
  protected abstract tableName: string;
  protected readonly db: Knex;
  constructor(db: Knex) {
    this.db = db;
  }

  protected async withTransaction<R>(
    operation: (trx: Knex.Transaction) => Promise<R>
  ): Promise<R> {
    let trx: Knex.Transaction | null = null;
    try {
      trx = await this.db.transaction();
      const result = await operation(trx);
      await trx.commit();
      return result;
    } catch (error) {
      if (trx) await trx.rollback();
      if (error instanceof DatabaseError) throw error;
      throw new TransactionError("Database operation failed", error);
    }
  }

  protected handleQueryError(method: string, error: unknown): never {
    if (error instanceof DatabaseError) throw error;
    throw new DatabaseError(`Database ${method} operation failed`, error);
  }
}
