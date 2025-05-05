import { DbTableQuery, pgSqlTransformer, SqlValuesCreator } from "@asla/yoursql";
import { test, expect, describe } from "vitest";

interface Table {
  name: string;
  level: number;
  id: bigint;
}
interface CreateTable {
  name: string;
  level?: number;
}
const table = new DbTableQuery<Table, CreateTable>("user", new SqlValuesCreator(pgSqlTransformer));
describe("select", function () {
  test("select-columns", function () {
    expect(table.fromAs().select("*").toString()).toMatchSnapshot();
    expect(table.fromAs().select({ name: true, rename_level: "level", id: "id" }).toString()).toMatchSnapshot();
  });
  test("select-where-order-limit", function () {
    const sql = table.select("*").where("limit IS NULL").orderBy(["id ASC NULLS FIRST"]).limit(100, 23).toString();
    expect(sql).toMatchSnapshot();
  });
  test("limit", function () {
    expect(table.select("*").limit(12).toString()).toBe("SELECT *\nFROM user\nLIMIT 12");
    expect(table.select("*").limit(12n, 1n).toString()).toBe("SELECT *\nFROM user\nLIMIT 12\nOFFSET 1");
    //@ts-ignore
    expect(() => table.select("*").limit("12"), "limit 必须是 number 或 bigint 类型").toThrowError(TypeError);
    //@ts-ignore
    expect(() => table.select("*").limit(100, "12"), "offset 必须是 number 或 bigint 类型").toThrowError(TypeError);
  });
});
describe("update", function () {
  test("update", function () {
    //@ts-expect-error
    expect(table.update({ id: "78", k: undefined, c: "" }).toString(), "忽略 undefined 和空字符串").toBe(
      "UPDATE user SET\nid= 78"
    );
    expect(table.update("level=1").where("id IS NULL").toString()).toMatchSnapshot();
  });
  test("update-error", function () {
    expect(() => table.update({}), "值为空").toThrowError();
    //@ts-expect-error
    expect(() => table.update({ id: "78", name: 1 }), "key对应的类型只能是 string 或 undefined 类型").toThrowError(
      TypeError
    );
  });
});
describe("updateFrom", function () {
  test("update-base", function () {
    expect(table.updateFrom({ id: 78n }).toString()).toBe("UPDATE user SET\nid= 78");
    expect(table.updateFrom({ id: 78n }).where("id IS NULL").toString()).toMatchSnapshot();
  });
  test("update-error", function () {
    expect(() => table.updateFrom({}), "值为空").toThrowError();
  });
  test("update-returning", function () {
    expect(
      table.updateFrom({ id: 78n }).returning({ level: "rename", name: true }).toString(),
      "返回结果重命名"
    ).toMatchSnapshot();
    expect(() => table.updateFrom({ id: 78n }).returning({})).toThrowError();
  });
});
describe("delete", function () {
  test("delete", function () {
    expect(table.delete({ where: "id IS NULL" }).toString()).toMatchSnapshot();
  });
  test("deleteWithResult", function () {
    expect(table.delete().returning("*").toString()).toMatchSnapshot();
    expect(table.delete().returning({ level: "rename", name: true }).toString(), "返回结果重命名").toMatchSnapshot();
    expect(() => table.delete().returning({})).toThrowError();
  });
});
describe("insert", function () {
  test("insert", function () {
    let sql = table
      .insert([
        { name: "张三", level: 8 },
        { name: "王五", level: 9 },
      ])
      .toString();
    expect(sql).toMatchSnapshot();
    expect(table.insert("name", "VALUES('张三')").toString(), "字符串值").toMatchSnapshot();

    {
      const sql = table.insert([{ name: new String("'ab'||'cd'") }]).toString();
      expect(sql).toBe("INSERT INTO user (name)\nVALUES\n('ab'||'cd')");
    }
  });
  test("insert-conflict", function () {
    const insert = table.insert("name", "VALUES('张三')");
    const base = insert.onConflict(["id", "level"]);

    expect(base.toString(), "onConflict").toBe(insert.toString() + "\nON CONFLICT (id,level)");

    expect(base.doUpdate("SET level= 89,name= 11").toString(), "doUpdate-string").toBe(
      base.toString() + "DO UPDATE\nSET level= 89,name= 11"
    );
    expect(base.doUpdate({ level: "89", name: "11" }).toString(), "doUpdate-object").toBe(
      base.toString() + "\nDO UPDATE SET\nlevel= 89,name= 11"
    );
    expect(base.doNotThing().toString(), "doNotThing").toBe(base.toString() + " DO NOTHING");
  });
  test("insert-error", function () {
    //@ts-expect-error
    expect(() => table.insert(1)).toThrowError(TypeError);
    //@ts-expect-error
    expect(() => table.insert(["1"], "VALUES (12)")).toThrowError(TypeError);
    expect(() => table.insert([{}, {}] as any)).toThrowError();
    expect(() => table.insert({} as any)).toThrowError();
    expect(() => table.insert("", "VALUES(1)"), "没有指定列").toThrowError();
  });
  test("insert-returning", function () {
    const values = [{ name: "hh" }];
    expect(
      table.insert(values).returning({ level: "rename", name: true }).toString(),
      "返回结果重命名"
    ).toMatchSnapshot();

    expect(() => table.insert(values).returning({}), "返回结果不能为空").toThrowError();
  });
});
