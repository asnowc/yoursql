import { TemplateSqlStatement } from "./ValueSqlTemplate.ts";
import {
  AssertError,
  getColumnInfo,
  getObjectValueInfo,
  internalObjectToValues,
  ObjectToValueOption,
} from "./_to_values.ts";
import { AssertJsType, ColumnToValueConfig, ObjectToValueKeys } from "./type.ts";
export { TemplateSqlStatement as ValueSqlTemplate } from "./ValueSqlTemplate.ts";

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
  gen(split: TemplateStringsArray, ...values: any[]): TemplateSqlStatement {
    let sql = split[0];
    for (let i = 0; i < values.length; i++) {
      sql += this.toSqlStr(values[i]);
      sql += split[i + 1];
    }
    return new TemplateSqlStatement(this.toSqlStr.bind(this), split, values);
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
  createImplicitValues<T extends object>(objectList: T, columns?: ObjectToValueKeys<T>): SqlValuesDataset;
  createImplicitValues<T extends object>(objectList: T[], columns?: ObjectToValueKeys<T>): SqlValuesDataset;
  createImplicitValues(objectList: object[] | object, columns?: ObjectToValueKeys<any>): SqlValuesDataset {
    let res: SqlValuesDataset;
    if (objectList instanceof Array) {
      res = this._objectListToValues(objectList, columns, { undefinedDefault: "DEFAULT" });
    } else {
      res = this._objectToValue(
        objectList,
        columns as readonly string[] | Record<string, string | undefined> | undefined,
        { undefinedDefault: "DEFAULT" },
      );
    }
    return res;
  }
  /**
   * 将对象列表转为 SQL 的 VALUES。如果 objectList 中有某个对象的属性值为 undefined，则会被转换为 "NULL"
   * @example 返回的文本示例： " (...),(...) "
   * @param columns - 选择的键。
   */
  createExplicitValues<T extends object>(objectList: T, columns?: ObjectToValueKeys<T>): SqlValuesDataset;
  createExplicitValues<T extends object>(objectList: T[], columns?: ObjectToValueKeys<T>): SqlValuesDataset;
  createExplicitValues(objectList: object[] | object, columns?: ObjectToValueKeys<any>): SqlValuesDataset {
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
  ): SqlValuesDataset;
  private _objectListToValues(
    objectList: readonly Record<string, any>[],
    columns?: ObjectToValueKeys<Record<string, any>>,
    option: ObjectToValueOption = {},
  ): SqlValuesDataset {
    if (objectList.length <= 0) throw new Error("objectList 不能是空数组");
    const { keys, asserts } = getColumnInfo(objectList, columns);

    const undefinedDefault = option.undefinedDefault || "DEFAULT";
    let firstRow = internalObjectToValues(objectList[0], keys, asserts, undefinedDefault, this);
    let j: number;
    let value: any;
    const rows: string[] = new Array(objectList.length - 1);
    let assert: ColumnToValueConfig | undefined;
    let i = 1;
    try {
      for (; i < objectList.length; i++) {
        const object = objectList[i];
        const columns = [];
        j = 0;
        for (; j < keys.length; j++) {
          value = object[keys[j]];
          assert = asserts[j];
          columns[j] =
            value === undefined ? assert?.sqlDefault || undefinedDefault : this.toSqlStr(value, assert?.assertJsType);
        }
        rows[i - 1] = "(" + columns.join(",") + ")";
      }
    } catch (error) {
      let message = error instanceof Error ? error.message : String(error);
      throw new Error("第 " + i + " 项，字段 '" + (keys[j!] as string) + "' 异常，" + message);
    }

    return new SqlValuesDataset(keys, firstRow.types, firstRow.values, rows);
  }
  private _objectToValue(
    object: Record<string, any>,
    keys_types: readonly string[] | Record<string, string | undefined> | undefined,
    option: ObjectToValueOption = {},
  ): SqlValuesDataset {
    const { keys, type } = getObjectValueInfo(object, keys_types);
    const undefinedDefault = option.undefinedDefault || "DEFAULT";
    const res = internalObjectToValues(object, keys, type, undefinedDefault, this);
    return new SqlValuesDataset(keys, res.types, res.values, []);
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

/** @public */
export class SqlValuesDataset {
  constructor(
    public columns: readonly string[],
    readonly columnsSqlType: readonly string[],
    firstValues: string[],
    nextRows: string[],
  ) {
    this.#firstValues = firstValues;
    this.#rows = nextRows;
  }
  #rows: string[];
  #firstValues: string[];
  #text?: string;
  get text(): string {
    if (!this.#text) {
      this.#text = this.#genText();
    }
    return this.#text;
  }
  #genText(): string {
    const { columnsSqlType } = this;
    const firstValues = this.#firstValues;
    let firstRow: string[] = new Array(firstValues.length);
    for (let i = 0; i < firstValues.length; i++) {
      firstRow[i] = firstValues[i];
      if (columnsSqlType[i]) firstRow[i] += "::" + columnsSqlType[i];
    }
    const base = "(" + firstRow.join(",") + ")";
    if (this.#rows.length === 0) {
      return base;
    }
    return "(" + firstRow.join(",") + "),\n" + this.#rows.join(",\n");
  }
  /**
   * @example
   * ```ts
   *  const t = v.createImplicitValues(
   *    [
   *      { id: 1, name: "name1" },
   *      { id: 2, name: "name2" },
   *    ],
   *    { id: "INT", name: "VARCHAR" },
   *  );
   *  // 返回 (VALUES (1::INT,'name1'::VARCHAR),(2,'name2')) AS t1(id,name)
   *  t.toSelect("t1(id,name)")
   * ```
   */
  toSelect(name: string): string {
    return `(VALUES\n${this.text})\nAS ${name}(${this.columns.join(",")})`;
  }
}
