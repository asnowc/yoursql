import type { SqlStatementDataset } from "../sql_gen/mod.ts";
import { DbQuery } from "./DbQuery.ts";
import type { MultipleQueryResult, QueryRowsResult, SingleQueryResult } from "./DbQueryBase.ts";
import { ConnectionNotAvailableError, ParallelQueryError } from "./errors.ts";
import type { DbPoolConnection } from "./DbPoolConnection.ts";
import type { DbTransaction, SqlLike, TransactionMode } from "./interfaces.ts";

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
    this.#query = ((sql: SqlLike | SqlLike[], multiple?: boolean) => {
      return new Promise<SingleQueryResult[] | SingleQueryResult>((resolve, reject) => {
        this.#pending = connect()
          .then((conn) => {
            this.#conn = conn;
            const begin = "BEGIN" + (this.mode ? " TRANSACTION ISOLATION LEVEL " + this.mode : "");
            const promise = conn.multipleQuery(sql instanceof Array ? [begin, ...sql] : [begin, sql]);
            this.#pending = promise;
            this.#query = this.#queryAfter;
            return promise;
          })
          .then(
            (res) => {
              this.#pending = undefined;
              resolve(multiple ? res.slice(1) : res[1]);
            },
            (e) => {
              // 语法错误、查询错误、网络错误
              this.#pending = undefined;
              const conn = this.#conn;
              if (!conn) {
                reject(e);
                return;
              }
              const onFinally = () => {
                this.#release(conn, e);
                reject(e);
              };
              if (this.#errorRollback) {
                return conn.rollback().then(onFinally, onFinally);
              } else onFinally();
            }
          );
      });
    }) as FirstQuery;
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
  #queryAfter(sql: SqlLike): Promise<SingleQueryResult>;
  #queryAfter(sql: SqlLike | SqlLike[], multiple: true): Promise<SingleQueryResult[]>;
  #queryAfter(sql: SqlLike | SqlLike[], multiple?: boolean): Promise<SingleQueryResult[] | SingleQueryResult> {
    const conn = this.#conn!;
    const onFinish = <T>(res: T) => {
      this.#query = this.#queryAfter;
      this.#pending = undefined;
      return res;
    };
    const onError = (e: any) => {
      this.#pending = undefined;
      if (this.#errorRollback) {
        const onOk = () => {
          this.#release(conn, e);
          throw e;
        };
        return conn.rollback().then(onOk, onOk);
      } else {
        this.#release(conn, e);
        throw e;
      }
    };
    if (multiple) return conn.multipleQuery(sql).then(onFinish, onError);
    else return conn.query(sql as SqlLike).then(onFinish, onError);
  }
  #query: FirstQuery;
  override query<T extends object = any>(sql: SqlStatementDataset<T>): Promise<QueryRowsResult<T>>;
  override query<T extends object = any>(sql: SqlLike): Promise<QueryRowsResult<T>>;
  override query(sql: SqlLike): Promise<SingleQueryResult> {
    if (this.#pending) return Promise.reject(new ParallelQueryError());
    return this.#query(sql);
  }
  override multipleQuery<T extends MultipleQueryResult = MultipleQueryResult>(sql: SqlStatementDataset<T>): Promise<T>;
  override multipleQuery<T extends MultipleQueryResult = MultipleQueryResult>(sql: SqlLike | SqlLike[]): Promise<T>;
  override multipleQuery(sql: SqlLike | SqlLike[]): Promise<MultipleQueryResult> {
    if (this.#pending) return Promise.reject(new ParallelQueryError());
    return this.#query(sql, true);
  }
  #error: any;
  #release(conn: DbPoolConnection, error: any = new ConnectionNotAvailableError("Connection already release")) {
    this.#error = error;
    this.#query = (): Promise<never> => Promise.reject(this.#error);
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
interface FirstQuery {
  (sql: SqlLike): Promise<SingleQueryResult>;
  (sql: SqlLike | SqlLike[], multiple: true): Promise<SingleQueryResult[]>;
}
