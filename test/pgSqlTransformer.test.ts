import { SqlValuesCreator, pgSqlTransformer } from "@asnc/yoursql";
import { expect, test } from "vitest";

const v = SqlValuesCreator.create(pgSqlTransformer);
test("array", function () {
  expect(v([2, 3, undefined, null])).toBe(`ARRAY[2,3,DEFAULT,NULL]`);
  expect(v([]), "空数组").toBe("NULL");
  expect(
    v([
      [1, 2],
      [3, 4],
    ]),
    "二维数组"
  ).toBe("ARRAY[ARRAY[1,2],ARRAY[3,4]]");
});
test("array-type", function () {
  expect(() => v([null, "3", 4, new Date()]), "根据第一个非空元素确认类型").toThrowError(TypeError);
});
test("date", function () {
  expect(v(new Date("2022-01-13"))).toBe("'2022-01-13T00:00:00.000Z'");
});
