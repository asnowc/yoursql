import { SqlTemplate } from "./_type.ts";
import { SqlLike } from "./interfaces.ts";
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

/**
 *
 * @deprecated 已废弃
 * @public
 */
export type QueryResult = MultipleQueryResult | SingleQueryResult;

/**
 * 数据库客户端的最小实现接口
 * @public
 */
export interface DbQueryBase {
  /** 单语句查询，不应查询多语句，否则返回错误值  */
  query<T = any>(sql: SqlLike): Promise<QueryRowsResult<T>>;
  /** 多语句查询 */
  multipleQuery<T extends MultipleQueryResult = MultipleQueryResult>(sql: SqlLike | SqlLike[]): Promise<T>;
}
/**
 * 将 SqlLike 转换为字符串
 * @public
 *
 */
export function sqlLikeToString(sqlLike: SqlLike): string {
  if (typeof sqlLike === "string") {
    return sqlLike;
  } else {
    if (isSqlTemplate(sqlLike)) {
      const { templates } = sqlLike;
      const textArgs = sqlLike.toTextArgs();
      let sql = templates[0];
      for (let i = 1; i < templates.length; i++) {
        sql += textArgs[i - 1] + templates[i];
      }
      return sql;
    } else {
      return sqlLike.genSql();
    }
  }
}
/** @public */
export function isSqlTemplate(obj: any): obj is SqlTemplate {
  if (typeof obj !== "object" || obj === null) return false;
  return Array.isArray(obj.templates) && Array.isArray(obj.args) && typeof obj.toTextArgs === "function";
}
