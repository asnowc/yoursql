import { ColumnMeta, CustomDbType } from "./infer_db_type.ts";

/** @public */
export class TypeChecker<T> {
  constructor(private map: Map<string, ColumnMeta<any>>) {}
  check(value: { [key: string]: any }): T {
    const map = this.map;

    let v: any;
    for (const [k, expect] of map) {
      v = value[k];
      let err: string | undefined;
      if (v === null) {
        if (expect.notNull) throw new Error(`${k} 不能为空`);
        continue;
      } else if (v === undefined) {
        if (expect.defaultSqlValue === undefined && expect.notNull) throw new Error(`${k} 不能为 undefined`);
        continue;
      } else if (expect.isArray) {
        if (v instanceof Array) err = this.checkArray(v, expect.type);
        else err = getErrStr(`Array<${expect.type.name}>`, typeof v);
      } else {
        err = this.checkItem(v, expect.type);
      }
      if (err) throw new Error(`Key ${k} error: ${err}`);
    }
    return value as T;
  }
  checkList(value: any[]): T[] {
    let i = 0;
    try {
      for (let i = 0; i < value.length; i++) {
        this.check(value[i]);
      }
      return value;
    } catch (error) {
      throw new Error(`Item ${i}, ${(error as Error).message}`);
    }
  }
  private checkArray(v: any[], expect: Constructor | CustomDbType<any>) {
    let err: string | undefined;
    for (let i = 0; i < v.length; i++) {
      err = this.checkItem(v[i], expect);
      if (err) return `Item[${i}] ${err}`;
    }
  }
  private checkItem(v: any, expect: Constructor | CustomDbType<any>) {
    if (expect instanceof CustomDbType) {
      if (expect.is(v)) return;
    } else {
      if (v instanceof expect) return;
    }
    let actName: string = typeof v;
    if (actName === "object") {
      if (v === null) actName = "null";
      else actName = v.constructor?.name ?? "object";
    }
    return getErrStr(expect.name, typeof v);
  }
}

function getErrStr(expect: string, actual: string) {
  return `Expect ${expect}, Actual ${actual}`;
}

type Constructor<T = any> = new (...args: any[]) => T;
