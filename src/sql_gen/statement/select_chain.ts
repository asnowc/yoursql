import { ConditionParam, Constructable, TableType } from "../util.ts";
import { SqlSelectable, SqlStatementDataset } from "../SqlStatement.ts";
/** @public */
export interface SelectSqlGenerator {
  (columns?: undefined | ""): ChainSelect<{}>;
  <T extends TableType>(columns: "*"): ChainSelect<T>;
  <T extends TableType>(columns: Constructable<{ [key in keyof T]: string | boolean }>): ChainSelect<T>;
  <T extends TableType>(columns: Constructable<string | string[]>): ChainSelect<T>;
  <T extends TableType>(
    columns: Constructable<string | readonly string[] | { readonly [key in keyof T]: string | boolean }>,
  ): ChainSelect<T>;
}

/** @public */
export type SelectAsNameOption = { as?: string };

/** @public */
export interface ChainSelect<T extends TableType> {
  /**
   * @example
   * ```ts
   * from("table1", {as:"t1"}).from("table2 AS t2") // SELECT ... FROM table1 AS t1 FROM table2 AS t2
   * ```
   */
  from(selectable: Constructable<SqlSelectable | string>, option?: SelectAsNameOption): ChainSelectAfterFirstFrom<T>;
}
/** @public */
export interface ChainSelectAfterFirstFrom<T extends TableType> extends ChainSelectAfterFrom<T> {
  from(selectable: Constructable<SqlSelectable | string>, option?: SelectAsNameOption): ChainSelectAfterFirstFrom<T>;
}

/** @public */
export type SelectJoinOption = SelectAsNameOption & {
  on?: Constructable<ConditionParam>;
};

/** @public */
export interface ChainSelectAfterFrom<T extends TableType> extends ChainSelectAfterJoin<T> {
  innerJoin(selectable: Constructable<SqlSelectable | string>, options?: SelectJoinOption): ChainSelectAfterFrom<T>;
  leftJoin(selectable: Constructable<SqlSelectable | string>, options?: SelectJoinOption): ChainSelectAfterFrom<T>;
  rightJoin(selectable: Constructable<SqlSelectable | string>, options?: SelectJoinOption): ChainSelectAfterFrom<T>;
  fullJoin(selectable: Constructable<SqlSelectable | string>, options?: SelectJoinOption): ChainSelectAfterFrom<T>;

  naturalJoin(selectable: Constructable<SqlSelectable | string>, options?: SelectAsNameOption): ChainSelectAfterFrom<T>;
  crossJoin(selectable: Constructable<SqlSelectable | string>, options?: SelectAsNameOption): ChainSelectAfterFrom<T>;
}

/** @public */
export interface ChainSelectAfterJoin<T extends TableType> extends ChainSelectAfterWhere<T> {
  /**
   * @example
   * ```ts
   * where(undefined) // SELECT ... FROM table1
   * where([]) // SELECT ... FROM table1
   * where("age > 18") // SELECT ... FROM table1 WHERE age > 18
   * where(["age > 18", "name = 'Alice'"]) // SELECT ... FROM table1 WHERE age > 18 AND name = 'Alice'
   * ```
   */
  where(param: Constructable<ConditionParam | void>): ChainSelectAfterWhere<T>;
}

/** @public */
export interface ChainSelectAfterWhere<T extends TableType> extends ChainSelectAfterHaving<T> {
  /**
   * @example
   * ```ts
   * groupBy("age") // SELECT ... FROM table1 GROUP BY age
   * groupBy(["age", "name"]) // SELECT ... FROM table1 GROUP BY age, name
   * ```
   */
  groupBy(columns?: string | string[]): ChainSelectAfterGroupBy<T>;
}
/** @public */
export interface ChainSelectAfterGroupBy<T extends TableType> extends ChainSelectAfterHaving<T> {
  having(param: Constructable<ConditionParam | void>): ChainSelectAfterHaving<T>;
}
/** @public */
export interface ChainSelectAfterHaving<T extends TableType> extends ChainSelectAfterOrderBy<T> {
  /**
   * @example
   * ```ts
   * orderBy([]) // ""
   * orderBy({}) // ""
   * orderBy() // ""
   * orderBy("age") // ORDER BY age
   * orderBy(["age DESC", "name ASC NULLS LAST"]) // ORDER BY age DESC, name ASC NULLS LAST
   * orderBy({key:"age", target:"DESC NULLS LAST"}) // ORDER BY age DESC NULLS LAST
   * orderBy([{ key: "age", asc: false, nullLast: true }, { key: "name", asc: true }])
   * // ORDER BY age DESC NULLS LAST, name ASC
   * ```
   */
  orderBy(param: Constructable<OrderByParam | void>): ChainSelectAfterOrderBy<T>;
}
/** @public */
export interface ChainSelectAfterOrderBy<T extends TableType> extends SqlStatementDataset<T> {
  limit(limit?: number | bigint, offset?: number | bigint): ChainSelectAfterLimit<T>;
}

/** @public */
export interface ChainSelectAfterLimit<T extends TableType> extends SqlStatementDataset<T> {}

/** @public */
export type OrderValue = "ASC" | "DESC";

type OrderByValue = `${OrderValue} NULLS ${"FIRST" | "LAST"}` | OrderValue;
/** @public */
export type OrderBehavior =
  | { key: string; asc: boolean; nullLast?: boolean; target?: undefined }
  | { key: string; target: OrderByValue };
/** @public */
export type OrderByParam = string | OrderBehavior | (string | OrderBehavior)[];
