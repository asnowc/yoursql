import { where, having, orderBy, selectColumns, getObjectListKeys } from "@asnc/yoursql";
import { expect, test } from "vitest";

test("orderBy", function () {
  const sql = "\nORDER BY age DESC NULLS FIRST,num ASC";

  expect(orderBy("age DESC NULLS FIRST,num ASC")).toBe(sql);
  expect(orderBy(["age DESC NULLS FIRST", "num ASC"])).toBe(sql);
  expect(
    orderBy([
      { key: "age", asc: false, nullLast: false },
      { key: "num", asc: true },
    ])
  ).toBe(sql);
  expect(orderBy({ age: "DESC NULLS FIRST", num: true })).toBe(sql);

  expect(orderBy()).toBe("");
  expect(orderBy(() => {})).toBe("");
  expect(orderBy([])).toBe("");
  expect(orderBy({})).toBe("");
});
test("where", function () {
  const sql = "\nWHERE age=8 AND num<9";
  expect(where("age=8 AND num<9")).toBe(sql);
  expect(where(["age=8", "num<9"])).toBe(sql);

  expect(where([])).toBe("");
  expect(where("")).toBe("");
});
test("having", function () {
  const sql = "\nHAVING age=8 AND num<9";
  expect(having("age=8 AND num<9")).toBe(sql);
  expect(having(["age=8", "num<9"])).toBe(sql);

  expect(having([])).toBe("");
  expect(having("")).toBe("");
});
test("selectColumns", function () {
  const sql = "c1,count(*) AS c2,column AS c3";
  expect(selectColumns({ c1: true, c2: "count(*)", c3: "column" })).toBe(sql);
  expect(selectColumns(["c1", "count(*) AS c2", "column AS c3"])).toBe(sql);

  expect(() => selectColumns([])).toThrowError("");
  expect(() => selectColumns({})).toThrowError("");
});
test("getObjectListKeys", function () {
  let keys = getObjectListKeys([{ a: true }, { b: true }, { c: undefined }]);
  expect(Array.from(keys)).toEqual(["a", "b"]);

  keys = getObjectListKeys([{ a: true }, { b: true }, { c: undefined }], true);
  expect(Array.from(keys)).toEqual(["a", "b", "c"]);
});
