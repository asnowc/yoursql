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
  test("update-from", function () {
    const expectSql = "UPDATE user AS u SET\nu.level= ub.level\nFROM user_backup AS ub\nWHERE u.id = ub.id";
    const base = table.update({ level: "ub.level" }, "u");
    const sql = base.from("user_backup AS ub").where("u.id = ub.id").toString();
    expect(sql, "使用 from 语句更新").toBe(expectSql);
  });
  test("update-from-multiple", function () {
    const expectSql = `UPDATE user AS a SET
a.level= b.level,a.name= c.name
FROM bbb AS b, ccc AS c
WHERE a.id = b.id AND a.name = c.name`;

    const base = table.update({ level: "b.level", name: "c.name" }, "a");
    const q1 = base.from("bbb AS b", "ccc AS c").where("a.id = b.id AND a.name = c.name").toString();
    expect(q1).toBe(expectSql);
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
  test("update-as", function () {
    expect(table.updateFrom({ id: 78n, name: "张三" }, "u").where("u.level > 10").toString(), "使用表别名更新").toBe(
      "UPDATE user AS u SET\nu.id= 78,\nu.name= '张三'\nWHERE u.level > 10"
    );
  });
  test("update-from", function () {
    expect(
      table
        .updateFrom({ id: 78n, name: "张三", level: new String("ub.level") }, "u")
        .from("user_backup AS ub")
        .where("u.id = ub.id AND ub.level < 50")
        .toString(),
      "使用 from 语句更新"
    ).toBe(
      "UPDATE user AS u SET\nu.id= 78,\nu.name= '张三',\nu.level= ub.level\nFROM user_backup AS ub\nWHERE u.id = ub.id AND ub.level < 50"
    );
  });
});
