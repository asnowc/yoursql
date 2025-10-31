import { ConditionParam, Constructable, OrderByParam, TableType } from "../util.ts";
import { SqlSelectable, SqlStatementDataset } from "../SqlStatement.ts";

/** @public */
export type SelectFromOption = { as?: string };
/** @public */
export interface ChainSelect<T extends TableType> {
  from(selectable: Constructable<SqlSelectable | string>): ChainSelectAfterFirstFrom<T>;
}
/** @public */
export interface ChainSelectAfterFirstFrom<T extends TableType> extends ChainSelectAfterFrom<T> {
  from(selectable: Constructable<SqlSelectable | string>): ChainSelectAfterFrom<T>;
}

/** @public */
export type SelectJoinOption = {
  on?: Constructable<ConditionParam>;
};

/** @public */
export interface ChainSelectAfterFrom<T extends TableType> extends ChainSelectAfterJoin<T> {
  innerJoin(selectable: Constructable<SqlSelectable | string>, options?: SelectJoinOption): ChainSelectAfterFrom<T>;
  leftJoin(selectable: Constructable<SqlSelectable | string>, options?: SelectJoinOption): ChainSelectAfterFrom<T>;
  rightJoin(selectable: Constructable<SqlSelectable | string>, options?: SelectJoinOption): ChainSelectAfterFrom<T>;
  fullJoin(selectable: Constructable<SqlSelectable | string>, options?: SelectJoinOption): ChainSelectAfterFrom<T>;

  naturalJoin(selectable: Constructable<SqlSelectable | string>): ChainSelectAfterFrom<T>;
  crossJoin(selectable: Constructable<SqlSelectable | string>): ChainSelectAfterFrom<T>;
}

/** @public */
export interface ChainSelectAfterJoin<T extends TableType> extends ChainSelectAfterWhere<T> {
  where(param: Constructable<ConditionParam | void>): ChainSelectAfterWhere<T>;
}

/** @public */
export interface ChainSelectAfterWhere<T extends TableType> extends ChainSelectAfterHaving<T> {
  groupBy(columns: string | string[]): ChainSelectAfterGroupBy<T>;
}
/** @public */
export interface ChainSelectAfterGroupBy<T extends TableType> extends ChainSelectAfterHaving<T> {
  orderBy(param: Constructable<OrderByParam | void>): ChainSelectAfterOrderBy<T>;
  having(param: Constructable<ConditionParam | void>): ChainSelectAfterHaving<T>;
}
/** @public */
export interface ChainSelectAfterHaving<T extends TableType> extends ChainSelectAfterOrderBy<T> {
  orderBy(param: Constructable<OrderByParam | void>): ChainSelectAfterOrderBy<T>;
}
/** @public */
export interface ChainSelectAfterOrderBy<T extends TableType> extends SqlStatementDataset<T> {
  limit(limit?: number | bigint, offset?: number | bigint): ChainSelectAfterLimit<T>;
}

/** @public */
export interface ChainSelectAfterLimit<T extends TableType> extends SqlStatementDataset<T> {}
