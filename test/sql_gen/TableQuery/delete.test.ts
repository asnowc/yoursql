import { DbTableQuery, pgSqlTransformer, SqlValuesCreator } from "@asla/yoursql";
import { test, expect } from "vitest";

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

test("delete", function () {
  expect(table.delete({ where: "id IS NULL" }).toString()).toBe("DELETE FROM user\nWHERE id IS NULL");
});
test("deleteWithResult", function () {
  expect(table.delete().returning("*").toString()).toBe("DELETE FROM user\nRETURNING *");
  expect(table.delete().returning({ level: "rename", name: true }).toString(), "返回结果重命名").toBe(
    "DELETE FROM user\nRETURNING rename AS level,name"
  );
});
test("deleteWithResult 不能为空", function () {
  expect(() => table.delete().returning({})).toThrowError();
});

test("delete from as using", function () {
  expect(table.delete({ asName: "a" }).using("user_table AS u").where("u.id > 10 AND u.id= a.id").toString()).toBe(
    "DELETE FROM user AS a\nUSING user_table AS u\nWHERE u.id > 10 AND u.id= a.id"
  );
});
test("delete from as using multiple", function () {
  const s = table
    .delete({ asName: "a" })
    .using("user_table AS b", "another_table AS c")
    .where("a.id =b.id OR a.id=c.id");

  expect(s.toString()).toBe(
    "DELETE FROM user AS a\nUSING user_table AS b, another_table AS c\nWHERE a.id =b.id OR a.id=c.id"
  );
});
