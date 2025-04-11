import type { SqlStatementDataset } from "../sql_gen/mod.ts";
import { DbQuery } from "./DbQuery.ts";
import type { MultipleQueryResult, QueryRowsResult } from "./DbQuery.ts";
import { ConnectionNotAvailableError } from "./errors.ts";
import type { DbConnection, StringLike, TransactionMode } from "./interfaces.ts";

/**

/**
 * 池连接
 * @public
 */
export class DbPoolConnection extends DbQuery {
  constructor(conn: DbConnection, onRelease: () => void) {
    super();
    this.#conn = conn;
    this.#onRelease = onRelease;
  }
  #onRelease: () => void;
  //implement
  async begin(mode?: TransactionMode): Promise<void> {
    await this.query("BEGIN" + (mode ? " TRANSACTION ISOLATION LEVEL " + mode : ""));
  }
  #conn?: DbConnection;

  override query<T = any>(sql: SqlStatementDataset<T>): Promise<QueryRowsResult<T>>;
  override query<T = any>(sql: StringLike): Promise<QueryRowsResult<T>>;
  override query(sql: StringLike): Promise<QueryRowsResult> {
    if (!this.#conn) return Promise.reject(new ConnectionNotAvailableError("Connection already release"));
    return this.#conn.query(sql);
  }
  override multipleQuery<T extends MultipleQueryResult = MultipleQueryResult>(sql: StringLike): Promise<T> {
    if (!this.#conn) return Promise.reject(new ConnectionNotAvailableError("Connection already release"));
    return this.#conn.multipleQuery(sql);
  }
  //implement
  async rollback() {
    await this.query("ROLLBACK");
  }
  //implement
  async commit() {
    await this.query("COMMIT");
  }
  get released(): boolean {
    return !this.#conn;
  }
  /** 调用 release() 时，如果事务未提交，则抛出异常 */
  release() {
    if (this.#conn) {
      this.#conn = undefined;
      this.#onRelease();
    }
  }
  //implement
  [Symbol.dispose](): void {
    return this.release();
  }
}
