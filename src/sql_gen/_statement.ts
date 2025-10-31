import { Constructable } from "./util.ts";
import { SqlSelectable } from "./SqlStatement.ts";

type ConditionParam = string | string[];
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
export function selectableToString(selectable: Constructable<SqlSelectable | string>) {
  if (typeof selectable === "function") selectable = selectable();
  return typeof selectable === "string" ? selectable : selectable.toSelect();
}
