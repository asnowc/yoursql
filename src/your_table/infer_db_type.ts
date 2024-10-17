/**
 * 表格列的信息
 * @public
 */
export class ColumnMeta<T> {
  constructor(
    readonly type: CustomDbType<T> | (new (...args: any[]) => T),
    /** 数据库原始数据类型 */
    readonly sqlType: string,
    /** 是否非空 */
    readonly notNull: boolean = false,
    /** 是否是数组类型 */
    readonly isArray: boolean = false,
    /** 数据库原始默认值 */
    readonly sqlDefault?: string
  ) {}
  /** 校验 value 的类型 */
  checkValue(value: any) {
    if (typeof this.type === "function") return value instanceof this.type;
    return this.type.is(value);
  }
}

/**
 * 数据库类型到JS类型的映射
 * @public
 */
export class YourTypeMap<M extends TypeMapDefined> {
  static create<T extends TypeMapDefined>(
    rawTypeMap?: T
  ): YourTypeMap<{
    [key in keyof T]: InferTypeMapDefined<T[key]>;
  }> {
    return new this<any>(rawTypeMap);
  }
  constructor(private readonly typeMap: M = {} as M) {}
  genColumn<T extends keyof M>(type: T, noNull: true, defaultValue?: string): ColumnMeta<M[T]>;
  genColumn<T extends keyof M>(type: T, noNull?: boolean, defaultValue?: string): ColumnMeta<M[T] | null>;
  genColumn<T>(type: keyof M, noNull: true, defaultValue?: string): ColumnMeta<T>;
  genColumn<T>(type: keyof M, noNull?: boolean, defaultValue?: string): ColumnMeta<T | null>;
  genColumn(type: string, notNull?: boolean, defaultValue?: string): ColumnMeta<any | null> {
    const constructor = Reflect.get(this.typeMap, type);
    const column = new ColumnMeta(constructor, type, notNull, false, defaultValue);
    return column;
  }
  genArrColumn<T extends keyof M>(type: T, noNull: true, defaultValue?: string): ColumnMeta<M[T][]>;
  genArrColumn<T extends keyof M>(type: T, noNull?: boolean, defaultValue?: string): ColumnMeta<M[T][] | null>;
  genArrColumn<T>(type: keyof M, notNull: true, defaultValue?: string): ColumnMeta<T[]>;
  genArrColumn<T>(type: keyof M, notNull?: boolean, defaultValue?: string): ColumnMeta<T[] | null>;
  genArrColumn(type: string, notNull?: boolean, defaultValue?: string): ColumnMeta<any> {
    const constructor = Reflect.get(this.typeMap, type);
    const column = new ColumnMeta(constructor, type + "[]", notNull, true, defaultValue);
    return column;
  }
}
type Constructor<T = any> = new (...args: any[]) => T;

function baseType<T>(this: CustomDbType<T>, v: any) {
  return typeof v === this.name;
}

/**
 * 自定义数据类型
 * @public
 */
export class CustomDbType<T> {
  static readonly bigint = new CustomDbType<bigint>(baseType, "bigint");
  static readonly number = new CustomDbType<number>(baseType, "number");
  static readonly string = new CustomDbType<string>(baseType, "string");
  static readonly boolean = new CustomDbType<boolean>(baseType, "boolean");
  constructor(readonly is: (this: CustomDbType<T>, value: any) => boolean, readonly name: string) {}
}
type TypeMapDefined = {
  [key: string]: Constructor | CustomDbType<any>;
};

type InferTypeMapDefined<T> = T extends Constructor<infer P> ? TRaw<P> : T extends CustomDbType<infer Q> ? Q : never;

type TRaw<T> = T extends Number
  ? number
  : T extends BigInt
  ? bigint
  : T extends String
  ? string
  : T extends Boolean
  ? boolean
  : T;

/** @public */
export type TableDefined = {
  [key: string]: ColumnMeta<any>;
};
/** @public */
export type InferTableDefined<T extends TableDefined> = {
  [key in keyof T]: T[key] extends ColumnMeta<infer P> ? P : unknown;
};
