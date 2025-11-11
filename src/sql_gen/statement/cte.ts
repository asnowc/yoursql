import { Constructable, selectColumns, SelectParam } from "../util.ts";
import { SelectSqlGenerator } from "./select_chain.ts";
import { UpdateSqlGenerator } from "./update_chain.ts";
import { DeleteFromSqlGenerator } from "./delete_chain.ts";
import { InsertIntoSqlGenerator } from "./insert_chain.ts";
import { SelectChainAfterSelect } from "./select_impl.ts";
import { DeleteChain } from "./delete_impl.ts";
import { UpdateChain } from "./update_impl.ts";
import { InsertChain } from "./insert_impl.ts";
/**
 * @public
 */
export interface ChainCTE {
  as(statement: Constructable<string>): ChainCTE;
  as(name: string, statement: Constructable<string>): ChainCTE;
  select: SelectSqlGenerator;
  update: UpdateSqlGenerator;
  deleteFrom: DeleteFromSqlGenerator;
  insertInto: InsertIntoSqlGenerator;
  toString(): string;
}

/**
 * @public
 * @example
 * ```ts
 *
 * //WITH cte1 AS(SELECT * FROM table1)
 *
 * withAs("cte1","SELECT * FROM table1")
 * withAs("cte1",() => "SELECT * FROM table1")
 *
 * withAs(() => "cte1 AS(SELECT * FROM table1)")
 * withAs("cte1 AS(SELECT * FROM table1)")
 * ```
 */
export function withAs(statement: Constructable<string>): ChainCTE;
/** @public */
export function withAs(name: string, statement: Constructable<string>): ChainCTE;
export function withAs(nameOrStatement: Constructable<string>, statement?: Constructable<string>): ChainCTE {
  return new ChainCETImpl(`WITH \n${concat(nameOrStatement, statement)}`);
}

/**
 * @public
 * @example
 * ```ts
 *
 * //WITH RECURSIVE cte1 AS(SELECT * FROM table1)
 *
 * withRecursiveAs("cte1","SELECT * FROM table1")
 * withRecursiveAs("cte1",() => "SELECT * FROM table1")
 *
 * withRecursiveAs(() => "cte1 AS(SELECT * FROM table1)")
 * withRecursiveAs("cte1 AS(SELECT * FROM table1)")
 * ```
 */
export function withRecursiveAs(statement: Constructable<string>): ChainCTE;
/** @public */
export function withRecursiveAs(name: string, statement: Constructable<string>): ChainCTE;
export function withRecursiveAs(nameOrStatement: Constructable<string>, statement?: Constructable<string>): ChainCTE {
  return new ChainCETImpl(`WITH RECURSIVE \n${concat(nameOrStatement, statement)}`);
}

class ChainCETImpl implements ChainCTE {
  constructor(private sql: string) {}
  as(statement: Constructable<string>): ChainCTE;
  as(name: string, statement: Constructable<string>): ChainCTE;
  as(nameOrStatement: Constructable<string>, statement?: Constructable<string>): ChainCTE {
    return new ChainCETImpl(`${this.sql},\n${concat(nameOrStatement, statement)}`);
  }
  select<T extends {}>(columns?: Constructable<SelectParam>): SelectChainAfterSelect<T> {
    if (!columns) return new SelectChainAfterSelect("SELECT ");
    if (typeof columns === "function") columns = columns();

    return new SelectChainAfterSelect("SELECT " + selectColumns(columns));
  }
  update(table: string, options?: any): UpdateChain {
    let sql = `${this.sql}\nUPDATE ${table}`;
    if (options?.as) {
      sql += ` AS ${options.as}`;
    }
    return new UpdateChain(sql);
  }
  deleteFrom(table: string, option?: any): DeleteChain {
    let sql = `${this.sql}\nDELETE FROM ${table}`;
    if (option?.as) {
      sql += ` AS ${option.as}`;
    }
    return new DeleteChain(sql);
  }
  insertInto(table: string, columns?: readonly string[]): any {
    if (columns) {
      return new InsertChain(`INSERT INTO ${table}(${columns.join(",")})`);
    } else {
      return new InsertChain(`INSERT INTO ${table}`);
    }
  }
  toString(): string {
    return this.sql;
  }
}

function concat(statement: Constructable<string>): string;
function concat(name: Constructable<string>, statement?: Constructable<string>): string;
function concat(nameOrStatement: Constructable<string>, statement?: Constructable<string>): string {
  if (statement) {
    if (typeof statement === "function") statement = statement();
    return `${nameOrStatement} AS(${statement})`;
  } else {
    statement = nameOrStatement;
    if (typeof statement === "function") statement = statement();
    return statement;
  }
}
