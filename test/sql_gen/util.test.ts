import { orderBy, selectColumns } from "@asla/yoursql";
import { expect, test } from "vitest";

test("orderBy", function () {
  const sql = "\nORDER BY age DESC NULLS FIRST,num ASC";

  expect(orderBy("age DESC NULLS FIRST,num ASC")).toBe(sql);
  expect(orderBy(["age DESC NULLS FIRST", "num ASC"])).toBe(sql);
  expect(
    orderBy([
      { key: "age", asc: false, nullLast: false },
      { key: "num", asc: true },
    ]),
  ).toBe(sql);

  expect(orderBy()).toBe("");
  expect(orderBy(() => {})).toBe("");
  expect(orderBy([])).toBe("");
});

test("selectColumns", function () {
  const sql = "c1,count(*) AS c2,column AS c3";
  expect(selectColumns({ c1: true, c2: "count(*)", c3: "column" })).toBe(sql);
  expect(selectColumns(sql)).toBe(sql);

  expect(() => selectColumns({})).toThrowError();
});
