import { getObjectListKeys } from "../_statement.ts";
import { AssertJsType, ColumnToValueConfig, ObjectToValueKeys } from "./type.ts";
interface ValueToSqlStr {
  toSqlStr(value: any, assertType?: AssertJsType): string;
}
export function internalObjectToValues(
  object: Record<string, any>,
  keys: readonly string[],
  type: (ColumnToValueConfig | undefined)[],
  undefinedDefault: string,
  v: ValueToSqlStr,
) {
  const values: string[] = new Array(keys.length);
  const types: string[] = new Array(keys.length);
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
          value === undefined ? assertType.sqlDefault || undefinedDefault : v.toSqlStr(value, assertType.assertJsType);
        if (assertType.sqlType) {
          types[i] = assertType.sqlType;
        }
      } else {
        values[i] = value === undefined ? undefinedDefault : v.toSqlStr(value);
      }
    }
  } catch (error) {
    let message = error instanceof Error ? error.message : String(error);
    throw new Error("字段 '" + key! + "' 异常，" + message);
  }
  if (values.length === 0) throw new Error("object 不能为空");
  return { values, types };
}

export type ObjectToValueOption = {
  undefinedDefault?: string;
};
export class AssertError extends TypeError {
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

export function getObjectValueInfo(
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

export function getColumnInfo(
  objectList: readonly Record<string, any>[],
  columns?: ObjectToValueKeys<Record<string, any>>,
) {
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
  return { keys, asserts };
}
