import { Constructable } from "../util.ts";

/**
 * @public
 */
export interface ChainCTE {
  as(statement: Constructable<string>): ChainCTE;
  as(name: string, statement: Constructable<string>): ChainCTE;
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
    if (statement) {
      return new ChainCETImpl(`${this.sql}\n${concat(nameOrStatement, statement)}`);
    } else {
      return new ChainCETImpl(concat(nameOrStatement, statement));
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
