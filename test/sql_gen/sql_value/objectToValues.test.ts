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

describe("objectListToValuesList", function () {
  test("auto-columns", function () {
    const s = v.objectListToValuesList(d1);
    expect(s, "mya 不会被忽略, 结果列为 ab,cd,maa").toBe("(1,3,DEFAULT),\n(2,4,99)");

    const s3 = v.objectListToValuesList(c2);
    expect(s3, "ef被忽略, 结果列为 ab,cd").toBe("(1,3),\n(2,4)"); //
  });
  test("undefinedDefault", function () {
    const s = v.createExplicitValues(d1);
    expect(s.text, "mya 被保留, 结果列为 ab,cd,mya,maa").toBe("(1,3,NULL),\n(2,4,99)");

    const s3 = v.createExplicitValues(c2);
    expect(s3.text, "ef被保留, 结果列为 ab,cd,ef").toBe("(1,3),\n(2,4)");
  });

  test("select-keys", function () {
    const s = v.objectListToValuesList(
      [
        { ab: 1, cd: 3, ef: 7 },
        { ab: 2, cd: 4, ef: 9 },
      ],
      ["ab", "cd"],
    );
    expect(s, "指定顺序，ef会被忽略").toBe("(1,3),\n(2,4)");
  });
  test("define-type", function () {
    const s = v.objectListToValuesList(
      [
        { ab: 1, cd: 3, ef: 7 },
        { ab: 2, cd: 4, ef: 9 },
      ],
      { ab: "INT", cd: undefined },
    );
    expect(s).toBe(`(1::INT,3),\n(2,4)`);
  });

  test("断言", function () {
    const v = createAssertsSqlValue();
    const int = v.objectListToValuesList(
      [
        { a: "11", b: "21" },
        { a: "12", b: "22" },
      ],
      { a: "INT", b: {} },
    );
    expect(int, "字段 a 类型转换,且只在第一行有转换").toBe(`('11'::INT,'21'),\n('12','22')`);

    const value = v.objectListToValuesList(
      [
        { a: [1], b: [3] },
        { a: [2], b: [4] },
      ],
      {
        a: { assertJsType: Object, sqlType: "JSONB" },
        b: {},
      },
    );
    expect(value, "JS 值和SQL类型转换").toBe(`('[1]'::JSONB,ARRAY[3]),\n('[2]',ARRAY[4])`);
  });
  test("empty array", function () {
    const values: any[] = [];
    expect(() => v.objectListToValuesList(values)).toThrowError();
  });
  test("getObjectListKeys", function () {
    let result = v.objectListToValues([{ a: true }, { b: true }, { c: undefined }]);
    expect(result.columns).toEqual(["a", "b"]);
  });
});

describe("objectToValues", function () {
  test("empty object", function () {
    expect(() => v.objectToValues({}), "空对象").toThrowError();
  });
  test("objectToValues with specific keys", function () {
    const s = v.objectToValues({ ab: 1, cd: 3, ef: undefined }, ["ab", "cd"]);
    expect(s, "只选择指定的键").toBe("1,3");
  });

  test("objectToValues with type definitions", function () {
    const s = v.objectToValues({ ab: 1, cd: 3, ef: undefined }, { ab: "INT", cd: "TEXT", ef: "JSONB" });
    expect(s, "指定类型转换").toBe("1::INT,3::TEXT,DEFAULT::JSONB");
  });

  test("objectToValues with all keys included", function () {
    const s = v.objectToValues({ ab: 1, cd: 3, ef: undefined });
    expect(s, "包含所有键").toBe("1,3,DEFAULT");
  });

  test("objectToValues with assertions", function () {
    const v = createAssertsSqlValue();
    const s = v.objectToValues({ ab: [1], cd: 3 }, { ab: { assertJsType: Object, sqlType: "JSONB" }, cd: "TEXT" });
    expect(s, "断言类型转换").toBe("'[1]'::JSONB,3::TEXT");
  });
});
test("createExplicitValues", function () {
  const objectList = [{ age: 1, name: "hhh" }, { age: 2, name: "row2" }, { age: 3, name: "row3" }, {}];
  let sql = v
    .createExplicitValues(objectList, { age: { sqlType: "INT", sqlDefault: "MAXIMUM(1,2)" }, name: "TEXT" })
    .toSelect("customName");

  const expectValue = `(VALUES
(1::INT,'hhh'::TEXT),
(2,'row2'),
(3,'row3'),
(MAXIMUM(1,2),NULL))
AS customName(age,name)`;

  expect(sql.toString()).toBe(expectValue);
});
test("createExplicitValues断言", function () {
  const v = createAssertsSqlValue();
  const values = [{ age: [1] }, { age: [2] }];
  let sql = v
    .createExplicitValues(values, {
      age: { sqlType: "JSONB", assertJsType: Object },
      name: "TEXT",
    })
    .toSelect("customName");
  expect(sql).toBe(`(VALUES
('[1]'::JSONB,NULL::TEXT),
('[2]',NULL))
AS customName(age,name)`);
});
