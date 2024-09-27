declare const SQL_RAW: unique symbol;
/**
 * SQL 原始字符对象
 * @public
 */
export class SqlRaw<T = any> {
  #value: string;
  constructor(value: string) {
    this.#value = value;
  }
  toString(): string {
    return this.#value;
  }
  /** 保留以推断类型 */
  declare [SQL_RAW]: (item: T) => never;
}
/** @public */
export type JsObjectMapSql = Map<new (...args: any[]) => any, (value: object) => string>;
/**
 * SQL value 生成器
 * @public
 */
export class SqlValuesCreator {
  /**
   * 将字符串转为 SQL 的字符串值的形式(单引号会被转义)。
   * @example 输入 a'b'c , 返回 a''b''c.
   */
  static string(value: string): string {
    return "'" + value.replaceAll("'", "''") + "'";
  }
  /**
   * @param map - 自定义对象转换
   */
  constructor(map: JsObjectMapSql = new Map()) {
    this.map = map;
  }
  private readonly map: JsObjectMapSql;
  string(value: string): string {
    return SqlValuesCreator.string(value);
  }
  number(value: number | bigint): string {
    return value.toString();
  }

  /** 将 JS 对象转为 SQL 的字符值的形式 */
  toSqlStr(value: any): string {
    switch (typeof value) {
      case "bigint":
        return this.number(value);
      case "number":
        return this.number(value);
      case "string":
        return this.string(value);
      case "boolean":
        return value.toString();
      case "object":
        if (value === null) return "NULL";
        if (value instanceof SqlRaw) {
          return value.toString();
        }
        for (const Class of this.map.keys()) {
          if (value instanceof Class) return this.map.get(Class)!.call(this, value);
        }
        return this.string(JSON.stringify(value));
      default:
        let type = typeof value;
        if (type === "object") type = value.constructor?.name ?? "object";
        throw new Error("不支持转换 " + type + " 类型");
    }
  }
  /**
   * 将对象列表转为 SQL 的 VALUES
   * @example 返回示例： " (...),(...) "
   */
  objectListToValuesList<T extends object>(
    objectList: T[],
    keys: (keyof T)[] = Object.keys(objectList[0]) as any
  ): string {
    let i = 0;

    let j: number;
    let value: any;

    const rowValues: string[] = new Array(objectList.length);
    try {
      for (; i < objectList.length; i++) {
        const object = objectList[i];
        const values: string[] = [];
        j = 0;
        for (; j < keys.length; j++) {
          value = object[keys[j]];
          values[j] = this.toSqlStr(value);
        }
        rowValues[i] = "\n(" + values.join(",") + ")";
      }
    } catch (error) {
      let message = error instanceof Error ? error.message : String(error);
      throw new Error("第 " + i + " 项，字段 '" + (keys[j!] as string) + "' 异常，" + message);
    }

    return rowValues.join(",");
  }
  /**
   * 将对象转为 SQL 的 value
   * @example 返回示例： " 'abc', '6', 'now()' "
   */
  objectToValues(object: object, keys: readonly string[]): string;
  objectToValues(object: Record<string | number, any>, keys: readonly string[]): string {
    const values: string[] = [];
    let i = 0;
    let value: any;
    try {
      for (; i < keys.length; i++) {
        value = object[keys[i]];
        values[i] = this.toSqlStr(value);
      }
    } catch (error) {
      let message = error instanceof Error ? error.message : String(error);
      throw new Error("字段 '" + keys[i] + "' 异常，" + message);
    }
    return values.join(",");
  }
  /**
   * 将数组列表转为 SQL 的一个 value
   * @example 返回示例： " 'abc', '6', 'now()' "
   */
  toValues(values: readonly any[]): string {
    return values.map(this.toSqlStr.bind(this)).join(",");
  }
}
