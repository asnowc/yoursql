import { OrderValue } from "./select/type.ts";

/**
 * 获取对象数组中的 key 的集合
 * @public
 * @param keepUndefinedKey - 是否保留值为 undefined 的 key
 */
export function getObjectListKeys(objectList: any[], keepUndefinedKey?: boolean): Set<string> {
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
  return keys;
}

/** @public */
export type WhereParam = string | string[];
/**
 * 生成 WHERE 语句
 * @public
 * ```ts
 *
 * ```
 */
export function where(condition?: WhereParam | (() => WhereParam), type: "AND" | "OR" = "AND"): string {
  if (!condition) return "";
  return genCondition(condition, "WHERE", type);
}
/**
 *
 * 生成 HAVING 语句
 * @public
 */
export function having(condition?: WhereParam | (() => WhereParam), type: "AND" | "OR" = "AND"): string {
  if (!condition) return "";
  return genCondition(condition, "HAVING", type);
}
function genCondition(condition: WhereParam | (() => WhereParam), statement: string, type: "AND" | "OR" = "AND") {
  if (typeof condition === "function") condition = condition();
  type = " " + type + " ";
  let sql = "";
  if (typeof condition === "string") sql += "\n" + statement + " " + condition;
  else {
    if (condition.length) sql += "\n" + statement + " " + condition[0];
    for (let i = 1; i < condition.length; i++) sql += type + condition[i];
  }
  return sql;
}

/**
 * @public
 * ```ts
 * selectColumns({c1: true, c2: "count(*)", c3: "column"})  //  "c1,count(*) AS c2,column as c3"
 * selectColumns(["c1", "count(*) AS c2", "column as c3"])  //  "c1,count(*) AS c2,column as c3"
 * ```
 */
export function selectColumns(columns: string[] | Record<string, string | boolean>): string {
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
export type OrderBehavior = { key: string; asc: boolean; nullLast?: boolean };
/** @public */
export type OrderByParam =
  | string
  | (string | OrderBehavior)[]
  | Record<string, boolean | `${OrderValue} ${"NULLS FIRST" | "NULLS LAST"}`>;

/**
 * 生成 ORDER BY 语句, d
 * @public
 * ```ts
 * // 以下生成 "\nORDER BY age DESC NULLS FIRST,num ASC"
 * orderBy("age DESC NULLS FIRST,num ASC");
 * orderBy(["age DESC NULLS FIRST", "num ASC"]);
 * orderBy([
 *    { key: "age", asc: false, nullLast: false },
 *    { key: "num", asc: true },
 *  ]);
 * orderBy({ age: "DESC NULLS FIRST", num: true });
 *
 * orderBy([]) // ""
 * orderBy({}) // ""
 * ```
 */
export function orderBy(by: OrderByParam | (() => OrderByParam)): string {
  if (typeof by === "function") by = by();

  let sql = "";
  if (typeof by === "string") {
    if (!by) return sql;
    sql += "\nORDER BY " + by;
  } else if (by instanceof Array) {
    if (by.length) {
      sql += "\nORDER BY " + handlerOrderValue(by[0]);
      for (let i = 1; i < by.length; i++) sql += "," + handlerOrderValue(by[i]);
    }
  } else {
    let keys = Object.keys(by);
    if (keys.length) {
      let key = keys[0];
      sql += "\nORDER BY " + key + " " + by[key];
      for (let i = 1; i < keys.length; i++) {
        key = keys[i];
        sql += "," + key + " ";
        if (typeof by[key] === "string") sql += by[key];
        else sql += by[key] ? "ASC" : "DESC";
      }
    }
  }
  return sql;
}
function handlerOrderValue(value: string | OrderBehavior) {
  if (typeof value === "string") return value;
  else {
    let str = value.key + " " + (value.asc ? "ASC" : "DESC");
    if (value.nullLast !== undefined) str += value.nullLast ? " NULLS LAST" : " NULLS FIRST";
    return str;
  }
}
