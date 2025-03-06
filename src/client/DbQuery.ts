import type { SqlStatementDataset } from "../sql_gen/mod.ts";
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

/**
 * SQL 查询相关操作
 * @public
 */
export abstract class DbQuery {
  /** 单语句查询，不应查询条语句，否则返回错误值  */
  abstract query<T = any>(sql: SqlStatementDataset<T>): Promise<QueryRowsResult<T>>;
  /** 单语句查询，不应查询条语句，否则返回错误值  */
  abstract query<T = any>(sql: { toString(): string }): Promise<QueryRowsResult<T>>;
  /** 多语句查询  */
  abstract multipleQuery<T extends MultipleQueryResult = MultipleQueryResult>(sql: SqlStatementDataset<T>): Promise<T>;
  /** 多语句查询 */
  abstract multipleQuery<T extends MultipleQueryResult = MultipleQueryResult>(sql: { toString(): string }): Promise<T>;
  /** 单语句查询受影响的行 */
  queryCount(sql: string | { toString(): string }): Promise<number> {
    return this.query(sql.toString()).then((res) => {
      if (res.rowCount === null) return 0;
      return res.rowCount;
    });
  }
  /** 单语句查询，不应查询条语句，否则返回错误值  */
  queryRows<T = any>(sql: SqlStatementDataset<T>): Promise<T[]>;

  /** 单语句查询，不应查询条语句，否则返回错误值  */
  queryRows<T = any>(sql: { toString(): string }): Promise<T[]>;
  queryRows<T = any>(sql: SqlStatementDataset<T> | string | { toString(): string }): Promise<T[]> {
    return this.query<T>(sql.toString()).then((res) => res.rows);
  }
  /**
   * 查询行
   * 不应查询单条语句，否则返回错误值
   */
  multipleQueryRows<T extends any[] = any[]>(sql: SqlStatementDataset<T>): Promise<T[]>;
  /**
   * 查询行
   * 不应查询条语句，否则返回错误值
   */
  multipleQueryRows<T extends any[] = any[]>(sql: { toString(): string }): Promise<T[]>;
  multipleQueryRows<T extends any[] = any[]>(
    sql: SqlStatementDataset<T> | string | { toString(): string }
  ): Promise<T[]> {
    return this.multipleQuery(sql.toString()).then((res) => res.map((item) => item.rows ?? [])) as Promise<T[]>;
  }
  /**
   * 指定某一列为key，返回 key 到 row 的映射
   * 单语句查询，不应查询条语句，否则返回错误值
   */
  queryMap<T extends Record<string, any> = Record<string, any>, K extends keyof T = string>(
    sql: SqlStatementDataset<T>,
    key: K
  ): Promise<Map<T[K], T>>;
  /**
   * 指定某一列为key，返回 key 到 row 的映射
   * 单语句查询，不应查询条语句，否则返回错误值
   */
  queryMap<T extends Record<string, any> = Record<string, any>, K extends keyof T = string>(
    sql: { toString(): string },
    key: K
  ): Promise<Map<T[K], T>>;
  async queryMap(sql: { toString(): string }, key: string): Promise<Map<any, any>> {
    const { rows } = await this.query(sql.toString());
    let map = new Map();
    for (let i = 0; i < rows.length; i++) {
      map.set(rows[i][key], rows[i]);
    }
    return map;
  }
}
