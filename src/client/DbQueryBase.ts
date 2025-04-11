import type { SqlStatementDataset } from "../sql_gen/mod.ts";
import { StringLike } from "./interfaces.ts";
/** @public */
export interface SingleQueryResult {
  rowCount: number;
  rows?: any[];
}
/** @public */
export interface QueryRowsResult<T = any> extends SingleQueryResult {
  rowCount: number;
  rows: T[];
}
/** @public */
export type MultipleQueryResult = SingleQueryResult[];

/** @public */
export type QueryResult = MultipleQueryResult | SingleQueryResult;

/** @public */
export interface DbQueryBase {
  /** 单语句查询，不应查询多语句，否则返回错误值  */
  query<T = any>(sql: SqlStatementDataset<T>): Promise<QueryRowsResult<T>>;
  /** 单语句查询，不应查询多语句，否则返回错误值  */
  query<T = any>(sql: StringLike): Promise<QueryRowsResult<T>>;
  /** 多语句查询 */
  multipleQuery<T extends MultipleQueryResult = MultipleQueryResult>(sql: StringLike): Promise<T>;
}
