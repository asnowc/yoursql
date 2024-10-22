import { createSelect, SqlQueryStatement, InferQueryResult, TableType, DbTable } from "@asnc/yoursql";
import { test, expect, describe } from "vitest";

class MockSqlSelectable<T extends TableType> extends SqlQueryStatement<T> {
  constructor(name: string, columns: string[]) {
    super(`SELECT * FROM ${name}`, columns);
  }
}

const t0 = new DbTable<{ c1: string; c2: number; c3: string | null }>("aaa", ["c1", "c2", "c3"]);
const t1 = new MockSqlSelectable<{ c1: string; c2: number; c3: string | null }>("ccc", ["c1", "c2", "c3"]);
const t2 = new MockSqlSelectable<{ c11: string; c22: string; c3: string }>("bbb", ["c11", "c22", "c3"]);
test("单表选择", function () {
  const s0 = createSelect(t0).select("*");
  type T0 = InferQueryResult<typeof s0>;
  expect(s0.toString()).toMatchSnapshot("t0 all");

  const s1 = createSelect(t0).select({ c1: true, rename: "c2" });
  type T1 = InferQueryResult<typeof s1>;
  expect(s1.toString()).toMatchSnapshot("t0 rename");

  const s2 = createSelect(t1).select("*");
  type T2 = InferQueryResult<typeof s2>;
  expect(s2.toString()).toMatchSnapshot("t1 all");

  const s3 = createSelect(t1).select({ c1: true, rename: "c2" });
  type T3 = InferQueryResult<typeof s3>;
  expect(s3.toString()).toMatchSnapshot("t1 rename");
});
test("单表异常情况", function () {
  expect(() => createSelect(t1).select([]), "没有选择任何列").toThrowError();
});

test("多表", function () {
  const s = createSelect(t0)
    .from(t1, "table")
    .from(t2)
    .select({ "aaa.c1": true, "aaa.c2": true, c33: "table.c3", "table.c11": true, c23: "t2.c3" });
  expect(s.toString()).toMatchSnapshot();
});
test("构造列", function () {
  const s = createSelect(t1, "t0").select({ "t0.c1": true, count: "count(*)" });
  // expect(Array.from(s.columns)).toEqual(["c1", "count"]);
  type T3 = InferQueryResult<typeof s>;
  expect(s.toString()).toMatchSnapshot();
});
describe("join", function () {
  const s1 = createSelect(t1, "t0");
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
  const sql = createSelect("aaa", "t1")
    .innerJoin(
      createSelect("bbb").where("id != '1'").groupBy("id").select({ id: true }).filter({ orderBy: "" }),
      "t2",
      "t1.id=t2.id"
    )
    .select(["DISINCT t1.age", "t2.num_count as num", "(t1.age + num) AS sum"])
    .toString();
  expect(sql).toMatchSnapshot();
});
