import type { SqlStatementDataset } from "../sql_gen/mod.ts";
import { DbQuery } from "./DbQuery.ts";
import type { MultipleQueryResult, QueryRowsResult } from "./DbQuery.ts";
import { ConnectionNotAvailableError, ParallelQueryError } from "./errors.ts";
import type { DbPoolConnection } from "./DbPoolConnection.ts";
import type { DbTransaction, TransactionMode } from "./interfaces.ts";

/**
 * @public
 * 池连接事务
 */
export class DbPoolTransaction extends DbQuery implements DbTransaction {
  constructor(connect: () => Promise<DbPoolConnection>, readonly mode?: TransactionMode) {
    super();
    this.#query = (sql: string) => {
      return new Promise<QueryRowsResult<any>>((resolve, reject) => {
        this.#pending = connect()
          .then((conn) => {
            this.#conn = conn;
            const promise = conn.multipleQuery<[QueryRowsResult, QueryRowsResult]>(
              "BEGIN" + (this.mode ? " TRANSACTION ISOLATION LEVEL " + this.mode : "") + ";\n" + sql
            );
            this.#pending = promise;
            this.#query = this.#queryAfter;
            return promise;
          })
          .then(
            (res) => {
              this.#pending = undefined;
              resolve(res[1]);
            },
            (e) => {
              this.#pending = undefined;
              reject(e);
              if (this.#conn) this.#release(this.#conn, e);
            }
          );
      });
    };
  }
  #pending?: Promise<unknown>;
  #conn?: DbPoolConnection;
  async commit(): Promise<void> {
    if (this.#pending) throw new ParallelQueryError();
    if (this.#conn) {
      const promise = this.#conn.query("COMMIT");
      this.#release(this.#conn);
      await promise;
    }
  }
  async rollback(): Promise<void> {
    if (this.#pending) throw new ParallelQueryError();
    if (this.#conn) {
      const promise = this.#conn.query("ROLLBACK");
      this.#release(this.#conn);
      await promise;
    }
  }
  savePoint(savePoint: string): Promise<void> {
    return this.query("SAVEPOINT" + savePoint).then(() => {});
  }
  rollbackTo(savePoint: string): Promise<void> {
    return this.query("ROLLBACK TO " + savePoint).then(() => {});
  }

  /** 拿到连接后执行这个 */
  #queryAfter(sql: string) {
    return this.#conn!.query(sql).then(
      (res) => {
        this.#pending = undefined;
        return res;
      },
      (e) => {
        this.#pending = undefined;
        this.#release(this.#conn!, e);
        throw e;
      }
    );
  }
  #query: (sql: string) => Promise<QueryRowsResult<any>>;
  override query<T extends object = any>(sql: SqlStatementDataset<T>): Promise<QueryRowsResult<T>>;
  override query<T extends object = any>(sql: { toString(): string }): Promise<QueryRowsResult<T>>;
  override query(sql: { toString(): string }): Promise<QueryRowsResult<any>> {
    if (this.#pending) return Promise.reject(new ParallelQueryError());
    return this.#query(sql.toString());
  }
  override multipleQuery<T extends MultipleQueryResult = MultipleQueryResult>(sql: SqlStatementDataset<T>): Promise<T>;
  override multipleQuery<T extends MultipleQueryResult = MultipleQueryResult>(sql: { toString(): string }): Promise<T>;
  override multipleQuery(sql: { toString(): string }): Promise<MultipleQueryResult> {
    if (this.#pending) return Promise.reject(new ParallelQueryError());
    return this.#query(sql.toString()) as any;
  }
  #error: any;
  #release(conn: DbPoolConnection, error: any = new ConnectionNotAvailableError("Connection already release")) {
    this.#error = error;
    this.#query = () => Promise.reject(this.#error);
    this.#conn = undefined;
    conn.release();
  }
  get released() {
    return !!this.#error;
  }
  [Symbol.asyncDispose]() {
    return this.rollback();
  }
}
