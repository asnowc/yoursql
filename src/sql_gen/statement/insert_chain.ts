import { Constructable } from "../util.ts";
import { ChainModifyReturning } from "./_modify.ts";

/** @public */
export interface InsertIntoSqlGenerator {
  (target: string): ChainInsert;
  (table: string, columns: readonly string[]): ChainInsert;
}

/** @public */
export interface ChainAfterConflict {
  doNotThing(): ChainInsertReturning;
  /**
   * @example
   * ```ts
   *  doUpdate("SET level= 89,name= 11") // " DO UPDATE SET level= 89,name= 11"
   *  doUpdate(["level= 89", "name= 11"]) // " DO UPDATE SET\nlevel= 89,name= 11"
   *  doUpdate({level: "89", name: "11"}) // " DO UPDATE SET\nlevel= 89,name= 11"
   * ```
   */
  doUpdate(set: Constructable<string | readonly string[] | Record<string, string>>): ChainInsertReturning;
  toString(): string;
}

/** @public */
export interface ChainInsert extends ChainInsertAfterValues {
  /**
   * @example
   * ```ts
   *  values("(18, 'hi'), (17, 'hh')") // " VALUES(18, 'hi'), (17, 'hh')"
   *  values(["(18, 'hi')", "(17, 'hh')"]) // " VALUES(18, 'hi'), (17, 'hh')"
   * ```
   */
  values(statement: Constructable<string | readonly string[]>): ChainInsertAfterValues;
  select(statement: Constructable<string>): ChainInsertAfterValues;
}
/** @public */
export interface ChainInsertAfterValues extends ChainInsertReturning {
  onConflict(columns: string | string[]): ChainAfterConflict;
}

/** @public */
export interface ChainInsertReturning extends ChainModifyReturning {}
