import { DbTableQuery } from "@asnc/yoursql";

//select 测试
declare const y: DbTableQuery<{ a: number; c: string; b: bigint }>;
//@ts-expect-error: aaa 不在断言的返回类型中
y.select<{ yi: number }>({ aaa: "aa" });

// let c = y.select({ a: true, cc: "c", count: "xxx" } as const);
let b = y.select<{ yi: number }>({ yi: "aa" });
