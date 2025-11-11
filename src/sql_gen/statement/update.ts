import { UpdateSqlGenerator } from "./update_chain.ts";
import { UpdateChain } from "./update_impl.ts";
/** @public */
export const update: UpdateSqlGenerator = function update(table, options) {
  let sql = `UPDATE ${table}`;
  if (options?.as) {
    sql += ` AS ${options.as}`;
  }
  return new UpdateChain(sql);
};
