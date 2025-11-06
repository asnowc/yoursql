/** @public */
export type ConditionParam = string | string[];

/** @public */
export type Constructable<T> = T | (() => T);

/** @public */
export type SelectParam = string | string[] | Record<string, string | boolean>;
/**
 * @public
 * @example
 * ```ts
 * selectColumns({c1: true, c2: "count(*)", c3: "column"})  //  "c1,count(*) AS c2,column as c3"
 * selectColumns("c1,count(*) AS c2,column as c3")  //  "c1,count(*) AS c2,column as c3"
 * ```
 */
export function selectColumns(columns: Constructable<SelectParam>): string {
  if (typeof columns === "function") columns = columns();
  switch (typeof columns) {
    case "string":
      return columns;
    case "object": {
      if (columns instanceof Array) {
        if (columns.length === 0) throw new Error("没有选择任何列");
        return columns.join(",");
      } else {
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
    }

    default:
      throw new TypeError("columns 应为 string 或 object 类型");
  }
}

/**
 * 推断表插入类型
 * @public
 * @param T - 表格创建类型
 * @param Pa - 可选列
 */
export type ToInsertType<T extends { [key: string]: any }, Pa extends keyof T = never> = {
  [key in keyof T as key extends Pa ? never : null extends T[key] ? never : key]: T[key];
} & {
  [key in keyof T as null extends T[key] ? key : key extends Pa ? key : never]?: T[key];
};

/** @public */
export type UpdateRowValue<T extends object> = {
  [key in keyof T]?: T[key] | String;
};

/** @public */
export type TableType = {
  [key: string]: any;
};
