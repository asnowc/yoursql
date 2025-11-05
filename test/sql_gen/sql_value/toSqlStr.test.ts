import { SqlValuesCreator } from "@asla/yoursql";
import { expect, test } from "vitest";
import { createAssertsSqlValue } from "./__mocks__/createAssertsSqlValue.ts";

let v = SqlValuesCreator.create();
test("string", function () {
  expect(v("abc'\"\n ")).toBe("'abc''\"\n '");
});
test("null-undefined", function () {
  expect(v(null)).toBe("NULL");
  expect(v(undefined)).toBe("DEFAULT");
});
test("function-symbol", function () {
  expect(() => v(() => {})).toThrowError();
  expect(() => v(Symbol())).toThrowError();
});
test("object", function () {
  expect(v({ a: 8 }), "默认使用JSON序列化").toBe(SqlValuesCreator.string(JSON.stringify({ a: 8 })));
});
test("单值断言", function () {
  const v = createAssertsSqlValue();

  const value = ["1", 2]; // 期望value转换为 JSON数组，但是配置的Array比Object优先级高
  expect(v(value, Object), "断言为JSON, 预期应该转换为JSON数字").toBe(`'["1",2]'`);

  expect(v(null, "boolean")).toBe("NULL");
});
test("断言空值", function () {
  expect(v(null, "boolean")).toBe("NULL");
  expect(v(undefined, "boolean")).toBe("DEFAULT");
});
