import { deleteFrom } from "@asla/yoursql";
import { test, expect } from "vitest";

test("delete", function () {
  expect(deleteFrom("user").where("id IS NULL").toString()).toBe("DELETE FROM user\nWHERE id IS NULL");
});
test("deleteWithResult", function () {
  expect(deleteFrom("user").returning("*").toString()).toBe("DELETE FROM user\nRETURNING *");
  expect(deleteFrom("user").returning({ level: "rename", name: true }).toString(), "返回结果重命名").toBe(
    "DELETE FROM user\nRETURNING rename AS level,name",
  );
});
test("deleteWithResult 不能为空", function () {
  expect(() => deleteFrom("user").returning({})).toThrowError();
});

test("delete from as using", function () {
  expect(
    deleteFrom("user", { asName: "a" }).using("user_table AS u").where("u.id > 10 AND u.id= a.id").toString(),
  ).toBe("DELETE FROM user AS a\nUSING user_table AS u\nWHERE u.id > 10 AND u.id= a.id");
});
test("delete from as using multiple", function () {
  const s = deleteFrom("user", { asName: "a" })
    .using("user_table AS b", "another_table AS c")
    .where("a.id =b.id OR a.id=c.id");

  expect(s.toString()).toBe(
    "DELETE FROM user AS a\nUSING user_table AS b, another_table AS c\nWHERE a.id =b.id OR a.id=c.id",
  );
});
