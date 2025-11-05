import { Constructable, SelectParam, TableType } from "../util.ts";
import { SqlStatementDataset, SqlStatement } from "../SqlStatement.ts";

export interface ChainModifyReturning extends SqlStatement {
  returning<R extends TableType>(columns: Constructable<SelectParam>): SqlStatementDataset<R>;
}
