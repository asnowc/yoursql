import { ConditionParam, Constructable, selectColumns, SelectParam } from "./util.ts";
import { SqlSelectable } from "./SqlStatement.ts";

/**
 * 获取对象数组中的 key 的集合
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
/**
 * 生成条件语句
 */
export function condition(conditions?: Constructable<ConditionParam | void>, type?: "AND" | "OR"): string;
export function condition(
  conditions?: Constructable<ConditionParam | void>,
  type: "AND" | "OR" = "AND",
): string | undefined {
  if (typeof conditions === "function") conditions = conditions();
  if (!conditions) return;
  if (typeof conditions === "string") return conditions;
  else {
    if (conditions.length) {
      let sql = "";
      type = " " + type + " ";
      sql += conditions[0];
      for (let i = 1; i < conditions.length; i++) sql += type + conditions[i];
      return sql;
    }
    return;
  }
}

/**
 * 生成 WHERE 语句
 * @public
 * @example
 * ```ts
 * where(['a=1','b=2']) // "\nWHERE a=1 AND b=2"
 * where(['a=1','b=2'],"OR") // "\nWHERE a=1 OR b=2"
 * where("a=1 OR b=2") // "\nWHERE a=1 OR b=2"
 * where(()=>"a=1 OR b=2") // "\nWHERE a=1 AND b=2"
 * where([]) // ""
 * where(undefined) // ""
 * ```
 */
export function whereToString(conditions?: Constructable<ConditionParam | void>, type?: "AND" | "OR"): string {
  const sql = condition(conditions, type);
  if (sql) return "\nWHERE " + sql;
  return "";
}

export function createUpdateSetFromObject(set: Record<string, string | undefined>, prefix?: string): string {
  const updateKey = Object.keys(set);
  let i = 0;
  let key: string;
  let sqlKey: string;
  let value: any;
  let sql: string | undefined;
  for (; i < updateKey.length; i++) {
    key = updateKey[i];
    sqlKey = prefix ? `${prefix}.${key}` : key;
    value = set[key];
    if (value === undefined) continue;
    if (typeof value === "string") {
      if (value) {
        sql = "SET\n" + sqlKey + "= " + value;
        break;
      }
    } else throw new TypeError(`key ${key} 类型错误(${typeof value})`);
  }
  if (sql) {
    i++;
    for (; i < updateKey.length; i++) {
      key = updateKey[i];
      sqlKey = prefix ? `${prefix}.${key}` : key;
      value = set[key];
      if (value === undefined) continue;
      if (typeof value === "string") {
        if (value) sql += "," + sqlKey + "= " + value;
      } else throw new TypeError(`key ${key} 类型错误(${typeof value})`);
    }
    return sql;
  } else throw new Error("值不能为空");
}
export function selectableToString(selectable: Constructable<SqlSelectable | string>, asName?: string): string {
  if (typeof selectable === "function") selectable = selectable();
  let sql = typeof selectable === "string" ? selectable : selectable.toSelect();
  if (!sql) throw new Error("selectable can not be empty");
  if (asName) sql += " AS " + asName;
  return sql;
}

export function returningToString(returns: Constructable<SelectParam | "*">): string {
  if (typeof returns === "function") returns = returns();
  let columnsStr: string;
  if (returns === "*") {
    columnsStr = "*";
  } else {
    columnsStr = selectColumns(returns);
  }
  return "\nRETURNING " + columnsStr;
}
