export class DatabaseError extends Error {
  public statusCode: number;
  constructor(message: string, public readonly originalError?: unknown) {
    super(message);
    this.name = "DatabaseError";
    this.statusCode = 500;
  }
}

export class TransactionError extends DatabaseError {
  constructor(message: string, originalError?: unknown) {
    super(`Transaction failed: ${message}`, originalError);
    this.name = "TransactionError";
  }
}

export class StorageQuotaError extends DatabaseError {
  constructor(message: string = "Browser storage quota exceeded") {
    super(message);
    this.name = "StorageQuotaError";
    this.statusCode = 413;
  }
}

export class ErrorPresenter {
  private static messages: Record<string, string> = {
    StorageQuotaError: "存储空间不足，请清理浏览器数据",
    NetworkError: "网络连接异常，请检查网络后重试",
    AuthError: "操作权限不足",
    EncryptionError: "数据加密失败",
    RetryableError: "操作失败，正在尝试重试...",
    Default: "系统发生未知错误",
  };

  static showError(error: unknown) {
    const message = this.resolveErrorMessage(error);
    this.renderToast(message);
  }

  private static resolveErrorMessage(error: unknown): string {
    if (error instanceof StorageQuotaError)
      return this.messages.StorageQuotaError;
    if (error instanceof DatabaseError) return error.message;
    return this.messages.Default;
  }

  private static renderToast(message: string) {
    // TODO: Implement toast notification
  }
}
