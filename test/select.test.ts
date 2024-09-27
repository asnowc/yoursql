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
  const s0 = createSelect(t0, "*");
  type T0 = InferQueryResult<typeof s0>;
  expect(s0.toString()).toMatchSnapshot("t0 all");

  const s1 = createSelect(t0, { c1: true, c2: "rename" } as const);
  type T1 = InferQueryResult<typeof s1>;
  expect(s1.toString()).toMatchSnapshot("t0 rename");

  const s2 = createSelect(t1, "*");
  type T2 = InferQueryResult<typeof s2>;
  expect(s2.toString()).toMatchSnapshot("t1 all");

  const s3 = createSelect(t1, { c1: true, c2: "rename" } as const);
  type T3 = InferQueryResult<typeof s3>;
  expect(s3.toString()).toMatchSnapshot("t1 rename");
});
test("单表异常情况", function () {
  const s4 = createSelect(t1);
  type T4 = InferQueryResult<typeof s4>;
  expect(() => s4.toString(), "没有选择任何列").toThrowError();
});

test("多表", function () {
  const s = createSelect(t0, { c1: true, c2: true })
    .select(t1, { c3: "c33", c11: true } as const, { tableAs: "table" })
    .select(t2, { c3: "c23" } as const);
  type T3 = InferQueryResult<typeof s>;
  expect(s.toString()).toMatchSnapshot();
});
test("构造列", function () {
  const s = createSelect(t1, { c1: true }).addColumns<{ count: number }>({ count: "count(*)" });
  expect(Array.from(s.columns)).toEqual(["c1", "count"]);
  type T3 = InferQueryResult<typeof s>;
  expect(s.toString()).toMatchSnapshot();
});
describe("join", function () {
  const s1 = createSelect(t1);
  const option = { on: "t1.c1=t2.c1" };

  test("crossJoin", function () {
    expect(s1.crossJoin(t2, "*", {}).toString()).toMatchSnapshot("crossJoin");
  });
  test("naturalJoin", function () {
    expect(s1.naturalJoin(t2, "*", {}).toString()).toMatchSnapshot("naturalJoin");
  });
  test("innerJoin", function () {
    expect(s1.innerJoin(t2, "*", option).toString()).toMatchSnapshot("innerJoin");
  });
  test("fullJoin", function () {
    expect(s1.fullJoin(t2, "*", option).toString()).toMatchSnapshot("fullJoin");
  });
  test("leftJoin", function () {
    expect(s1.leftJoin(t2, "*", option).toString()).toMatchSnapshot("leftJoin");
  });
  test("rightJoin", function () {
    expect(s1.rightJoin(t2, "*", option).toString()).toMatchSnapshot("rightJoin");
  });
});
