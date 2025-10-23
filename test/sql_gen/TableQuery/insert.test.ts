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
