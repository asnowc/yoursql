import {
  DbQuery,
  DbConnection,
  DbPoolConnection,
  SqlLike,
  QueryInput,
  MultipleQueryInput,
  MultipleQueryResult,
  QueryRowsResult,
  SingleQueryResult,
} from "@asla/yoursql/client";
import { Mock, vi } from "vitest";
function wait(ms: number) {
  //@ts-ignore
  return new Promise((resolve, reject) => setTimeout(resolve, ms));
}

export class MockDbConnection extends DbQuery implements DbConnection {
  closed = false;
  async close(): Promise<void> {
    if (this.closed) return;
    await wait(50);
    this.closed = true;
    return;
  }
  [Symbol.asyncDispose]() {
    return this.close();
  }
  query = vi.fn(async function (sql: QueryInput | MultipleQueryInput): Promise<any> {
    if (sql instanceof Array) {
      if (sql.includes("error sql")) throw new Error("error sql");
      const text = sql.map((): SingleQueryResult => ({ rowCount: 0, rows: [] }));
      await wait(10);
      return text;
    } else {
      const text = sql.toString();
      await wait(10);
      if (text === "error sql") throw new Error("error sql");
      return { rowCount: 0, rows: [] } satisfies QueryRowsResult;
    }
  });
  execute = vi.fn(async function (sql: SqlLike | SqlLike[]): Promise<any> {
    const text = sql.toString();
    await wait(10);
    if (text.endsWith("error sql")) throw new Error("error sql");
    return [
      { rowCount: 0, rows: [] },
      { rowCount: 0, rows: [] },
    ] satisfies MultipleQueryResult;
  });
  multipleQuery = vi.fn();
}
export class MockDbPoolConnection extends DbPoolConnection {
  constructor() {
    const onRelease = vi.fn(() => {});
    const mockConn = new MockDbConnection();
    super(mockConn, onRelease);
    this.onRelease = onRelease;
    this.mockConn = mockConn;
  }
  mockConn: MockDbConnection;
  onRelease: Mock<() => void>;
}
