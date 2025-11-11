import { SqlValuesCreator } from "@asla/yoursql";
import { describe, expect, test } from "vitest";
import { createAssertsSqlValue } from "./__mocks__/createAssertsSqlValue.ts";

let v = SqlValuesCreator.create();

const d1 = [
  { ab: 1, cd: 3, mya: undefined },
  { ab: 2, cd: 4, maa: 99 },
];
const c2 = [
  { ab: 1, cd: 3, ef: undefined },
  { ab: 2, cd: 4, ef: undefined },
];
describe("auto-columns", function () {
  test("createExplicitValues", function () {
    const s0 = v.createExplicitValues(d1);
    expect(s0.columns, "mya 不会被忽略, 结果列为 ab,cd,maa").toEqual(["ab", "cd", "maa"]);
    expect(s0.text, "undefined 被转为 NULL").toBe("(1,3,NULL),\n(2,4,99)");

    const s2 = v.createExplicitValues(c2);
    expect(s2.columns, "mya 不会被忽略, 结果列为 ab,cd,maa").toEqual(["ab", "cd"]);
    expect(s2.text, "空列被移除").toBe("(1,3),\n(2,4)");
  });
  test("createExplicitValues", function () {
    const s1 = v.createImplicitValues(d1);
    expect(s1.columns, "mya 不会被忽略, 结果列为 ab,cd,maa").toEqual(["ab", "cd", "maa"]);
    expect(s1.text, "undefined 被转为 DEFAULT").toBe("(1,3,DEFAULT),\n(2,4,99)");

    const s2 = v.createImplicitValues(c2);
    expect(s2.columns, "mya 不会被忽略, 结果列为 ab,cd,maa").toEqual(["ab", "cd"]);
    expect(s2.text, "空列被移除").toBe("(1,3),\n(2,4)");
  });
  test("objectValue", function () {
    const s1 = v.createImplicitValues({ f1: 1, f2: undefined });
    expect(s1.columns, "f2会被忽略").toEqual(["f1"]);
    expect(s1.text).toBe("(1)");
  });
});

describe("指定建", function () {
  test("select-keys", function () {
    const values = [
      { ab: 1, cd: 3, ef: 7 },
      { ab: 2, cd: 4, ef: 9 },
    ];
    {
      const s = v.createExplicitValues(values, ["ab", "cd"]);
      expect(s.columns, "指定顺序，ef会被忽略").toEqual(["ab", "cd"]);
      expect(s.text, "指定顺序，ef会被忽略").toBe("(1,3),\n(2,4)");
    }
    {
      const s = v.createImplicitValues(values, ["ab", "cd"]);
      expect(s.columns, "指定顺序，ef会被忽略").toEqual(["ab", "cd"]);
      expect(s.text, "指定顺序，ef会被忽略").toBe("(1,3),\n(2,4)");
    }
  });
  test("断言类型", function () {
    const objectList = [{ age: 1, name: "hhh", rest: "rest" }, { age: 2, name: "row2" }, { age: 3, name: "row3" }, {}];
    let res = v.createExplicitValues(objectList, { age: { sqlType: "INT", sqlDefault: "MAXIMUM(1,2)" }, name: "TEXT" });

    const expectValue = `(VALUES
(1::INT,'hhh'::TEXT),
(2,'row2'),
(3,'row3'),
(MAXIMUM(1,2),NULL))
AS customName(age,name)`;
    expect(res.columns).toEqual(["age", "name"]);
    expect(res.toSelect("customName")).toBe(expectValue);
  });

  test("断言", function () {
    const v = createAssertsSqlValue();
    const res = v.createExplicitValues(
      [
        { a: "11", b: "21" },
        { a: "12", b: "22" },
      ],
      { a: "INT", b: {} },
    );
    expect(res.text, "字段 a 类型转换,且只在第一行有转换").toBe(`('11'::INT,'21'),\n('12','22')`);

    const res2 = v.createExplicitValues(
      [
        { a: [1], b: [3] },
        { a: [2], b: [4] },
      ],
      {
        a: { assertJsType: Object, sqlType: "JSONB" },
        b: {},
      },
    );
    expect(res2.text, "JS 值和SQL类型转换").toBe(`('[1]'::JSONB,ARRAY[3]),\n('[2]',ARRAY[4])`);
  });
  test("define-type", function () {
    const s = v.createExplicitValues(
      [
        { ab: 1, cd: 3, ef: 7 },
        { ab: 2, cd: 4, ef: 9 },
      ],
      { ab: "INT", cd: undefined },
    );
    expect(s.text).toBe(`(1::INT,3),\n(2,4)`);
  });
});

test("empty value", function () {
  expect(() => v.createExplicitValues([])).toThrowError();
  expect(() => v.createExplicitValues({})).toThrowError();

  expect(() => v.createImplicitValues([])).toThrowError();
  expect(() => v.createImplicitValues({})).toThrowError();
});
