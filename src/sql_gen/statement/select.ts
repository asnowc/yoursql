import { Constructable, selectColumns, SelectParam, TableType } from "../util.ts";
import { ChainSelect, SelectSqlGenerator } from "./select_chain.ts";
import { SelectChainAfterSelect } from "./select_impl.ts";

/** @public */
export const select: SelectSqlGenerator = function select<T extends TableType>(
  columns?: Constructable<SelectParam>,
): ChainSelect<T> {
  if (!columns) return new SelectChainAfterSelect("SELECT ");
  if (typeof columns === "function") columns = columns();

  return new SelectChainAfterSelect("SELECT " + selectColumns(columns));
};
export { orderBy } from "./select_impl.ts";
