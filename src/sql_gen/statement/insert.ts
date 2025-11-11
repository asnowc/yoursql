import { ChainInsert, InsertIntoSqlGenerator } from "./insert_chain.ts";
import { InsertChain } from "./insert_impl.ts";

/** @public */
export const insertInto: InsertIntoSqlGenerator = function insertInto(table, columns?: readonly string[]): ChainInsert {
  if (columns) {
    return new InsertChain(`INSERT INTO ${table}(${columns.join(",")})`);
  } else {
    return new InsertChain(`INSERT INTO ${table}`);
  }
};
