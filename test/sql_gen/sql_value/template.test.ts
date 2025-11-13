import { v } from "@asla/yoursql";
import { expect, test } from "vitest";

test("template genSql", function () {
  const result = v.gen`SELECT * FROM your_table WHERE a = ${1} AND b = ${"text"} AND c = ${null} AND d = ${undefined}`;

  expect(result.genSql()).toBe(`SELECT * FROM your_table WHERE a = 1 AND b = 'text' AND c = NULL AND d = DEFAULT`);
  expect(result.textArgs).toEqual(["1", "'text'", "NULL", "DEFAULT"]);
});

test("toTextTemplate", function () {
  const result = v.gen`SELECT * FROM your_table WHERE a = ${1} AND b = ${"text"} AND c = ${null} AND d = ${undefined}`;

  expect(result.textTemplate).toBe(`SELECT * FROM your_table WHERE a = $1 AND b = $2 AND c = $3 AND d = $4`);
  expect(result.textArgs).toEqual(["1", "'text'", "NULL", "DEFAULT"]);
});
