import { ConditionParam, Constructable, OrderByParam } from "../util.ts";
import { SqlStatementDataset } from "./chain_base.ts";
import { TableType } from "./type.ts";

/** @public */
export interface ChainSelect<T extends TableType> extends ChainSelectAfterWhere<T> {
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
