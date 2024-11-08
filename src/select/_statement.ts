import { Constructable } from "../util.ts";

export function selectColumnsOrTable(columns: Record<string, boolean | string> | string[]) {
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

type ConditionParam = string | string[];
/**
 * 生成条件语句
 */
export function condition(conditions?: Constructable<ConditionParam | void>, type?: "AND" | "OR"): string;
export function condition(
  conditions?: Constructable<ConditionParam | void>,
  type: "AND" | "OR" = "AND"
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
