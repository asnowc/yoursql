import type { SqlStatementDataset } from "../sql_gen/mod.ts";
import { DbQuery } from "./DbQuery.ts";
import type { MultipleQueryResult, QueryRowsResult } from "./DbQuery.ts";
import { ConnectionNotAvailableError, ParallelQueryError } from "./errors.ts";
import type { DbPoolConnection } from "./DbPoolConnection.ts";
import type { DbTransaction, TransactionMode } from "./interfaces.ts";

/** @public */
export type DbPoolTransactionOption = {
  errorRollback?: boolean;
  mode?: TransactionMode;
};
/**
 * @public
 * 池连接事务
 */
export class DbPoolTransaction extends DbQuery implements DbTransaction {
  #errorRollback?: boolean;
  readonly mode?: TransactionMode;
  constructor(connect: () => Promise<DbPoolConnection>, option?: TransactionMode | DbPoolTransactionOption) {
    super();
    if (option) {
      if (typeof option === "string") this.mode = option;
      else {
        this.mode = option.mode;
        this.#errorRollback = option.errorRollback;
      }
    }
    this.#query = (sql: { toString(): string }) => {
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
              // 语法错误、查询错误、网络错误
              this.#pending = undefined;
              reject(e);
              const conn = this.#conn;
              if (conn) {
                this.#release(conn, e);
                if (this.#errorRollback) {
                  return conn.rollback().catch((e) => {});
                }
              }
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
  #queryAfter(sql: { toString(): string }) {
    const conn = this.#conn!;
    return conn.query(sql).then(
      (res) => {
        this.#pending = undefined;
        return res;
      },
      (e) => {
        this.#pending = undefined;
        this.#release(conn, e);
        if (this.#errorRollback) {
          return conn.rollback().then(
            () => {
              throw e;
            },
            () => {
              throw e;
            }
          );
        }
        throw e;
      }
    );
  }
  #query: (sql: { toString(): string }) => Promise<QueryRowsResult<any>>;
  override query<T extends object = any>(sql: SqlStatementDataset<T>): Promise<QueryRowsResult<T>>;
  override query<T extends object = any>(sql: { toString(): string }): Promise<QueryRowsResult<T>>;
  override query(sql: { toString(): string }): Promise<QueryRowsResult<any>> {
    if (this.#pending) return Promise.reject(new ParallelQueryError());
    return this.#query(sql);
  }
  override multipleQuery<T extends MultipleQueryResult = MultipleQueryResult>(sql: SqlStatementDataset<T>): Promise<T>;
  override multipleQuery<T extends MultipleQueryResult = MultipleQueryResult>(sql: { toString(): string }): Promise<T>;
  override multipleQuery(sql: { toString(): string }): Promise<MultipleQueryResult> {
    if (this.#pending) return Promise.reject(new ParallelQueryError());
    return this.#query(sql) as any;
  }
  #error: any;
  #release(conn: DbPoolConnection, error: any = new ConnectionNotAvailableError("Connection already release")) {
    this.#error = error;
    this.#query = () => Promise.reject(this.#error);
    this.#conn = undefined;
    conn.release();
  }
  get released(): boolean {
    return !!this.#error;
  }
  [Symbol.asyncDispose](): Promise<void> {
    return this.rollback();
  }
}
