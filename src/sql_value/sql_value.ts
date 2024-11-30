import { getObjectListKeys } from "../util.ts";
import type { TableType } from "../select/type.ts";
import { SqlSelectable } from "../select/selectable.ts";

declare const SQL_RAW: unique symbol;
/**
 * SQL 原始字符类。可以使用 String 类代替，这只是为了推断类型
 * @public
 */
export class SqlRaw<T = any> extends String {
  /** 保留以推断类型 */
  protected declare [SQL_RAW]: T;
}

/** @public js 对象到编码函数的映射*/
export type JsObjectMapSql = Map<new (...args: any[]) => any, SqlValueEncoder>;
/** @public 将 js 值转为 SQl 字符串的函数*/
export type SqlValueEncoder<T = any> = (this: SqlValuesCreator, value: T) => string;
/** @public 断言类型 */
export type ManualType = "bigint" | "number" | "string" | "boolean" | "object" | (new (...args: any[]) => any);

/** @public */
export type SqlValueFn = SqlValuesCreator & {
  /**
   * 安全将 JS 对象转为 SQL 的字符值的形式，可避免 SQL 注入。
   * undefined 将被转换为 DEFAULT
   */
  (value: any, assertType?: ManualType): string;
};

/**
 * SQL value 生成器
 * @public
 */
export class SqlValuesCreator {
  static create(map?: JsObjectMapSql): SqlValueFn {
    const obj = new this(map);
    const fn = obj.toSqlStr.bind(obj);
    Reflect.setPrototypeOf(fn, obj);
    return fn as any;
  }
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
  constructor(map?: JsObjectMapSql) {
    this.#map = new Map(map);
  }
  /** 设置转换器 */
  setTransformer(type: new (...args: any[]) => any, encoder?: SqlValueEncoder): void;
  setTransformer(map: JsObjectMapSql): void;
  setTransformer(type_map: (new (...args: any[]) => any) | JsObjectMapSql, encoder?: SqlValueEncoder): void {
    if (typeof type_map === "function") {
      if (encoder) this.#map.set(type_map, encoder);
      else this.#map.delete(type_map);
    } else {
      for (const [type, encoder] of type_map) {
        if (typeof type === "function" && typeof encoder === "function") {
          this.#map.set(type, encoder);
        }
      }
    }
  }
  readonly #map: JsObjectMapSql;

  /**
   * 将 JS 对象转为 SQL 的字符值的形式 。 undefined 将被转换为 DEFAULT
   * ```ts
   *  const v=SqlValuesCreator.create()
   *  v() 和 v.toSqlStr() 是等价的
   * ```
   */
  toSqlStr(value: any, assertType?: ManualType): string {
    let basicType;
    if (assertType) {
      if (typeof assertType === "function") {
        let type = this.#map.get(assertType);
        if (!type) throw new Error("类型不存在");
        return type.call(this, value);
      } else {
        basicType = assertType;
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
      case "object": {
        if (value === null) return "NULL";
        if (value instanceof String) return value.toString();
        return this.getObjectType(value).call(this, value);
      }
      case "undefined":
        return "DEFAULT";
      default:
        //function、symbol
        let type = typeof value;
        throw new Error("不支持转换 " + type + " 类型");
    }
  }
  /** 获取值对应的 SqlValueEncoder */
  getObjectType(value: object): SqlValueEncoder {
    for (const Class of this.#map.keys()) {
      if (value instanceof Class) return this.#map.get(Class)!;
    }
    return this.defaultObject;
  }
  protected defaultObject(value: object): string {
    return SqlValuesCreator.string(JSON.stringify(value));
  }

  /**
   * 将对象列表转为 SQL 的 VALUES。
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
      keys = Array.from(getObjectListKeys(objectList, keepUndefinedKey));
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

  /**
   * @public 创建 VALUES AS  语句
   * @example
   * ```ts
   *  sqlValue.createValues(
   *    "customName",
   *    [{age:8, name:"hhh"}, {age:9, name:"row2"}],
   *    {age:"INT", name:"TEXT"}
   *  )
   * // (VALUES (8:INT,'hhh':TEXT),(9,'row2')) AS customName(age, name)
   * ```
   */
  createValues<T extends {}>(
    asName: string,
    values: T[],
    valuesTypes: Record<string, string | { sqlType: string; sqlDefault?: string }>
  ): SqlSelectable<T>;
  createValues(
    asName: string,
    values: Record<string, any>[],
    valuesTypes: Record<string, string | { sqlType: string; sqlDefault?: string }>
  ): SqlSelectable<any> {
    if (values.length === 0) throw new Error("values 不能为空");
    const insertKeys: string[] = Object.keys(valuesTypes);
    const defaultValues: string[] = [];

    const valuesStr: string[] = new Array(values.length);
    {
      const column0: string[] = new Array(insertKeys.length);
      let columnName: string;
      let item: string | { sqlType: string; sqlDefault?: string };
      let type: string;
      let value: any;
      for (let i = 0; i < insertKeys.length; i++) {
        columnName = insertKeys[i];
        item = valuesTypes[columnName];
        if (typeof item === "string") {
          type = item;
          defaultValues[i] = "NULL";
        } else {
          type = item.sqlType;
          defaultValues[i] = item.sqlDefault ?? "NULL";
        }
        value = values[0][columnName];
        if (value === undefined) column0[i] = defaultValues[i] + "::" + type;
        else column0[i] = this.toSqlStr(value) + "::" + type;
      }
      valuesStr[0] = "(" + column0.join(",") + ")";
    }

    let items: string[] = new Array(insertKeys.length);
    let value: any;
    for (let i = 1; i < values.length; i++) {
      for (let j = 0; j < insertKeys.length; j++) {
        value = values[i][insertKeys[j]];
        if (value === undefined) items[j] = defaultValues[j];
        else items[j] = this.toSqlStr(value);
      }
      valuesStr[i] = "(" + items.join(",") + ")";
    }
    return new YourValuesAs(insertKeys, asName, valuesStr.join(",\n"));
  }
}
class YourValuesAs<T extends TableType> extends SqlSelectable<T> {
  constructor(columns: readonly string[], asName: string, valuesStr: string) {
    super();
    this.#asName = asName;
    this.#valuesStr = valuesStr;
    this.#sql = `(VALUES\n${this.#valuesStr})\nAS ${this.#asName}(${columns.join(",")})`;
  }
  #asName: string;
  #valuesStr: string;
  #sql: string;
  toSelect(): string {
    return this.#sql;
  }
  toString(): string {
    return this.#sql;
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
