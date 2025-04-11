import type { SqlStatementDataset } from "../sql_gen/mod.ts";
import { StringLike } from "./interfaces.ts";
import { MultipleQueryResult, DbQueryBase, QueryRowsResult } from "./DbQueryBase.ts";

/**
 * SQL 查询相关操作
 * @public
 */
export abstract class DbQuery implements DbQueryBase {
  abstract query<T = any>(sql: StringLike): Promise<QueryRowsResult<T>>;
  abstract multipleQuery<T extends MultipleQueryResult = MultipleQueryResult>(sql: StringLike): Promise<T>;
  /** 单语句查询受影响的行 */
  queryCount(sql: string | StringLike): Promise<number> {
    return this.query(sql.toString()).then((res) => {
      if (res.rowCount === null) return 0;
      return res.rowCount;
    });
  }
  /** 单语句查询，不应查询多语句，否则返回错误值  */
  queryRows<T = any>(sql: SqlStatementDataset<T>): Promise<T[]>;

  /** 单语句查询，不应查询多语句，否则返回错误值  */
  queryRows<T = any>(sql: StringLike): Promise<T[]>;
  queryRows<T = any>(sql: SqlStatementDataset<T> | string | StringLike): Promise<T[]> {
    return this.query<T>(sql.toString()).then((res) => res.rows);
  }
  /** 单语句查询，只返回第一行。如果查询没有返回行，则抛出异常。 */
  queryFirstRow<T = any>(sql: SqlStatementDataset<T>): Promise<T>;
  queryFirstRow<T = any>(sql: StringLike): Promise<T>;
  queryFirstRow<T = any>(sql: SqlStatementDataset<T> | string | StringLike): Promise<T> {
    return this.query<T>(sql.toString()).then(({ rows, rowCount }) => {
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
  multipleQueryRows<T extends any[] = any[]>(sql: StringLike): Promise<T[]>;
  multipleQueryRows<T extends any[] = any[]>(sql: SqlStatementDataset<T> | string | StringLike): Promise<T[]> {
    return this.multipleQuery(sql.toString()).then((res) => res.map((item) => item.rows ?? [])) as Promise<T[]>;
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
    sql: StringLike,
    key: K
  ): Promise<Map<T[K], T>>;
  async queryMap(sql: StringLike, key: string): Promise<Map<any, any>> {
    const { rows } = await this.query(sql.toString());
    let map = new Map();
    for (let i = 0; i < rows.length; i++) {
      map.set(rows[i][key], rows[i]);
    }
    return map;
  }
}
