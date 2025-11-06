import { insertInto, pgSqlTransformer, SqlValuesCreator } from "@asla/yoursql";
import { test, expect, describe } from "vitest";
const v = SqlValuesCreator.create(pgSqlTransformer);

describe("insert", function () {
  test("insert", function () {
    let sql = insertInto("user", ["name", "level"])
      .values(
        v.objectListToValuesList([
          { name: "张三", level: 8 },
          { name: "王五", level: 9 },
        ]),
      )
      .genSql();
    expect(sql).toBe(`INSERT INTO user(name,level)
VALUES
('张三',8),
('王五',9)`);
    expect(insertInto("user", ["name"]).values("('张三')").toString(), "字符串值").toBe(`INSERT INTO user(name)
VALUES
('张三')`);
  });
  test("insert-conflict", function () {
    const insert = insertInto("user(name)").values("('张三')");
    const base = insert.onConflict(["id", "level"]);

    expect(base.toString(), "onConflict").toBe(insert.toString() + "\nON CONFLICT (id,level)");

    expect(base.doUpdate("SET level= 89,name= 11").toString(), "doUpdate-string").toBe(
      base.toString() + "\nDO UPDATE SET level= 89,name= 11",
    );
    expect(base.doUpdate({ level: "89", name: "11" }).toString(), "doUpdate-object").toBe(
      base.toString() + "\nDO UPDATE SET\nlevel= 89,name= 11",
    );
    expect(base.doNotThing().toString(), "doNotThing").toBe(base.toString() + " DO NOTHING");
  });
  test("insert-error", function () {
    const base = insertInto("user(name)");
    //@ts-expect-error
    expect(() => base.values(1)).toThrowError(TypeError);
    expect(() => base.values({} as any)).toThrowError();
  });
  test("insert-returning", function () {
    const values = [{ name: "hh" }];
    const base = insertInto("user(name)").values(v.objectListToValuesList(values));
    expect(base.returning({ level: "rename", name: true }).toString(), "返回结果重命名").toBe(`INSERT INTO user(name)
VALUES
('hh')
RETURNING rename AS level,name`);

    expect(() => base.returning({}), "返回结果不能为空").toThrowError();
  });
});
