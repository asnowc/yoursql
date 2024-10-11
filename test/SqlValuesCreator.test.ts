import { SqlValuesCreator } from "@asnc/yoursql";
import { describe, expect, test } from "vitest";

let v = new SqlValuesCreator();
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
});

test("objectToValues-auto-columns", function () {
  const s = v.objectToValues({ ab: 1, cd: 3, ef: undefined });
  expect(s).toMatchSnapshot();
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
});
