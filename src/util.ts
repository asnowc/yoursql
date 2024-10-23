import { condition } from "./select/_statement.ts";
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
export type ConditionParam = string | string[];
/**
 * 生成 WHERE 语句
 * @public
 * @example
 * ```ts
 *
 * ```
 */
export function where(conditions?: ConditionParam | (() => ConditionParam | void), type?: "AND" | "OR"): string {
  const sql = condition(conditions, type);
  if (sql) return "\nWHERE " + sql;
  return "";
}
/**
 *
 * 生成 HAVING 语句
 * @public
 */
export function having(conditions?: ConditionParam | (() => ConditionParam | void), type?: "AND" | "OR"): string {
  const sql = condition(conditions, type);
  if (sql) return "\nHAVING " + sql;
  return "";
}

/** @public */
export type SelectParam = string | Record<string, string | boolean>;
/**
 * @public
 * @example
 * ```ts
 * selectColumns({c1: true, c2: "count(*)", c3: "column"})  //  "c1,count(*) AS c2,column as c3"
 * selectColumns("c1,count(*) AS c2,column as c3")  //  "c1,count(*) AS c2,column as c3"
 * ```
 */
export function selectColumns(columns: SelectParam | (() => SelectParam)): string {
  if (typeof columns === "function") columns = columns();
  switch (typeof columns) {
    case "string":
      return columns;
    case "object": {
      let sql = "";
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
      return sql;
    }

    default:
      throw new TypeError("columns 应为 string 或 object 类型");
  }
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
 * @example
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
export function orderBy(by?: OrderByParam | void | (() => OrderByParam | void)): string {
  if (typeof by === "function") by = by();
  let sql = "";
  if (!by) return sql;
  if (typeof by === "string") {
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
      let value = by[key];
      sql += "\nORDER BY " + key + " " + (typeof value === "string" ? value : value ? "ASC" : "DESC");
      for (let i = 1; i < keys.length; i++) {
        key = keys[i];
        value = by[key];
        sql += "," + key + " ";
        if (typeof value === "string") sql += value;
        else sql += value ? "ASC" : "DESC";
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
