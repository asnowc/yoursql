import { SqlValuesCreator } from "@asla/yoursql";
import { expect, test } from "vitest";

let v = SqlValuesCreator.create();

test("empty array", function () {
  const values: any[] = [];
  expect(() => v.toValues(values)).toThrowError();
});
test("basic usage", function () {
  const values = [1, "text", null, undefined, true, false];
  const result = v.toValues(values);
  expect(result).toBe("1,'text',NULL,DEFAULT,TRUE,FALSE");
});

test("mixed types", function () {
  const result = v.toValues([1, "abc", null, undefined, { key: "value" }]);
  expect(result).toBe(`1,'abc',NULL,DEFAULT,'{"key":"value"}'`);
});
