import { ConditionParam, Constructable, TableType } from "../util.ts";
import { ChainModifyReturning } from "./_modify.ts";

/** @public */
export interface ChainUpdate<T extends TableType = TableType> {
  set(value: Constructable<{ [key in keyof T]?: string } | string>): ChainUpdateAfterSet;
}

/** @public */
export interface ChainUpdateAfterSet extends ChainUpdateAfterForm {
  /**
   * @example
   * ```ts
   *
   * update({age: "3", name: "'hi'", count:"b.count"}, "a")
   *  .from("table1 AS b", "(SELECT k FROM table2) AS c")
   *  .where(...)
   * // UPDATE table AS a
   * // FROM table1 AS b, (SELECT k FROM table2) AS c
   * // SET a.age=3, a.name='hi', a.count=b.count
   * // WHERE ...
   * ```
   */
  from(...table: (Constructable<string> | { selectable: Constructable<string>; as: string })[]): ChainUpdateAfterForm;
}

/** @public */
export interface ChainUpdateAfterForm extends ChainUpdateReturning {
  where(where: Constructable<ConditionParam | void>): ChainUpdateReturning;
}

/** @public */
export interface ChainUpdateReturning extends ChainModifyReturning {}
