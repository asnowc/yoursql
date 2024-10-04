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
  declare [SQL_RAW]: T;
}
/** @public */
export type JsObjectMapSql = Map<new (...args: any[]) => any, (value: any) => string>;

/** 
 * @public
 */
export interface SqlValuesCreator {
  /** 将 JS 对象转为 SQL 的字符值的形式 */
  (value: any): string;
}

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
    const fn = (value: any) => this.toSqlStr(value);
    Reflect.setPrototypeOf(fn, this);
    return fn as SqlValuesCreator;
  }
  /** 设置转换器 */
  setTransformer<T>(type: new (...args: any[]) => T, transformer?: (value: T) => string) {
    if (!transformer) this.map.delete(type);
    else this.map.set(type, transformer);
  }
  private readonly map: JsObjectMapSql;
  string(value: string): string {
    return SqlValuesCreator.string(value);
  }
  number(value: number | bigint): string {
    return value.toString();
  }

  /**
   * 将 JS 对象转为 SQL 的字符值的形式
   */
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
        return this.defaultObject(value);
      case "undefined":
        return "NULL";
      default:
        //function、symbol
        let type = typeof value;
        throw new Error("不支持转换 " + type + " 类型");
    }
  }

  protected defaultObject(value: object) {
    return this.string(JSON.stringify(value));
  }

  /**
   * 将对象列表转为 SQL 的 VALUES
   * @example 返回示例： " (...),(...) "
   * @param keys - 选择的键。如果指定了 keys, 值为 undefined 的属性将自动填充为 null; 如果未指定 keys，将选择 objectList 所有不是 undefined 项的键的并集
   */
  objectListToValuesList<T extends object>(
    objectList: T[],
    keys?: readonly (keyof T)[] | { [key in keyof T]?: string | undefined }
  ): string;
  objectListToValuesList(
    objectList: Record<string | number | symbol, any>[],
    keys_types?: readonly (string | number | symbol)[] | Record<string, string | undefined>
  ): string {
    if (objectList.length <= 0) throw new Error("objectList 不能是空数组");
    let keys: string[];
    if (!keys_types) {
      keys = getKeys(objectList);
    } else if (keys_types instanceof Array) {
      keys = keys_types as string[];
    } else {
      keys = Object.keys(keys_types);
    }
    let str = "(" + this.objectToValues(objectList[0], keys_types ?? keys) + ")";

    let i = 1;
    let j: number;
    let value: any;
    let rows: string[];
    try {
      for (; i < objectList.length; i++) {
        const object = objectList[i];
        rows = [];
        j = 0;
        for (; j < keys.length; j++) {
          value = object[keys[j]] ?? null;
          rows[j] = this.toSqlStr(value);
        }
        str += ",\n(" + rows.join(",") + ")";
      }
    } catch (error) {
      let message = error instanceof Error ? error.message : String(error);
      throw new Error("第 " + i + " 项，字段 '" + (keys[j!] as string) + "' 异常，" + message);
    }

    return str;
  }
  /**
   * 将对象转为 SQL 的 value
   * @example 返回示例： " 'abc', '6', 'now()' "
   * @param keys - 如果指定了key, object undefined 的属性值将填充为 null，如果不指定，将自获取 object 所有非 undefined 的属性的key
   */
  objectToValues<T extends object>(
    object: T,
    keys?: readonly (keyof T)[] | { [key in keyof T]?: string | undefined }
  ): string;
  objectToValues(
    object: Record<string | number, any>,
    keys_types: readonly string[] | Record<string, string | undefined> | undefined
  ): string {
    const { keys, type } = toKeyType(object, keys_types);

    const values: string[] = [];
    let i = 0;
    let key: string;
    let value: any;
    try {
      for (; i < keys.length; i++) {
        key = keys[i];
        value = object[key] ?? null;
        if (type[key]) values[i] = this.toSqlStr(value) + "::" + type[key];
        else values[i] = this.toSqlStr(value);
      }
    } catch (error) {
      let message = error instanceof Error ? error.message : String(error);
      throw new Error("字段 '" + key! + "' 异常，" + message);
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
function toKeyType(object: Record<string, any>, keys_types?: readonly string[] | Record<string, string | undefined>) {
  let type: Record<string, string | undefined> = {};
  let keys: readonly string[];

  if (keys_types instanceof Array) {
    keys = keys_types;
    type = {};
  } else if (keys_types) {
    keys = Object.keys(keys_types);
    type = keys_types;
  } else {
    keys = Object.keys(object).filter((key) => typeof key === "string" && object[key] !== undefined);
  }
  return { type, keys };
}
function getKeys(objectList: any[]): string[] {
  let keys = new Set<string>();
  for (let i = 0; i < objectList.length; i++) {
    let obj = objectList[i];
    let hasKeys = Object.keys(obj);
    let k: string;
    for (let j = 0; j < hasKeys.length; j++) {
      k = hasKeys[j];
      if (obj[k] !== undefined && typeof k === "string") keys.add(k);
    }
  }
  return Array.from(keys);
}
