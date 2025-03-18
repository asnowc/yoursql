import { DbQuery, DbConnection, DbPoolConnection } from "@asla/yoursql/client";
import { Mock, vi } from "vitest";

export class MockDbConnection extends DbQuery implements DbConnection {
  closed = false;
  async close(): Promise<void> {
    if (this.closed) return;
    this.closed = true;
    return;
  }
  [Symbol.asyncDispose]() {
    return this.close();
  }
  query = vi.fn(async function (sql: { toString(): string }) {
    const text = sql.toString();
    if (text === "error sql") throw new Error("error sql");
    return { rowCount: 0, rows: [] };
  });
  multipleQuery = vi.fn(async function (sql: { toString(): string }) {
    const text = sql.toString();
    if (text.endsWith("error sql")) throw new Error("error sql");
    return [
      { rowCount: 0, rows: [] },
      { rowCount: 0, rows: [] },
    ];
  });
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
