import { Constructable, TableType } from "../util.ts";
import { ChainModifyReturning } from "./_modify.ts";

/** @public */
export interface ChainAfterConflict<T extends TableType = {}> {
  doNotThing(): ChainInsertReturning<T>;
  /**
   * 需要注意 SQL 注入
   */
  doUpdate(set: Constructable<string | { [key in keyof T]?: string }>): ChainInsertReturning<T>;
  toString(): string;
}

/** @public */
export interface ChainInsert<T extends TableType = {}> extends ChainInsertReturning<T> {
  onConflict(option: Constructable<readonly (keyof T)[] | string>): ChainAfterConflict<T>;
}

/** @public */
export interface ChainInsertReturning<T extends TableType = {}> extends ChainModifyReturning<T> {}
