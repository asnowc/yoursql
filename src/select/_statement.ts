import { ColumnsSelectAs } from "./type.ts";

export function selectColumnsOrTable(columns: ColumnsSelectAs<any> | string[]) {
  let sqlSelect: string[];
  let select: string[];
  if (columns instanceof Array) {
    sqlSelect = columns;
    select = columns;
  } else {
    sqlSelect = [];
    select = [];
    let c: string | boolean | undefined;
    for (const key of Object.keys(columns)) {
      c = columns[key];
      if (typeof c === "string" && c !== key) {
        sqlSelect.push(key + " AS " + c);
        select.push(c);
      } else if (c) {
        sqlSelect.push(key);
        select.push(key);
      }
    }
  }
  if (select.length === 0) throw new Error("选择列为空");

  return { columns: select, sqlColumns: sqlSelect.join(", ") };
}

class ColumnRepeatError extends Error {
  constructor(columnName: string | number) {
    super("Column name '" + columnName + "' repeated");
  }
}
