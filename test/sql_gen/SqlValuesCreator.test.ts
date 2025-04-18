import { JsObjectMapSql, SqlValuesCreator } from "@asla/yoursql";
import { describe, expect, test } from "vitest";

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
    const v = createAssertsSqlValue();

    const value = ["1", 2]; // 期望value转换为 JSON数组，但是配置的Array比Object优先级高
    expect(v(value, Object), "断言为JSON, 预期应该转换为JSON数字").toBe(`'["1",2]'`);

    expect(v(null, "boolean")).toBe("NULL");
  });
  test("断言空值", function () {
    expect(v(null, "boolean")).toBe("NULL");
    expect(v(undefined, "boolean")).toBe("DEFAULT");
  });
});
describe("toValues", function () {
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
    expect(s, "mya 不会被忽略, 结果列为 ab,cd,maa").toBe("(1,3,DEFAULT),\n(2,4,99)");

    const s3 = v.objectListToValuesList(c2);
    expect(s3, "ef被忽略, 结果列为 ab,cd").toBe("(1,3),\n(2,4)"); //
  });
  test("auto-columns-ignore-undefined-keys", function () {
    const s = v.objectListToValuesList(d1, undefined, true);
    expect(s, "mya 被保留, 结果列为 ab,cd,mya,maa").toBe("(1,3,DEFAULT,DEFAULT),\n(2,4,DEFAULT,99)");

    const s3 = v.objectListToValuesList(c2, undefined, true);
    expect(s3, "ef被保留, 结果列为 ab,cd,ef").toBe("(1,3,DEFAULT),\n(2,4,DEFAULT)");
  });
  test("select-keys", function () {
    const s = v.objectListToValuesList(
      [
        { ab: 1, cd: 3, ef: 7 },
        { ab: 2, cd: 4, ef: 9 },
      ],
      ["ab", "cd"]
    );
    expect(s, "指定顺序，ef会被忽略").toBe("(1,3),\n(2,4)");
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

  test("断言", function () {
    const v = createAssertsSqlValue();
    const int = v.objectListToValuesList(
      [
        { a: "11", b: "21" },
        { a: "12", b: "22" },
      ],
      { a: "INT", b: {} }
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
      }
    );
    expect(value, "JS 值和SQL类型转换").toBe(`('[1]'::JSONB,ARRAY[3]),\n('[2]',ARRAY[4])`);
  });
  test("empty array", function () {
    const values: any[] = [];
    expect(() => v.objectListToValuesList(values)).toThrowError();
  });
});

describe("createValues", function () {
  test("createValues", function () {
    const objectList = [{ age: 1, name: "hhh" }, { age: 2, name: "row2" }, { age: 3, name: "row3" }, {}];

    let sql = v.createValues("customName", objectList, {
      age: { sqlType: "INT", sqlDefault: "MAXIMUM(1,2)" },
      name: "TEXT",
    });
    const expectValue = `(VALUES
(1::INT,'hhh'::TEXT),
(2,'row2'),
(3,'row3'),
(MAXIMUM(1,2),NULL))
AS customName(age,name)`;

    expect(sql.toString()).toBe(expectValue);
  });
  test("createValues断言", function () {
    const v = createAssertsSqlValue();
    const values = [{ age: [1] }, { age: [2] }];
    let sql = v.createValues("customName", values, {
      age: { sqlType: "JSONB", assertJsType: Object },
      name: "TEXT",
    });
    expect(sql.toString()).toBe(`(VALUES
('[1]'::JSONB,NULL::TEXT),
('[2]',NULL))
AS customName(age,name)`);
  });
});

function createAssertsSqlValue() {
  const define: JsObjectMapSql = new Map();
  define.set(Array, toArray);
  define.set(Object, toJson);
  return SqlValuesCreator.create(define);
}
function toJson(this: SqlValuesCreator, value: object) {
  return this.toSqlStr(JSON.stringify(value));
}
function toArray(this: SqlValuesCreator, values: any[]) {
  return "ARRAY[" + values.map((v) => this.toSqlStr(v)).join(",") + "]";
}
