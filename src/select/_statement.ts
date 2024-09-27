import { ColumnsSelectAs, ColumnsSelected, OrderValue, RowsOrder } from "./type.ts";

export function genOderBy(orderBy: RowsOrder<any>, orderNullRule?: "FIRST" | "LAST") {
  let select: string[] = [];
  let v: OrderValue | undefined;
  for (const key of Object.keys(orderBy)) {
    v = orderBy[key];
    switch (v) {
      case "ASC":
        break;
      case "DESC":
        break;
      default:
        throw new Error("orderBy 只能是 ASE 或 DESC. 当前值：" + String(v));
    }
    select.push(key + " " + v);
  }
  let sql = "\nORDER BY " + select.join(", ");
  if (orderNullRule) {
    switch (orderNullRule) {
      case "FIRST":
        break;
      case "LAST":
        break;
      default:
        throw new Error("orderNullRule 只能是 FIRST 或 LAST. 当前值：" + String(orderNullRule));
    }
    sql += "NULLS " + orderNullRule;
  }
  return sql;
}

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

/**
 * @param select  选择的行
 * @param tableColumns 全部行
 * @param push 要讲选择的行加入到集合中。
 */
export function genNewColumns(
  select: ColumnsSelected<any>,
  tableColumns: Iterable<string | number | symbol>,
  /** newName -> oldName */
  push: Map<string, string | null> = new Map()
): Map<string, string | null> {
  if (select === "*") {
    for (const key of tableColumns) {
      if (push.has(key as string)) throw new ColumnRepeatError(key as string);
      push.set(key as string, null);
    }
  } else {
    genSelectAsColumns(select, push);
  }
  return push;
}
function genSelectAsColumns(
  select: ColumnsSelectAs<any> | readonly (string | number | symbol)[],
  /** newName -> oldName */
  push: Map<string, string | null> = new Map()
): Map<string, string | null> {
  if (select instanceof Array) {
    for (const key of select) {
      if (push.has(key as string)) throw new ColumnRepeatError(key as string);
      push.set(key as string, null);
    }
  } else {
    let finalName: string;
    for (const oldName of Object.keys(select)) {
      if (typeof select[oldName] === "string") finalName = select[oldName];
      else if (select[oldName]) finalName = oldName;
      else continue;
      if (push.has(finalName)) throw new ColumnRepeatError(finalName);
      push.set(finalName, oldName);
    }
  }
  return push;
}

class ColumnRepeatError extends Error {
  constructor(columnName: string | number) {
    super("Column name '" + columnName + "' repeated");
  }
}
