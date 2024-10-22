import { ColumnsSelectAs, OrderValue } from "./type.ts";

/** @public */
export type OrderByParam<T extends {} = {}> =
  | string
  | string[]
  | ({ [key in keyof T]: OrderValue } & Record<string, OrderValue>);

/** @public */
export function genOderBy<T extends {} = {}>(orderBy: OrderByParam<T> | (() => OrderByParam<T>)) {
  if (typeof orderBy === "function") orderBy = orderBy();

  let sql = "";
  if (typeof orderBy === "string") sql += "\nORDER BY " + orderBy;
  else if (orderBy instanceof Array) {
    if (orderBy.length) sql += "\nORDER BY " + orderBy.join(",");
  } else {
    let keys = Object.keys(orderBy);
    if (keys.length) sql += "\nORDER BY " + keys[0][0] + " " + keys[0][1];
    for (let i = 1; i < keys.length; i++) {
      sql += "," + orderBy[keys[i]] + " " + orderBy[keys[i]];
    }
  }
  return sql;
}
/** @public */
export type WhereParam = string | string[];
/** @public */
export function genWhere(where: WhereParam | (() => WhereParam), type: "AND" | "OR" = "AND") {
  if (typeof where === "function") where = where();
  type = " " + type + " ";
  let sql = "";
  if (typeof where === "string") sql += "\nWHERE " + where;
  else {
    if (where.length) sql += "\nWHERE " + where[0];
    for (let i = 1; i < where.length; i++) sql += type + where[i];
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

class ColumnRepeatError extends Error {
  constructor(columnName: string | number) {
    super("Column name '" + columnName + "' repeated");
  }
}
