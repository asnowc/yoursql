import { ConditionParam, Constructable, SelectParam } from "../util.ts";
import { TableType } from "./type.ts";
import { SqlStatement, SqlStatementDataset } from "./chain_base.ts";

/** @public */
export interface ChainModifyReturning<T extends TableType = {}> extends SqlStatement {
  returning(columns: "*"): SqlStatementDataset<T>;
  returning(columns: Constructable<SelectParam>): SqlStatementDataset<Record<string, any>>;
  returning<R extends TableType>(columns: Constructable<SelectParam>): SqlStatementDataset<R>;
}

/** @public */
export interface ChainAfterConflictDo<T extends TableType = {}> {
  doNotThing(): ChainModifyReturning<T>;
  /**
   * 需要注意 SQL 注入
   */
  doUpdate(set: Constructable<string | { [key in keyof T]?: string }>): ChainModifyReturning<T>;
  toString(): string;
}

/** @public */
export interface ChainInsert<T extends TableType = {}> extends ChainModifyReturning<T> {
  onConflict(option: Constructable<readonly (keyof T)[] | string>): ChainAfterConflictDo<T>;
}
/** @public */
export interface ChainUpdate<T extends TableType = {}> extends ChainModifyReturning<T> {
  where(where: Constructable<ConditionParam | void>): ChainModifyReturning<T>;
}
/** @public */
export interface ChainDelete<T extends TableType = {}> extends ChainModifyReturning<T> {
  where(where: Constructable<ConditionParam | void>): ChainModifyReturning<T>;
}
