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
  private declare [SQL_RAW]: T;
}

/** @public */
export type JsObjectMapSql = Map<new (...args: any[]) => any, SqlValueEncoder>;
/** @public */
export type SqlValueEncoder<T = any> = (this: SqlValuesCreator, value: T, map: JsObjectMapSql) => string;
/** @public */
export type ManualType = "bigint" | "number" | "string" | "boolean" | (new (...args: any[]) => any);
/**
 * @public
 */
export interface SqlValuesCreator {
  /** 将 JS 对象转为 SQL 的字符值的形式 。 undefined 将被转换为 DEFAULT */
  (value: any, expectType?: ManualType): string;
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
    const fn = this.toSqlStr.bind(this);
    this.toSqlStr = fn;
    Reflect.setPrototypeOf(fn, this);
    return fn as SqlValuesCreator;
  }
  /** 设置转换器 */
  setTransformer<T>(type: new (...args: any[]) => T, transformer?: SqlValueEncoder) {
    if (!transformer) this.map.delete(type);
    else this.map.set(type, transformer);
  }
  private readonly map: JsObjectMapSql;

  /** 将 JS 对象转为 SQL 的字符值的形式 。 undefined 将被转换为 DEFAULT */
  protected toSqlStr(
    value: any,
    expectType?: "bigint" | "number" | "string" | "boolean" | (new (...args: any[]) => any)
  ): string {
    let basicType;
    if (expectType) {
      if (typeof expectType === "function") {
        return this.map.get(expectType)!.call(this, value, this.map);
      } else {
        basicType = expectType;
      }
    } else basicType = typeof value;
    switch (basicType) {
      case "bigint":
        return value.toString();
      case "number":
        return value.toString();
      case "string":
        return SqlValuesCreator.string(value);
      case "boolean":
        return value.toString();
      case "object":
        return this.toObjectStr(value);
      case "undefined":
        return "DEFAULT";
      default:
        //function、symbol
        let type = typeof value;
        throw new Error("不支持转换 " + type + " 类型");
    }
  }

  protected toObjectStr(value: object): string {
    if (value === null) return "NULL";
    if (value instanceof SqlRaw) return value.toString();
    for (const Class of this.map.keys()) {
      if (value instanceof Class) return this.map.get(Class)!.call(this, value, this.map);
    }
    return this.defaultObject(value);
  }
  protected defaultObject(value: object): string {
    return SqlValuesCreator.string(JSON.stringify(value));
  }

  /**
   * 将对象列表转为 SQL 的 VALUES
   * @example 返回示例： " (...),(...) "
   * @param keys - 选择的键。如果指定了 keys, 值为 undefined 的属性将自动填充为 null; 如果未指定 keys，将选择 objectList 所有不是 undefined 项的键的并集
   */
  objectListToValuesList<T extends object>(
    objectList: T[],
    keys?: readonly (keyof T)[] | { [key in keyof T]?: string | undefined },
    keepUndefinedKey?: boolean
  ): string;
  objectListToValuesList(
    objectList: Record<string | number | symbol, any>[],
    keys_types?: readonly (string | number | symbol)[] | Record<string, string | undefined>,
    keepUndefinedKey?: boolean
  ): string {
    if (objectList.length <= 0) throw new Error("objectList 不能是空数组");
    let keys: string[];
    if (!keys_types) {
      keys = getObjectListKeys(objectList, keepUndefinedKey);
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
          value = object[keys[j]];
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
        value = object[key];
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
    return values.map((v) => this.toSqlStr(v)).join(",");
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
    keys = Object.keys(object);
  }
  return { type, keys };
}
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
