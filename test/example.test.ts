import { DbTable, SqlSelectable, TableType, TableDefined, createSelect } from "@asnc/yoursql";
import { expect, describe, test } from "vitest";

/* 
SELECT DISTINCT t1.age, t2.num_count as num, (t1.age + num) as sum 
FROM aaa as t1 
INNER JOIN (SELECT id, count(*) AS num_count from bbb WHERE id !='1' GROUP BY id ORDER BY) as t2 
ON t1.id=t2.id
*/
createSelect("aaa", "t1").innerJoin(createSelect("bbb").where("id != '1'").groupBy("id").select({ id: undefined }));

interface Y {
  yy: { a: number; b2: string };
  b: { b: string };
}
type Get<T> = keyof T extends string ? keyof T : never;
type Q<T extends {}> = {
  [key in keyof T as key extends string ? `${key}.${Get<T[key]>}` : never]: boolean;
};
type Q2<T extends {}> = T[Get<T>];
type c = Q<Y>;

// createSelect("aaa", "t1")
//   .innerJoin(createSelect("bbb").where("id !='1'").groupBy("id").orderBy("age ASC"), "t2", "t1.id=t2.id")
//   .select({ "DISTINCT t1.age": "age" });
