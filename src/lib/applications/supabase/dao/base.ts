import { DatabaseError } from "../../pglite/db/error";

export abstract class BaseDAO {
  protected handleQueryError(method: string, error: unknown): never {
    console.error(error);
    if (error instanceof DatabaseError) throw error;
    throw new DatabaseError(`Database ${method} operation failed`, error);
  }
}
