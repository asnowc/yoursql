import { SqlTemplate } from "../SqlStatement.ts";
import { getObjectListKeys } from "../_statement.ts";
import { ValueSqlTemplate } from "./ValueSqlTemplate.ts";
import { AssertJsType, ColumnToValueConfig, ObjectToValueKeys } from "./type.ts";

/** @public js 对象到编码函数的映射*/
export type JsObjectMapSql = Map<new (...args: any[]) => any, SqlValueEncoder>;
/** @public 将 js 值转为 SQl 字符串的函数*/
export type SqlValueEncoder<T = any> = (this: SqlValuesCreator, value: T) => string;
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

  /** @alpha */
  gen(split: TemplateStringsArray, ...values: any[]): SqlTemplate {
    let sql = split[0];
    for (let i = 0; i < values.length; i++) {
      sql += this.toSqlStr(values[i]);
      sql += split[i + 1];
    }
    return new ValueSqlTemplate(this.toSqlStr.bind(this), split, values);
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
   * 将对象列表转为 SQL 的 VALUES。如果 objectList 中有某个对象的属性值为 undefined，则会被转换为 "DEFAULT"
   * @example 返回的文本示例： " (...),(...) "
   * @param columns - 选择的键。如果指定了 columns, 值为 undefined 的属性将自动填充为 null; 如果未指定 columns，将选择 objectList 所有不是 undefined 项的键的并集
   */
  createImplicitValues<T extends object>(objectList: T, columns?: ObjectToValueKeys<T>): SqlValuesTextData;
  createImplicitValues<T extends object>(objectList: T[], columns?: ObjectToValueKeys<T>): SqlValuesTextData;
  createImplicitValues(objectList: object[] | object, columns?: ObjectToValueKeys<any>): SqlValuesTextData {
    let res: SqlExplicitValuesStatement;
    if (objectList instanceof Array) {
      res = this._objectListToValues(objectList, columns, { undefinedDefault: "DEFAULT" });
    } else {
      res = this._objectToValue(
        objectList,
        columns as readonly string[] | Record<string, string | undefined> | undefined,
        { undefinedDefault: "DEFAULT" },
      );
    }
    return { columns: [...res.columns], text: res.text };
  }
  /**
   * 将对象列表转为 SQL 的 VALUES。如果 objectList 中有某个对象的属性值为 undefined，则会被转换为 "NULL"
   * @example 返回的文本示例： " (...),(...) "
   * @param columns - 选择的键。
   */
  createExplicitValues<T extends object>(objectList: T, columns?: ObjectToValueKeys<T>): SqlExplicitValuesStatement;
  createExplicitValues<T extends object>(objectList: T[], columns?: ObjectToValueKeys<T>): SqlExplicitValuesStatement;
  createExplicitValues(objectList: object[] | object, columns?: ObjectToValueKeys<any>): SqlExplicitValuesStatement {
    if (objectList instanceof Array) {
      return this._objectListToValues(objectList, columns, { undefinedDefault: "NULL" });
    } else {
      return this._objectToValue(
        objectList,
        columns as readonly string[] | Record<string, string | undefined> | undefined,
        { undefinedDefault: "NULL" },
      );
    }
  }
  private _objectListToValues(
    objectList: readonly Record<string, any>[],
    columns?: ObjectToValueKeys<any>,
    option?: ObjectToValueOption,
  ): SqlExplicitValuesStatement;
  private _objectListToValues(
    objectList: readonly Record<string, any>[],
    columns?: ObjectToValueKeys<Record<string, any>>,
    option: ObjectToValueOption = {},
  ): SqlExplicitValuesStatement {
    if (objectList.length <= 0) throw new Error("objectList 不能是空数组");
    let keys: string[];
    let asserts: (ColumnToValueConfig | undefined)[];
    if (!columns) {
      keys = Array.from(getObjectListKeys(objectList));
      asserts = [];
    } else if (columns instanceof Array) {
      keys = [...(columns as readonly string[])];
      asserts = [];
    } else {
      keys = Object.keys(columns);
      asserts = initColumnAssert(keys, columns);
    }
    const undefinedDefault = option.undefinedDefault || "DEFAULT";
    let str = "(" + this._internalObjectToValues(objectList[0], keys, asserts, undefinedDefault) + ")";
    let i = 1;
    let j: number;
    let value: any;
    let rows: string[];
    let assert: ColumnToValueConfig | undefined;
    try {
      for (; i < objectList.length; i++) {
        const object = objectList[i];
        rows = [];
        j = 0;
        for (; j < keys.length; j++) {
          value = object[keys[j]];
          assert = asserts[j];
          rows[j] =
            value === undefined ? assert?.sqlDefault || undefinedDefault : this.toSqlStr(value, assert?.assertJsType);
        }
        str += ",\n(" + rows.join(",") + ")";
      }
    } catch (error) {
      let message = error instanceof Error ? error.message : String(error);
      throw new Error("第 " + i + " 项，字段 '" + (keys[j!] as string) + "' 异常，" + message);
    }

    return new SqlExplicitValuesStatement(keys, str);
  }
  private _objectToValue(
    object: Record<string, any>,
    keys_types: readonly string[] | Record<string, string | undefined> | undefined,
    option: ObjectToValueOption = {},
  ): SqlExplicitValuesStatement {
    const { keys, type } = this._getObjectValueInfo(object, keys_types);
    const undefinedDefault = option.undefinedDefault || "DEFAULT";
    const text = this._internalObjectToValues(object, keys, type, undefinedDefault);
    return new SqlExplicitValuesStatement(keys, `(${text})`);
  }

  private _getObjectValueInfo(
    object: Record<string | number, any>,
    keys_types: readonly string[] | Record<string, string | undefined> | undefined,
  ) {
    let type: (ColumnToValueConfig | undefined)[];
    let keys: string[];

    if (keys_types instanceof Array) {
      keys = [...keys_types];
      type = [];
    } else if (keys_types) {
      keys = Object.keys(keys_types);
      type = initColumnAssert(keys, keys_types);
    } else {
      keys = Object.keys(object).filter((k) => object[k] !== undefined);
      type = [];
    }
    return { keys, type };
  }
  private _internalObjectToValues(
    object: Record<string, any>,
    keys: readonly string[],
    type: (ColumnToValueConfig | undefined)[],
    undefinedDefault: string,
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
          values[i] =
            value === undefined
              ? assertType.sqlDefault || undefinedDefault
              : this.toSqlStr(value, assertType.assertJsType);
          if (assertType.sqlType) values[i] += "::" + assertType.sqlType;
        } else values[i] = value === undefined ? undefinedDefault : this.toSqlStr(value);
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
}
type ObjectToValueOption = {
  undefinedDefault?: string;
};
class AssertError extends TypeError {
  constructor(assertType: string, actual: string) {
    super(`Assert ${assertType} type, Actual ${actual} type`);
  }
}
function initColumnAssert(
  keys: readonly string[],
  keys_types: Record<string, string | undefined | ColumnToValueConfig>,
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
/** @public */
export type SqlValuesTextData = {
  columns: string[];
  text: string;
};

/** @public */
export class SqlExplicitValuesStatement {
  constructor(
    public columns: readonly string[],
    public readonly text: string,
  ) {}
  toSelect(name: string): string {
    return `(VALUES\n${this.text})\nAS ${name}(${this.columns.join(",")})`;
  }
}
