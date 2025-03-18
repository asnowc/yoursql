import { DbTableQuery } from "@asla/yoursql";
declare module "@asla/yoursql" {
  export interface SqlStatementDataset<T> {
    inferResult(): T;
  }
}
declare function assertType<T>(type: T): { pass(): void };
declare function assertType<T>(type: any): { notPass(): void };

function select(table: DbTableQuery<{ a: number; c: string; b: bigint }>) {
  //@ts-expect-error: aaa 不在断言的返回类型中
  table.select<{ yi: number }>({ aaa: "aa" });

  assertType<{ yi: number }>(table.select<{ yi: number }>({ yi: "aa" }).inferResult()).pass();

  assertType<Record<string, any>>(table.select({ yi: "aa" }).inferResult()).pass();
  assertType<Record<string, any>>(table.select("id").inferResult()).pass();
  assertType<Record<string, any>>(table.select({ a: true, c: true }).inferResult()).pass();
}
