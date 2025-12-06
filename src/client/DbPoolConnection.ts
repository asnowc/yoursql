import { DbQuery, MultipleQueryInput, QueryDataInput, QueryInput } from "./DbQuery.ts";
import { type QueryRowsResult, type DbQueryBase, MultipleQueryResult } from "./DbQueryBase.ts";
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

  override query<T extends MultipleQueryResult = MultipleQueryResult>(sql: MultipleQueryInput): Promise<T>;
  override query<T = any>(sql: QueryDataInput<T>): Promise<QueryRowsResult<T>>;
  override query<T = any>(sql: QueryInput): Promise<QueryRowsResult<T>>;
  override query(sql: QueryInput | MultipleQueryInput): Promise<any> {
    if (!this.#conn) return Promise.reject(new ConnectionNotAvailableError("Connection already release"));
    if (typeof sql === "function") sql = sql();
    return this.#conn.query(sql);
  }
  override execute(sql: QueryInput | MultipleQueryInput): Promise<void> {
    if (!this.#conn) return Promise.reject(new ConnectionNotAvailableError("Connection already release"));
    if (typeof sql === "function") sql = sql();
    return this.#conn.execute(sql);
  }
  /** @deprecated 不建议使用 */
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
