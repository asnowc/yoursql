import { getObjectListKeys } from "../util.ts";
import type { TableType } from "../select/type.ts";
import { SqlStatementDataset } from "../select/chain_base.ts";

/** @public js 对象到编码函数的映射*/
export type JsObjectMapSql = Map<new (...args: any[]) => any, SqlValueEncoder>;
/** @public 将 js 值转为 SQl 字符串的函数*/
export type SqlValueEncoder<T = any> = (this: SqlValuesCreator, value: T) => string;

/** @public 断言类型 */
export type AssertJsType = "bigint" | "number" | "string" | "boolean" | "object" | (new (...args: any[]) => any);

/** @public */
export type SqlValueFn = SqlValuesCreator & {
  /**
   * 安全将 JS 对象转为 SQL 的字符值的形式，可避免 SQL 注入。
   * undefined 将被转换为 DEFAULT
   * @param assertType - 如果断言了基本类型，并且值的基本类型与断言的类型不一致，则会抛出异常。 如果不是基本类型，则 value 会被传递给指定的转义器
   */
  (value: any, assertType?: AssertJsType): string;
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
    this._map = new Map(map);
  }
  /** 设置转换器 */
  setTransformer(type: new (...args: any[]) => any, encoder?: SqlValueEncoder): void;
  setTransformer(map: JsObjectMapSql): void;
  setTransformer(type_map: (new (...args: any[]) => any) | JsObjectMapSql, encoder?: SqlValueEncoder): void {
    if (typeof type_map === "function") {
      if (encoder) this._map.set(type_map, encoder);
      else this._map.delete(type_map);
    } else {
      for (const [type, encoder] of type_map) {
        if (typeof type === "function" && typeof encoder === "function") {
          this._map.set(type, encoder);
        }
      }
    }
  }
  private readonly _map: JsObjectMapSql;

  /**
   * 将 JS 对象转为 SQL 的字符值的形式 。 undefined 将被转换为 DEFAULT
   * ```ts
   *  const v=SqlValuesCreator.create()
   *  v() 和 v.toSqlStr() 是等价的
   * ```
   */
  toSqlStr(value: any, assertJsType?: AssertJsType): string {
    if (value === null) return "NULL";
    else if (value === undefined) return "DEFAULT";
    let basicType = typeof value;
    if (assertJsType) {
      if (typeof assertJsType === "function") {
        if (basicType !== "object") throw new AssertError("object", basicType);
        let type = this._map.get(assertJsType);
        if (!type) {
          if (assertJsType === Object) return this.defaultObject(value);
          throw new Error("类型不存在");
        }
        return type.call(this, value);
      } else if (basicType !== assertJsType) {
        throw new AssertError(assertJsType, basicType);
      }
    }
    switch (basicType) {
      case "bigint":
        return value.toString();
      case "number":
        return value.toString();
      case "string":
        return SqlValuesCreator.string(value);
      case "boolean":
        return value ? "TRUE" : "FALSE";
      case "object": {
        if (value instanceof String) return value.toString();
        const Class = this.getClassType(value);
        if (Class) return this._map.get(Class)!.call(this, value);
        return this.defaultObject(value);
      }
      case "undefined":
        return "DEFAULT";
      default:
        //function、symbol
        let type = typeof value;
        throw new Error("不支持 " + type + " 类型");
    }
  }
  /**
   * @deprecated 已废弃
   * 获取值对应的 SqlValueEncoder
   */
  getObjectType(value: object): SqlValueEncoder {
    for (const Class of this._map.keys()) {
      if (value instanceof Class) return this._map.get(Class)!;
    }
    return this.defaultObject;
  }
  /** 获取值对应已定义的类 */
  getClassType(value: object): undefined | (new (...args: unknown[]) => unknown) {
    for (const Class of this._map.keys()) {
      if (value instanceof Class) return Class;
    }
  }
  protected defaultObject(value: object): string {
    return SqlValuesCreator.string(JSON.stringify(value));
  }

  /**
   * 将对象列表转为 SQL 的 VALUES。
   * @example 返回示例： " (...),(...) "
   * @param keys - 选择的键。如果指定了 keys, 值为 undefined 的属性将自动填充为 null; 如果未指定 keys，将选择 objectList 所有不是 undefined 项的键的并集
   * @param keepUndefinedKey - 是否保留 undefined 的键。默认值为 false，如果为 true , 数组的某一个字段均为 undefined时，将忽略字段,
   */
  objectListToValuesList<T extends object>(
    objectList: T[],
    keys?: readonly (keyof T)[] | { [key in keyof T]?: string | undefined | ColumnToValueConfig },
    keepUndefinedKey?: boolean
  ): string;
  objectListToValuesList(
    objectList: Record<string | number | symbol, any>[],
    keys_types?: readonly (string | number | symbol)[] | Record<string, string | undefined | ColumnToValueConfig>,
    keepUndefinedKey?: boolean
  ): string {
    if (objectList.length <= 0) throw new Error("objectList 不能是空数组");
    let keys: string[];
    let asserts: (ColumnToValueConfig | undefined)[];
    if (!keys_types) {
      keys = Array.from(getObjectListKeys(objectList, keepUndefinedKey));
      asserts = [];
    } else if (keys_types instanceof Array) {
      keys = keys_types as string[];
      asserts = [];
    } else {
      keys = Object.keys(keys_types);
      asserts = initColumnAssert(keys, keys_types);
    }
    let str = "(" + this._internalObjectToValues(objectList[0], keys, asserts) + ")";
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
          rows[j] = this.toSqlStr(value, asserts[j]?.assertJsType);
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
    keys?: readonly (keyof T)[] | { [key in keyof T]?: string | undefined | ColumnToValueConfig }
  ): string;
  objectToValues(
    object: Record<string | number, any>,
    keys_types: readonly string[] | Record<string, string | undefined> | undefined
  ): string {
    let type: (ColumnToValueConfig | undefined)[];
    let keys: readonly string[];

    if (keys_types instanceof Array) {
      keys = keys_types;
      type = [];
    } else if (keys_types) {
      keys = Object.keys(keys_types);
      type = initColumnAssert(keys, keys_types);
    } else {
      keys = Object.keys(object);
      type = [];
    }
    return this._internalObjectToValues(object, keys, type);
  }
  private _internalObjectToValues(
    object: Record<string, any>,
    keys: readonly string[],
    type: (ColumnToValueConfig | undefined)[]
  ) {
    const values: string[] = [];
    let i = 0;
    let key: string;
    let value: any;
    let assertType: ColumnToValueConfig | undefined;
    try {
      for (; i < keys.length; i++) {
        key = keys[i];
        value = object[key];
        assertType = type[i];
        if (assertType) {
          values[i] = this.toSqlStr(value, assertType.assertJsType);
          if (assertType.sqlType) values[i] += "::" + assertType.sqlType;
        } else values[i] = this.toSqlStr(value);
      }
    } catch (error) {
      let message = error instanceof Error ? error.message : String(error);
      throw new Error("字段 '" + key! + "' 异常，" + message);
    }
    if (values.length === 0) throw new Error("object 不能为空");
    return values.join(",");
  }
  /**
   * 将数组列表转为 SQL 的一个 value
   * @example
   * ```ts
   *  v.toValues([1, "abc", null, undefined, { key: "value" }]) // `1,'abc',NULL,DEFAULT,'{"key":"value"}'`
   * ```
   */
  toValues(values: readonly any[]): string {
    if (values.length === 0) throw new Error("values 不能为空");
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
    valuesTypes: Record<string, string | { sqlType: string; sqlDefault?: string; assertJsType?: AssertJsType }>
  ): SqlStatementDataset<T>;
  createValues(
    asName: string,
    values: Record<string, any>[],
    valuesTypes: Record<string, string | { sqlType: string; sqlDefault?: string; assertJsType?: AssertJsType }>
  ): SqlStatementDataset<any> {
    if (values.length === 0) throw new Error("values 不能为空");
    const insertKeys: string[] = Object.keys(valuesTypes);
    const defaultValues: string[] = [];
    const asserts = new Array(insertKeys.length);

    const valuesStr: string[] = new Array(values.length);
    {
      const column0: string[] = new Array(insertKeys.length);
      let columnName: string;
      let item: (typeof valuesTypes)[string];
      let sqlType: string;
      let assertJsType: AssertJsType | undefined;
      let value: any;
      for (let i = 0; i < insertKeys.length; i++) {
        columnName = insertKeys[i];
        item = valuesTypes[columnName];
        if (typeof item === "string") {
          sqlType = item;
          defaultValues[i] = "NULL";
        } else {
          sqlType = item.sqlType;
          assertJsType = item.assertJsType;
          asserts[i] = assertJsType;
          defaultValues[i] = item.sqlDefault ?? "NULL";
        }
        value = values[0][columnName];
        if (value === undefined) column0[i] = defaultValues[i] + "::" + sqlType;
        else column0[i] = this.toSqlStr(value, assertJsType) + "::" + sqlType;
      }
      valuesStr[0] = "(" + column0.join(",") + ")";
    }

    let items: string[] = new Array(insertKeys.length);
    let value: any;
    for (let i = 1; i < values.length; i++) {
      for (let j = 0; j < insertKeys.length; j++) {
        value = values[i][insertKeys[j]];
        if (value === undefined) items[j] = defaultValues[j];
        else items[j] = this.toSqlStr(value, asserts[j]);
      }
      valuesStr[i] = "(" + items.join(",") + ")";
    }
    return new YourValuesAs(insertKeys, asName, valuesStr.join(",\n"));
  }
}
class YourValuesAs<T extends TableType> extends SqlStatementDataset<T> {
  constructor(columns: readonly string[], asName: string, valuesStr: string) {
    super();
    this.#asName = asName;
    this.#valuesStr = valuesStr;
    this.#sql = `(VALUES\n${this.#valuesStr})\nAS ${this.#asName}(${columns.join(",")})`;
  }
  #asName: string;
  #valuesStr: string;
  #sql: string;
  override toSelect(): string {
    return this.#sql;
  }
  genSql(): string {
    return this.#sql;
  }
}
/** @public */
export type ColumnToValueConfig = { sqlType?: string; assertJsType?: AssertJsType };

function initColumnAssert(
  keys: readonly string[],
  keys_types: Record<string, string | undefined | ColumnToValueConfig>
) {
  let key: string;
  let value: any;
  let type = new Array(keys.length);
  for (let i = 0; i < keys.length; i++) {
    key = keys[i];
    value = keys_types[key];
    if (typeof value === "string") {
      type[i] = { sqlType: value };
    } else {
      type[i] = value;
    }
  }
  return type;
}
class AssertError extends TypeError {
  constructor(assertType: string, actual: string) {
    super(`Assert ${assertType} type, Actual ${actual} type`);
  }
}
