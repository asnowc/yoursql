import { SqlStatementDataset } from "./_type.ts";
import { DbQuery } from "./DbQuery.ts";
import type { MultipleQueryResult, QueryRowsResult, DbQueryBase } from "./DbQueryBase.ts";
import { ConnectionNotAvailableError } from "./errors.ts";
import type { SqlLike, TransactionMode } from "./interfaces.ts";

/**

/**
 * 池连接
 * @public
 */
export class DbPoolConnection extends DbQuery {
  constructor(conn: DbQueryBase, onRelease: (conn: DbQueryBase) => void) {
    super();
    this.#conn = conn;
    this.#onRelease = onRelease;
  }
  #onRelease: (conn: DbQueryBase) => void;
  //implement
  async begin(mode?: TransactionMode): Promise<void> {
    await this.query("BEGIN" + (mode ? " TRANSACTION ISOLATION LEVEL " + mode : ""));
  }
  #conn?: DbQueryBase;

  override query<T = any>(sql: SqlStatementDataset<T>): Promise<QueryRowsResult<T>>;
  override query<T = any>(sql: SqlLike): Promise<QueryRowsResult<T>>;
  override query(sql: SqlLike): Promise<QueryRowsResult> {
    if (!this.#conn) return Promise.reject(new ConnectionNotAvailableError("Connection already release"));
    return this.#conn.query(sql);
  }
  override multipleQuery<T extends MultipleQueryResult = MultipleQueryResult>(sql: SqlLike | SqlLike[]): Promise<T> {
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
    const conn = this.#conn;
    if (conn) {
      this.#conn = undefined;
      this.#onRelease(conn);
    }
  }
  //implement
  [Symbol.dispose](): void {
    return this.release();
  }
}
