import type { SqlStatementDataset } from "../sql_gen/mod.ts";
import { SqlLike } from "./interfaces.ts";
import { MultipleQueryResult, DbQueryBase, QueryRowsResult } from "./DbQueryBase.ts";

/**
 * SQL 查询相关操作
 * @public
 */
export abstract class DbQuery implements DbQueryBase {
  abstract query<T = any>(sql: SqlLike): Promise<QueryRowsResult<T>>;
  abstract multipleQuery<T extends MultipleQueryResult = MultipleQueryResult>(sql: SqlLike | SqlLike[]): Promise<T>;
  /** 单语句查询受影响的行 */
  queryCount(sql: SqlLike): Promise<number> {
    return this.query(sql).then((res) => {
      if (res.rowCount === null) return 0;
      return res.rowCount;
    });
  }
  /** 单语句查询，不应查询多语句，否则返回错误值  */
  queryRows<T = any>(sql: SqlStatementDataset<T>): Promise<T[]>;

  /** 单语句查询，不应查询多语句，否则返回错误值  */
  queryRows<T = any>(sql: SqlLike): Promise<T[]>;
  queryRows<T = any>(sql: SqlStatementDataset<T> | SqlLike): Promise<T[]> {
    return this.query<T>(sql).then((res) => res.rows);
  }
  /** 单语句查询，只返回第一行。如果查询没有返回行，则抛出异常。 */
  queryFirstRow<T = any>(sql: SqlStatementDataset<T>): Promise<T>;
  queryFirstRow<T = any>(sql: SqlLike): Promise<T>;
  queryFirstRow<T = any>(sql: SqlStatementDataset<T> | SqlLike): Promise<T> {
    return this.query<T>(sql).then(({ rows, rowCount }) => {
      if (rows.length === 0) throw new Error("Query did not return any rows");
      return rows[0];
    });
  }
  /**
   * 查询行
   * 不应查询单条语句，否则返回错误值
   */
  multipleQueryRows<T extends any[] = any[]>(sql: SqlStatementDataset<T>): Promise<T[]>;
  /**
   * 查询行
   * 不应查询单语句，否则返回错误值
   */
  multipleQueryRows<T extends any[] = any[]>(sql: SqlLike): Promise<T[]>;
  multipleQueryRows<T extends any[] = any[]>(sql: SqlStatementDataset<T> | SqlLike): Promise<T[]> {
    return this.multipleQuery(sql).then((res) => res.map((item) => item.rows ?? [])) as Promise<T[]>;
  }
  /**
   * 指定某一列为key，返回 key 到 row 的映射
   * 单语句查询，不应查询多语句，否则返回错误值
   */
  queryMap<T extends Record<string, any> = Record<string, any>, K extends keyof T = string>(
    sql: SqlStatementDataset<T>,
    key: K
  ): Promise<Map<T[K], T>>;
  /**
   * 指定某一列为key，返回 key 到 row 的映射
   * 单语句查询，不应查询多语句，否则返回错误值
   */
  queryMap<T extends Record<string, any> = Record<string, any>, K extends keyof T = string>(
    sql: SqlLike,
    key: K
  ): Promise<Map<T[K], T>>;
  async queryMap(sql: SqlLike, key: string): Promise<Map<any, any>> {
    const { rows } = await this.query(sql);
    let map = new Map();
    for (let i = 0; i < rows.length; i++) {
      map.set(rows[i][key], rows[i]);
    }
    return map;
  }
}
