## API Report File for "@asla/yoursql"

> Do not edit this file. It is a report generated by [API Extractor](https://api-extractor.com/).

```ts

// @public
export class ColumnMeta<T> {
    constructor(type: CustomDbType<T> | (new (...args: any[]) => T),
    sqlType: string,
    notNull?: boolean,
    isArray?: boolean,
    sqlDefault?: string | undefined);
    checkValue(value: any): boolean;
    readonly isArray: boolean;
    readonly notNull: boolean;
    readonly sqlDefault?: string | undefined;
    readonly sqlType: string;
    // (undocumented)
    readonly type: CustomDbType<T> | (new (...args: any[]) => T);
}

// @public
export type ColumnsSelectAs<T extends TableType> = {
    [key in keyof T]?: boolean | string;
};

// @public
export type ColumnsSelected<T extends TableType> = ColumnsSelectAs<T> | "*";

// Warning: (ae-forgotten-export) The symbol "AddTableFn" needs to be exported by the entry point index.d.ts
//
// @public (undocumented)
export const createSelect: AddTableFn<{}>;

// @public
export class CustomDbType<T> {
    constructor(is: (this: CustomDbType<T>, value: any) => boolean, name: string);
    // (undocumented)
    static readonly bigint: CustomDbType<bigint>;
    // (undocumented)
    static readonly boolean: CustomDbType<boolean>;
    // (undocumented)
    readonly is: (this: CustomDbType<T>, value: any) => boolean;
    // (undocumented)
    readonly name: string;
    // (undocumented)
    static readonly number: CustomDbType<number>;
    // (undocumented)
    static readonly string: CustomDbType<string>;
}

// @public
export class DbTable<T extends TableType> extends SqlSelectable<T> {
    constructor(name: string, columns: readonly (keyof T)[]);
    // (undocumented)
    readonly name: string;
    // (undocumented)
    toSelect(): string;
    // (undocumented)
    toString(): string;
}

// @public (undocumented)
export class DbTableQuery<T extends TableType = Record<string, any>, C extends TableType = Partial<T>> extends DbTable<T> {
    constructor(name: string, columns: readonly string[], statement: SqlValuesCreator);
    // (undocumented)
    delete(option?: DeleteOption): string;
    // (undocumented)
    deleteWithResult<R extends ColumnsSelected<T>>(returns?: ColumnsSelected<T> | "*", option?: DeleteOption): SqlQueryStatement<SelectColumns<T, R>>;
    // (undocumented)
    insert(values: C[] | SqlQueryStatement<C>, option?: InsertOption<T>): string;
    // (undocumented)
    insertWithResult<R extends ColumnsSelected<T>>(values: C[] | SqlQueryStatement<C>, returns: R, option?: InsertOption<T>): SqlQueryStatement<SelectColumns<T, R>>;
    select(columns?: undefined, option?: SelectTableOption): Select<{}>;
    select(columns: "*", option?: SelectTableOption): Select<T>;
    select<R extends ColumnsSelectAs<T>>(columns: R, option?: SelectTableOption): Select<SelectColumns<T, R>>;
    // (undocumented)
    update(values: UpdateRowValue<T>, option?: UpdateOption): string;
    // (undocumented)
    updateWithResult<R extends ColumnsSelected<T>>(values: UpdateRowValue<T>, returns: R, option?: UpdateOption): SqlQueryStatement<SelectColumns<T, R>>;
}

// @public (undocumented)
export interface DeleteOption {
    // (undocumented)
    where?: string;
}

// @public (undocumented)
export interface FinalSelect<T extends TableType> extends SqlSelectable<T> {
    // (undocumented)
    toQuery(option?: SelectFilterOption<T & {
        [key: string]: OrderValue;
    }>): SqlQueryStatement<T>;
}

// @public (undocumented)
export function getObjectListKeys(objectList: any[], keepUndefinedKey?: boolean): string[];

// @public
export type InferQueryResult<T> = T extends SqlSelectable<infer P> ? (P extends TableType ? P : never) : never;

// @public (undocumented)
export type InferTableDefined<T extends TableDefined> = {
    [key in keyof T]: T[key] extends ColumnMeta<infer P> ? P : unknown;
};

// @public (undocumented)
export interface InsertOption<T extends object> {
    // (undocumented)
    conflict?: (keyof T)[];
    // (undocumented)
    updateValues?: {
        [key in keyof T]?: undefined | SqlRaw | T[key];
    };
    // (undocumented)
    where?: string;
}

// @public (undocumented)
export interface JoinSelect<T extends TableType> extends FinalSelect<T> {
    // (undocumented)
    addColumns<A extends TableType>(add: {
        [key in keyof A]: string;
    }): FinalSelect<T & A>;
    // Warning: (ae-forgotten-export) The symbol "JoinTableFn" needs to be exported by the entry point index.d.ts
    //
    // (undocumented)
    crossJoin: JoinTableFn<T>;
    // (undocumented)
    fullJoin: JoinTableFn<T, {
        on: string;
    }>;
    // (undocumented)
    innerJoin: JoinTableFn<T, {
        on: string;
    }>;
    // (undocumented)
    leftJoin: JoinTableFn<T, {
        on: string;
    }>;
    // (undocumented)
    naturalJoin: JoinTableFn<T>;
    // (undocumented)
    rightJoin: JoinTableFn<T, {
        on: string;
    }>;
}

// @public (undocumented)
export type JsObjectMapSql = Map<new (...args: any[]) => any, SqlValueEncoder>;

// @public (undocumented)
export type ManualType = "bigint" | "number" | "string" | "boolean" | "object" | (new (...args: any[]) => any);

// @public (undocumented)
export type OrderValue = "ASC" | "DESC";

// @public
export const pgSqlTransformer: JsObjectMapSql;

// @public (undocumented)
export type PickColumn<T extends {
    [key: string]: any;
}, Rq extends keyof T = keyof T, Pa extends Exclude<keyof T, Rq> = never> = {
    [key in Rq as null extends T[key] ? key : never]?: T[key];
} & {
    [key in Rq as null extends T[key] ? never : key]: T[key];
} & {
    [key in Pa]?: T[key];
};

// @public
export type RowsOrder<T extends object> = {
    [key in keyof T]?: OrderValue;
};

// @public (undocumented)
export interface Select<T extends TableType> extends JoinSelect<T> {
    select: AddTableFn<T>;
}

// Warning: (ae-forgotten-export) The symbol "StringOnly" needs to be exported by the entry point index.d.ts
//
// @public
export type SelectColumns<T extends TableType, R extends ColumnsSelected<T>> = R extends "*" ? T : R extends ColumnsSelectAs<T> ? {
    [key in keyof T as R[key] extends true ? key : StringOnly<R[key]>]: T[key];
} : never;

// @public (undocumented)
export interface SelectFilterOption<T extends object> {
    // (undocumented)
    limit?: number;
    // (undocumented)
    offset?: number;
    // (undocumented)
    orderBy?: RowsOrder<T>;
    // (undocumented)
    orderNullRule?: "FIRST" | "LAST";
    // (undocumented)
    where?: string;
}

// @public (undocumented)
export interface SelectTableOption {
    // (undocumented)
    tableAs?: string;
}

// @public
export class SqlQueryStatement<T extends TableType = TableType> extends SqlSelectable<T> {
    constructor(sql: string, columns: readonly string[]);
    // (undocumented)
    toSelect(): string;
    // (undocumented)
    toString(): string;
}

// @public
export class SqlRaw<T = any> {
    constructor(value: string);
    // (undocumented)
    toString(): string;
}

// @public
export abstract class SqlSelectable<T extends TableType> {
    constructor(columns: ArrayLike<string> | Iterable<string>);
    readonly columns: readonly string[];
    abstract toSelect(): string;
    abstract toString(): string;
}

// @public (undocumented)
export type SqlValueEncoder<T = any> = (this: SqlValuesCreator, value: T) => string;

// @public (undocumented)
export interface SqlValueFn {
    (value: any, expectType?: ManualType): string;
}

// @public
export class SqlValuesCreator {
    constructor(map?: JsObjectMapSql);
    // (undocumented)
    static create(map?: JsObjectMapSql): SqlValuesCreator & SqlValueFn;
    createValues<T extends {}>(asName: string, values: T[], valuesTypes: Record<string, string | {
        sqlType: string;
        sqlDefault?: string;
    }>): SqlSelectable<T>;
    // (undocumented)
    protected defaultObject(value: object): string;
    getObjectType(value: object): SqlValueEncoder;
    objectListToValuesList<T extends object>(objectList: T[], keys?: readonly (keyof T)[] | {
        [key in keyof T]?: string | undefined;
    }, keepUndefinedKey?: boolean): string;
    objectToValues<T extends object>(object: T, keys?: readonly (keyof T)[] | {
        [key in keyof T]?: string | undefined;
    }): string;
    setTransformer<T>(type: new (...args: any[]) => T, transformer?: SqlValueEncoder): void;
    static string(value: string): string;
    toSqlStr(value: any, expectType?: ManualType): string;
    toValues(values: readonly any[]): string;
}

// @public (undocumented)
export type TableDefined = {
    [key: string]: ColumnMeta<any>;
};

// @public (undocumented)
export type TableType = {
    [key: string]: any;
};

// @public (undocumented)
export class TypeChecker<T> {
    constructor(map: Map<string, ColumnMeta<any>>);
    // (undocumented)
    check(value: {
        [key: string]: any;
    }): T;
    // (undocumented)
    checkList(value: any[]): T[];
}

// @public (undocumented)
export interface UpdateOption {
    // (undocumented)
    where?: string;
}

// @public (undocumented)
export type UpdateRowValue<T extends object> = {
    [key in keyof T]?: T[key] | SqlRaw;
};

// @public
export class YourTable<T extends TableType = TableType, C extends TableType = T> extends DbTableQuery<T, C> {
    constructor(name: string, define: TableDefined, sqlValue: SqlValuesCreator);
    // (undocumented)
    createTypeChecker<T>(keys: readonly string[]): TypeChecker<T>;
    // (undocumented)
    getColumnMeta(name: keyof T): ColumnMeta<unknown>;
}

// Warning: (ae-forgotten-export) The symbol "TypeMapDefined" needs to be exported by the entry point index.d.ts
//
// @public
export class YourTypeMap<M extends TypeMapDefined> {
    constructor(typeMap?: M);
    // Warning: (ae-forgotten-export) The symbol "InferTypeMapDefined" needs to be exported by the entry point index.d.ts
    //
    // (undocumented)
    static create<T extends TypeMapDefined>(rawTypeMap?: T): YourTypeMap<{
        [key in keyof T]: InferTypeMapDefined<T[key]>;
    }>;
    // (undocumented)
    genArrColumn<T extends keyof M>(type: T, noNull: true, defaultValue?: string): ColumnMeta<M[T][]>;
    // (undocumented)
    genArrColumn<T extends keyof M>(type: T, noNull?: boolean, defaultValue?: string): ColumnMeta<M[T][] | null>;
    // (undocumented)
    genArrColumn<T>(type: keyof M, notNull: true, defaultValue?: string): ColumnMeta<T[]>;
    // (undocumented)
    genArrColumn<T>(type: keyof M, notNull?: boolean, defaultValue?: string): ColumnMeta<T[] | null>;
    // (undocumented)
    genColumn<T extends keyof M>(type: T, noNull: true, defaultValue?: string): ColumnMeta<M[T]>;
    // (undocumented)
    genColumn<T extends keyof M>(type: T, noNull?: boolean, defaultValue?: string): ColumnMeta<M[T] | null>;
    // (undocumented)
    genColumn<T>(type: keyof M, noNull: true, defaultValue?: string): ColumnMeta<T>;
    // (undocumented)
    genColumn<T>(type: keyof M, noNull?: boolean, defaultValue?: string): ColumnMeta<T | null>;
}

// (No @packageDocumentation comment for this package)

```
