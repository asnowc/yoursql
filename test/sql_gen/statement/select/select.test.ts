import { select } from "@asla/yoursql";
import { test, expect } from "vitest";
test("select empty", function () {
  expect(select().toString()).toBe("SELECT ");
  expect(select("").toString()).toBe("SELECT ");
});
test("select", function () {
  expect(select("*").toString()).toBe("SELECT *");
  expect(select(() => "*").toString()).toBe("SELECT *");

  expect(select(["c1", "c2 AS rename"]).toString()).toBe("SELECT c1,c2 AS rename");
  expect(select(() => ["c1", "c2 AS rename"]).toString()).toBe("SELECT c1,c2 AS rename");

  expect(select({ c1: true, rename: "c2" }).toString()).toBe("SELECT c1,c2 AS rename");
  expect(select(() => ({ c1: true, rename: "c2" })).toString()).toBe("SELECT c1,c2 AS rename");
});

test("单表 from", function () {
  const s1 = select("*");
  expect(s1.from("aaa").toString()).toBe("SELECT *\nFROM aaa");
  expect(s1.from("aaa", { as: "a" }).toString()).toBe("SELECT *\nFROM aaa AS a");
  expect(s1.from("aaa AS a").toString()).toBe("SELECT *\nFROM aaa AS a");
  expect(s1.from(() => "aaa").toString()).toBe("SELECT *\nFROM aaa");
});
test("多表 from", function () {
  const s1 = select("*").from("aaa");
  const s2 = s1.from("bbb");
  const s3 = s2.from(() => "ccc");
  expect(s2.toString()).toBe("SELECT *\nFROM aaa, bbb");
  expect(s3.toString()).toBe("SELECT *\nFROM aaa, bbb, ccc");
});
test("from empty", function () {
  const s1 = select("*");
  //@ts-expect-error
  expect(() => s1.from().toString()).toThrowError();
  expect(() => s1.from("").toString()).toThrowError();
});

test("limit and offset", function () {
  const t = select("*").from("aaa");
  expect(t.limit(10).toString()).toBe("SELECT *\nFROM aaa\nLIMIT 10");
  expect(t.limit(10n, 5n).toString()).toBe("SELECT *\nFROM aaa\nLIMIT 10\nOFFSET 5");

  expect(t.limit(0).toString()).toBe(t.genSql() + "\nLIMIT 0");
  expect(t.limit(-5).toString()).toBe(t.genSql() + "\nLIMIT -5");
  expect(t.limit(undefined, 0).toString()).toBe(t.genSql() + "\nOFFSET 0");
  expect(t.limit(undefined, -5).toString()).toBe(t.genSql() + "\nOFFSET -5");
});

test("limit and offset empty", function () {
  const t = select("*").from("aaa");
  expect(t.limit(undefined).toString()).toBe("SELECT *\nFROM aaa");
  expect(t.limit(undefined, undefined).toString()).toBe("SELECT *\nFROM aaa");
});

test("组合", function () {
  const subSelect = select({ id: true }).from("bbb").where("id != '1'").groupBy("id");

  const sql = select("DISTINCT t1.age,t2.num_count as num,(t1.age + num) AS sum")
    .from("aaa AS t1")
    .innerJoin(subSelect, { on: "t1.id=t2.id", as: "t2" });

  expect(sql.toString()).toBe(`SELECT DISTINCT t1.age,t2.num_count as num,(t1.age + num) AS sum
FROM aaa AS t1
INNER JOIN (SELECT id
FROM bbb
WHERE id != '1'
GROUP BY id) AS t2 ON t1.id=t2.id`);
});
