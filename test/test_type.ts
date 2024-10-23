import { DbTableQuery } from "@asnc/yoursql";

declare const y: DbTableQuery<{ a: number; c: string; b: bigint }>;
y.select<{ yi: number }>({ yi: true }); // 应该报错, yi  不属于表 y 中的字段，不能使用 boolean
y.select<{ yi: number }>({ aaa: "aa" }); // 应该报错, aaa 不在断言的返回类型中
y.select({ aaa: true }); // 应该报错, aaa 不在断言的返回类型中 //TODO

y.select({ a: true, aaa: true }); // 应该报错, aaa 不在断言的返回类型中

let c = y.select({ a: true, cc: "c", count: "xxx" } as const);
let b = y.select<{ yi: number }>({ yi: "aa" });
