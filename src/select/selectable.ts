import { TableType } from "./type.ts";

declare const SQL_SELECTABLE: unique symbol;

/** @public */
export abstract class SqlSelectable<T extends TableType> {
  abstract readonly columns: Iterable<string>;
  /** select from xxx 中的 xxx */
  abstract toSelect(): string;
  abstract toString(): string;
  /** 保留以推断类型 */
  declare [SQL_SELECTABLE]: T;
}
/** @public */
export class DbTable<T extends TableType> extends SqlSelectable<T> {
  readonly columns: readonly string[];
  constructor(readonly name: string, columns: readonly (keyof T)[]) {
    super();
    if (columns instanceof Array) this.columns = [...columns] as string[];
    else this.columns = Object.keys(columns);
  }
  toSelect(): string {
    return this.name;
  }
  toString(): string {
    return this.name;
  }
}

/**
 * SELECT、UPDATE、DELETE、INSERT INTO 带结果的返回值
 * @public
 */
export class SqlQueryStatement<T extends TableType = TableType> extends SqlSelectable<T> {
  readonly columns: readonly string[];
  constructor(private sql: string, columns: readonly string[]) {
    super();
    this.columns = columns as any[];
  }
  toString(): string {
    return this.sql;
  }
  toSelect(): string {
    return "(" + this.toString() + ")";
  }
}
/**
 * 推断查询结果的类型
 * @public
 */
export type InferQueryResult<T> = T extends SqlSelectable<infer P> ? (P extends TableType ? P : never) : never;
