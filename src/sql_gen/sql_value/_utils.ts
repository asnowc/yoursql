import { SqlStatementDataset } from "../SqlStatement.ts";
import { TableType } from "../util.ts";
import { ColumnToValueConfig } from "./type.ts";

export class YourValuesAs<T extends TableType> extends SqlStatementDataset<T> {
  constructor(columns: readonly string[], asName: string, valuesStr: string) {
    super();
    this.#asName = asName;
    this.#valuesStr = valuesStr;
    this.#sql = `(VALUES\n${this.#valuesStr})\nAS ${this.#asName}(${columns.join(",")})`;
  }
  #asName: string;
  #valuesStr: string;
  #sql: string;
  override toSelect(): string {
    return this.#sql;
  }
  genSql(): string {
    return this.#sql;
  }
}
export function initColumnAssert(
  keys: readonly string[],
  keys_types: Record<string, string | undefined | ColumnToValueConfig>,
) {
  let key: string;
  let value: any;
  let type = new Array(keys.length);
  for (let i = 0; i < keys.length; i++) {
    key = keys[i];
    value = keys_types[key];
    if (typeof value === "string") {
      type[i] = { sqlType: value };
    } else {
      type[i] = value;
    }
  }
  return type;
}
