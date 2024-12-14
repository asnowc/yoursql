import { Selection, SqlTextStatementDataset, TableType, DbTable } from "@asnc/yoursql";
import { test, expect, describe } from "vitest";

class MockSqlSelectable<T extends TableType> extends SqlTextStatementDataset<T> {
  constructor(name: string) {
    super(`SELECT * FROM ${name}`);
  }
}

const t0 = new DbTable<{ c1: string; c2: number; c3: string | null }>("aaa");
const t1 = new MockSqlSelectable<{ c1: string; c2: number; c3: string | null }>("ccc");
const t2 = new MockSqlSelectable<{ c11: string; c22: string; c3: string }>("bbb");

test("单表 select", function () {
  let s0 = Selection.from(t0).select("*").toString();
  expect(s0).toMatchSnapshot("t0 all");

  s0 = Selection.from(t0).select({ c1: true, rename: "c2" }).toString();
  expect(s0).toMatchSnapshot("t0 rename");

  s0 = Selection.from(t1).select("*").toString();
  expect(s0).toMatchSnapshot("t1 all");

  s0 = Selection.from(t1).select({ c1: true, rename: "c2" }).toString();
  expect(s0).toMatchSnapshot("t0 rename");

  expect(() => Selection.from(t1).select([]), "没有选择任何列").toThrowError();
});

test("多表 select", function () {
  const s = Selection.from(t0)
    .from(t1, "table")
    .from(t2)
    .select({ "aaa.c1": true, "aaa.c2": true, c33: "table.c3", "table.c11": true, c23: "t2.c3" });
  expect(s.toString()).toMatchSnapshot();
});
describe("join", function () {
  const s1 = Selection.from(t1, "t0");
  const on = "t1.c1=t2.c1";

  test("crossJoin", function () {
    expect(s1.crossJoin(t2, "t1").select("*").toString()).toMatchSnapshot("crossJoin");
  });
  test("naturalJoin", function () {
    expect(s1.naturalJoin(t2, "t1").select("*").toString()).toMatchSnapshot("naturalJoin");
  });
  test("innerJoin", function () {
    expect(s1.innerJoin(t2, "t1", on).select("*").toString()).toMatchSnapshot("innerJoin");
  });
  test("fullJoin", function () {
    expect(s1.fullJoin(t2, "t1", on).select("*").toString()).toMatchSnapshot("fullJoin");
  });
  test("leftJoin", function () {
    expect(s1.leftJoin(t2, "t1", on).select("*").toString()).toMatchSnapshot("leftJoin");
  });
  test("rightJoin", function () {
    expect(s1.rightJoin(t2, "t1", on).select("*").toString()).toMatchSnapshot("rightJoin");
  });
});

/* 
SELECT DISTINCT t1.age, t2.num_count as num, (t1.age + num) as sum 
FROM aaa as t1 
INNER JOIN (SELECT id, count(*) AS num_count from bbb WHERE id !='1' GROUP BY id) as t2 
ON t1.id=t2.id
ORDER BY id
*/
test("组合", function () {
  const sql = Selection.from("aaa", "t1")
    .innerJoin(Selection.from("bbb").select({ id: true }).where("id != '1'").groupBy("id"), "t2", "t1.id=t2.id")
    .select("DISINCT t1.age,t2.num_count as num,(t1.age + num) AS sum")
    .toString();
  expect(sql).toMatchSnapshot();
});
