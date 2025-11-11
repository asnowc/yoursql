import { DeleteFromSqlGenerator } from "./delete_chain.ts";
import { DeleteChain } from "./delete_impl.ts";

/** @public */
export const deleteFrom: DeleteFromSqlGenerator = function deleteFrom(table, option) {
  let sql = `DELETE FROM ${table}`;
  if (option?.as) {
    sql += ` AS ${option.as}`;
  }
  return new DeleteChain(sql);
};
