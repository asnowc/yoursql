import { JsObjectMapSql, SqlValuesCreator } from "@asnc/yoursql";
import { describe, expect, test } from "vitest";
function toJson(this: SqlValuesCreator, value: object) {
  return this.toSqlStr(JSON.stringify(value));
}
function toArray(this: SqlValuesCreator, values: any[]) {
  return "ARRAY[" + values.map((v) => this.toSqlStr(v)).join(",") + "]";
}
let v = SqlValuesCreator.create();
describe("转换值", function () {
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
    const define: JsObjectMapSql = new Map();
    define.set(Array, toArray);
    define.set(Object, toJson);
    const v = SqlValuesCreator.create(define);

    const value = ["1", 2]; // 期望value转换为 JSON数组，但是配置的Array比Object优先级高
    expect(v(value, Object), "断言为JSON, 预期应该转换为JSON数字").toBe(`'["1",2]'`);

    expect(v(null, "boolean")).toBe("NULL");
  });
  test("断言空值", function () {
    expect(v(null, "boolean")).toBe("NULL");
    expect(v(undefined, "boolean")).toBe("DEFAULT");
  });
});

test("objectToValues-auto-columns", function () {
  const s = v.objectToValues({ ab: 1, cd: 3, ef: undefined });
  expect(s).toMatchSnapshot();
});
test("objectToValues断言", function () {
  const define: JsObjectMapSql = new Map();
  define.set(Array, toArray);
  define.set(Object, toJson);
  const v = SqlValuesCreator.create(define);
  expect(v.objectToValues({ a: ["1", 2], b: 3 }, { a: { assertJsType: Object, sqlType: "JSONB" }, b: undefined })).toBe(
    `'["1",2]'::JSONB,3`
  );
});

describe("objectListToValuesList", function () {
  const d1 = [
    { ab: 1, cd: 3, mya: undefined },
    { ab: 2, cd: 4, maa: 99 },
  ];
  const c2 = [
    { ab: 1, cd: 3, ef: undefined },
    { ab: 2, cd: 4, ef: undefined },
  ];
  test("auto-columns", function () {
    const s = v.objectListToValuesList(d1);
    expect(s, "mya 被忽略").toMatchSnapshot();

    const s3 = v.objectListToValuesList(c2);
    expect(s3, "ef被忽略").toMatchSnapshot();
  });
  test("auto-columns-ignore-undefined-keys", function () {
    const s = v.objectListToValuesList(d1, undefined, true);
    expect(s, "mya 被忽略").toMatchSnapshot();

    const s3 = v.objectListToValuesList(c2, undefined, true);
    expect(s3, "ef被忽略").toMatchSnapshot();
  });
  test("select-keys", function () {
    const s = v.objectListToValuesList(
      [
        { ab: 1, cd: 3, ef: 7 },
        { ab: 2, cd: 4, ef: 9 },
      ],
      ["ab", "cd"]
    );
    expect(s).toMatchSnapshot();
  });
  test("define-type", function () {
    const s = v.objectListToValuesList(
      [
        { ab: 1, cd: 3, ef: 7 },
        { ab: 2, cd: 4, ef: 9 },
      ],
      { ab: "INT", cd: undefined }
    );
    expect(s).toMatchSnapshot();
  });
  test("getObjectType", function () {
    expect(v.getObjectType({}).call(v, {})).toBe("'{}'");
  });

  test("断言", function () {
    const define: JsObjectMapSql = new Map();
    define.set(Array, toArray);
    define.set(Object, toJson);
    const v = SqlValuesCreator.create(define);
    expect(v.objectListToValuesList([{ a: [1] }, { a: [2] }], { a: { assertJsType: Object, sqlType: "JSONB" } })).toBe(
      `('[1]'::JSONB),\n('[2]')`
    );
  });
});

test("createValues", function () {
  let sql = v.createValues(
    "customName",
    [{ age: 8, name: "hhh" }, { age: 9, name: "row2" }, { age: 9, name: "row2" }, {}],
    { age: { sqlType: "INT", sqlDefault: "MAXIMUM(1,2)" }, name: "TEXT" }
  );
  expect(sql.toString()).toMatchSnapshot("str");
});
