import { OrderValue } from "./select/type.ts";

/**
 * @public
 * @param keepUndefinedKey - 是否保留值为 undefined 的 key
 */
export function getObjectListKeys(objectList: any[], keepUndefinedKey?: boolean): string[] {
  let keys = new Set<string>();
  for (let i = 0; i < objectList.length; i++) {
    let obj = objectList[i];
    let hasKeys = Object.keys(obj);
    let k: string;
    for (let j = 0; j < hasKeys.length; j++) {
      k = hasKeys[j];
      if (typeof k !== "string") continue;
      if (!keepUndefinedKey && obj[k] === undefined) continue;
      keys.add(k);
    }
  }
  return Array.from(keys);
}

/** @public */
export type WhereParam = string | string[];
/** @public */
export function genWhere(where: WhereParam | (() => WhereParam), type: "AND" | "OR" = "AND"): string {
  return genWhereHaving(where, "WHERE", type);
}
/** @public */
export function genHaving(having: WhereParam | (() => WhereParam), type: "AND" | "OR" = "AND"): string {
  return genWhereHaving(having, "HAVING", type);
}

/**
 * @public
 * ```ts
 * genSelect({c1: true, c2: "count(*)", c3: "column"})  //  "c1,count(*) AS c2,column as c3"
 * genSelect(["c1", "count(*) AS c2", "column as c3"])  //  "c1,count(*) AS c2,column as c3"
 * ```
 */
export function genSelect(columns: string[] | Record<string, string | boolean>): string {
  let sql = "";
  if (columns instanceof Array) {
    if (columns.length) sql += columns[0];
    else throw new Error("没有选择任何列");
    for (let i = 1; i < columns.length; i++) sql += "," + columns[i];
  } else {
    const keys = Object.keys(columns);
    if (keys.length === 0) throw new Error("没有选择任何列");
    let k: string = keys[0];
    let v = columns[k];

    if (typeof v === "string") sql += v + " AS " + k;
    else sql += k;

    for (let i = 1; i < keys.length; i++) {
      k = keys[i];
      v = columns[k];
      sql += ",";
      if (typeof v === "string") sql += v + " AS " + k;
      else sql += k;
    }
  }
  return sql;
}
/** @public */
export type OrderByParam<T extends {} = {}> =
  | string
  | string[]
  | ({ [key in keyof T]: OrderValue } & Record<string, OrderValue>);

/** @public */
export function genOderBy<T extends {} = {}>(orderBy: OrderByParam<T> | (() => OrderByParam<T>)): string {
  if (typeof orderBy === "function") orderBy = orderBy();

  let sql = "";
  if (typeof orderBy === "string") sql += "\nORDER BY " + orderBy;
  else if (orderBy instanceof Array) {
    if (orderBy.length) sql += "\nORDER BY " + orderBy.join(",");
  } else {
    let keys = Object.keys(orderBy);
    if (keys.length) sql += "\nORDER BY " + keys[0] + " " + orderBy[keys[0]];
    for (let i = 1; i < keys.length; i++) {
      sql += "," + orderBy[keys[i]] + " " + orderBy[keys[i]];
    }
  }
  return sql;
}
function genWhereHaving(where: WhereParam | (() => WhereParam), statement: string, type: "AND" | "OR" = "AND") {
  if (typeof where === "function") where = where();
  type = " " + type + " ";
  let sql = "";
  if (typeof where === "string") sql += "\n" + statement + " " + where;
  else {
    if (where.length) sql += "\n" + statement + " " + +where[0];
    for (let i = 1; i < where.length; i++) sql += type + where[i];
  }
  return sql;
}
