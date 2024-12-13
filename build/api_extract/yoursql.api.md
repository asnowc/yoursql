## API Report File for "@asla/yoursql"

> Do not edit this file. It is a report generated by [API Extractor](https://api-extractor.com/).

```ts

// @public
export type AssertJsType = "bigint" | "number" | "string" | "boolean" | "object" | (new (...args: any[]) => any);

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
export type ColumnsSelected<T extends TableType> = {
    [key in keyof T]?: boolean | string;
};

// @public (undocumented)
export type ColumnToValueConfig = {
    sqlType?: string;
    assertJsType?: AssertJsType;
};

// @public (undocumented)
export type ConditionParam = string | string[];

// @public (undocumented)
export type Constructable<T> = T | (() => T);

// @public (undocumented)
export interface CurrentGroupBy<T extends TableType> extends CurrentOrderBy<T> {
    // (undocumented)
    groupBy(columns: string | string[]): CurrentHaving<T>;
}

// @public (undocumented)
export interface CurrentHaving<T extends TableType> extends CurrentOrderBy<T> {
    // (undocumented)
    having(param: Constructable<ConditionParam | void>): CurrentLimit<T>;
}

// @public (undocumented)
export interface CurrentLimit<T extends TableType> extends SqlQueryStatement<T> {
    // (undocumented)
    limit(limit?: number | bigint, offset?: number | bigint): SqlQueryStatement<T>;
}

// @public (undocumented)
export type CurrentModifyWhere<T extends TableType = {}> = CurrentReturn<T> & {
    where(where: Constructable<ConditionParam | void>): CurrentReturn<T>;
};

// @public (undocumented)
export type CurrentOnConflict<T extends TableType = {}> = CurrentReturn<T> & {
    onConflict(option: Constructable<readonly (keyof T)[] | string>): CurrentOnConflictDo<T>;
};

// @public (undocumented)
export type CurrentOnConflictDo<T extends TableType = {}> = {
    doNotThing(): CurrentReturn<T>;
    doUpdate(set: Constructable<string | {
        [key in keyof T]?: string;
    }>): CurrentModifyWhere<T>;
    toString(): string;
};

// @public (undocumented)
export interface CurrentOrderBy<T extends TableType> extends CurrentLimit<T> {
    // (undocumented)
    orderBy(param: Constructable<OrderByParam | void>): CurrentLimit<T>;
}

// @public (undocumented)
export interface CurrentReturn<T extends TableType = {}> extends SqlQueryStatement<{}> {
    // (undocumented)
    returning(columns: "*"): SqlQueryStatement<T>;
    // (undocumented)
    returning(columns: Constructable<ColumnsSelected<T> | string>): SqlQueryStatement<Record<string, any>>;
    // (undocumented)
    returning<R extends TableType>(columns: Constructable<ColumnsSelected<R> | string>): SqlQueryStatement<R>;
}

// @public (undocumented)
export interface CurrentWhere<T extends TableType> extends CurrentGroupBy<T> {
    // (undocumented)
    where(param: Constructable<ConditionParam | void>): CurrentGroupBy<T>;
}

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
    constructor(name: string);
    // (undocumented)
    delete(option?: DeleteOption): CurrentModifyWhere<T>;
    // (undocumented)
    fromAs(as?: string): Selection_2;
    insert(columns: string, values: Constructable<string>): CurrentOnConflict<T>;
    // (undocumented)
    readonly name: string;
    select(columns: "*", as?: string): CurrentWhere<T>;
    select(columns: Constructable<Record<string, boolean | string> | string>, as?: string): CurrentWhere<Record<string, any>>;
    select<R extends {}>(columns: Constructable<{
        [key in keyof R]: boolean | string;
    } | string>, as?: string): CurrentWhere<R>;
    // (undocumented)
    toSelect(): string;
    // (undocumented)
    toString(): string;
    update(values: Constructable<{
        [key in keyof T]?: string;
    } | string>): CurrentModifyWhere<T>;
}

// @public (undocumented)
export class DbTableQuery<T extends TableType = Record<string, any>, C extends TableType = Partial<T>> extends DbTable<T> {
    constructor(name: string, statement: SqlValuesCreator);
    // (undocumented)
    insert(values: Constructable<UpdateRowValue<C> | UpdateRowValue<C>[]>): CurrentOnConflict<T>;
    // (undocumented)
    insert(columns: string, values: Constructable<string>): CurrentOnConflict<T>;
    updateFrom(values: Constructable<UpdateRowValue<T>>): CurrentModifyWhere<T>;
}

// @public (undocumented)
export interface DeleteOption {
    // (undocumented)
    where?: Constructable<ConditionParam | void>;
}

// @public
export function getObjectListKeys(objectList: any[], keepUndefinedKey?: boolean): Set<string>;

// @public
export function having(conditions?: Constructable<ConditionParam | void>, type?: "AND" | "OR"): string;

// @public
export type InferQueryResult<T> = T extends SqlSelectable<infer P> ? (P extends TableType ? P : never) : never;

// @public (undocumented)
export type InferTableDefined<T extends TableDefined> = {
    [key in keyof T]: T[key] extends ColumnMeta<infer P> ? P : unknown;
};

// @public
export type JsObjectMapSql = Map<new (...args: any[]) => any, SqlValueEncoder>;

// @public (undocumented)
export type OrderBehavior = {
    key: string;
    asc: boolean;
    nullLast?: boolean;
};

// @public
export function orderBy(by?: Constructable<OrderByParam | void>): string;

// @public (undocumented)
export type OrderByParam = string | (string | OrderBehavior)[] | Record<string, boolean | `${OrderValue} ${"NULLS FIRST" | "NULLS LAST"}`>;

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

// Warning: (ae-forgotten-export) The symbol "StringOnly" needs to be exported by the entry point index.d.ts
//
// @public
export type SelectColumns<T extends TableType, R extends ColumnsSelected<T>> = R extends {
    [key in keyof T]?: boolean | string;
} ? {
    [key in keyof T as R[key] extends true ? key : StringOnly<R[key]>]: T[key];
} : never;

// @public (undocumented)
export function selectColumns(columns: Constructable<SelectParam>): string;

// @public (undocumented)
class Selection_2 {
    constructor(selectable: Constructable<SqlSelectable<any> | string>, as?: string);
    // (undocumented)
    crossJoin(selectable: Constructable<SqlSelectable<any> | string>, as?: string | undefined): Selection_2;
    // (undocumented)
    static from(selectable: Constructable<SqlSelectable<any> | string>, as?: string): Selection_2;
    // (undocumented)
    from(selectable: Constructable<SqlSelectable<any> | string>, as?: string): Selection_2;
    // (undocumented)
    fullJoin(selectable: Constructable<SqlSelectable<any> | string>, as: string | undefined, on: Constructable<ConditionParam>): Selection_2;
    // (undocumented)
    innerJoin(selectable: Constructable<SqlSelectable<any> | string>, as: string | undefined, on: Constructable<ConditionParam>): Selection_2;
    // (undocumented)
    leftJoin(selectable: Constructable<SqlSelectable<any> | string>, as: string | undefined, on: Constructable<ConditionParam>): Selection_2;
    // (undocumented)
    naturalJoin(selectable: Constructable<SqlSelectable<any> | string>, as?: string | undefined): Selection_2;
    // (undocumented)
    rightJoin(selectable: Constructable<SqlSelectable<any> | string>, as: string | undefined, on: Constructable<ConditionParam>): Selection_2;
    select<T extends TableType = Record<string, any>>(columns: "*"): CurrentWhere<T>;
    select(columns: Constructable<SelectParam>): CurrentWhere<Record<string, any>>;
    select<T extends TableType>(columns: Constructable<{
        [key in keyof T]: string | boolean;
    } | string>): CurrentWhere<T>;
    // (undocumented)
    toString(): string;
}
export { Selection_2 as Selection }

// @public (undocumented)
export type SelectParam = string | Record<string, string | boolean>;

// @public
export class SqlQueryStatement<T extends TableType = TableType> extends SqlSelectable<T> {
    constructor(sql: string | SqlQueryStatement);
    // (undocumented)
    toSelect(): string;
    // (undocumented)
    toString(): string;
}

// @public
export class SqlRaw<T = any> extends String {
    protected [SQL_RAW]: T;
}

// @public
export abstract class SqlSelectable<T extends TableType> {
    protected [SQL_SELECTABLE]: T;
    abstract toSelect(): string;
    abstract toString(): string;
}

// @public
export type SqlValueEncoder<T = any> = (this: SqlValuesCreator, value: T) => string;

// @public (undocumented)
export type SqlValueFn = SqlValuesCreator & {
    (value: any, assertType?: AssertJsType): string;
};

// @public
export class SqlValuesCreator {
    constructor(map?: JsObjectMapSql);
    // (undocumented)
    static create(map?: JsObjectMapSql): SqlValueFn;
    createValues<T extends {}>(asName: string, values: T[], valuesTypes: Record<string, string | {
        sqlType: string;
        sqlDefault?: string;
        assertJsType?: AssertJsType;
    }>): SqlSelectable<T>;
    // (undocumented)
    protected defaultObject(value: object): string;
    getClassType(value: object): undefined | (new (...args: unknown[]) => unknown);
    // @deprecated (undocumented)
    getObjectType(value: object): SqlValueEncoder;
    objectListToValuesList<T extends object>(objectList: T[], keys?: readonly (keyof T)[] | {
        [key in keyof T]?: string | undefined | ColumnToValueConfig;
    }, keepUndefinedKey?: boolean): string;
    objectToValues<T extends object>(object: T, keys?: readonly (keyof T)[] | {
        [key in keyof T]?: string | undefined | ColumnToValueConfig;
    }): string;
    setTransformer(type: new (...args: any[]) => any, encoder?: SqlValueEncoder): void;
    // (undocumented)
    setTransformer(map: JsObjectMapSql): void;
    static string(value: string): string;
    toSqlStr(value: any, assertJsType?: AssertJsType): string;
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
export type UpdateRowValue<T extends object> = {
    [key in keyof T]?: T[key] | SqlRaw;
};

// @public
export const v: SqlValueFn;

// @public
export function where(conditions?: Constructable<ConditionParam | void>, type?: "AND" | "OR"): string;

// @public
export class YourTable<T extends TableType = TableType, C extends TableType = T> extends DbTableQuery<T, C> {
    constructor(name: string, define: TableDefined, sqlValue: SqlValuesCreator);
    // (undocumented)
    readonly columns: readonly string[];
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
