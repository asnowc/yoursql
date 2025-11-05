export * from "./sql_value/db_type.ts";
export * from "./sql_value/sql_value.ts";

export * from "./SqlStatement.ts";

export * from "./statement/mod.ts";
export * from "./util.ts";

export * from "./your_table/mod.ts";
import { SqlValueFn, SqlValuesCreator } from "./sql_value/sql_value.ts";
import { pgSqlTransformer } from "./sql_value/db_type.ts";

/**
 * 默认的 SqlValuesCreator 实列
 * @public
 */
export const v: SqlValueFn = SqlValuesCreator.create(pgSqlTransformer);
