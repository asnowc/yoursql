import { expect, test } from "vitest";
import { createAssertsSqlValue } from "./__mocks__/createAssertsSqlValue.ts";
import { SqlValuesCreator } from "@asla/yoursql";

let v = SqlValuesCreator.create();

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
