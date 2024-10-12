import { SqlValuesCreator, pgSqlTransformer } from "@asnc/yoursql";
import { expect, test } from "vitest";

const a = SqlValuesCreator.create(pgSqlTransformer);
test("array", function () {
  expect(a([2, 3, undefined, null, []])).toMatchSnapshot("基本转换");
  expect(a([])).toMatchSnapshot("空数组");
});
test("date", function () {
  expect(a(new Date("2022-01-13"))).toMatchSnapshot();
});
