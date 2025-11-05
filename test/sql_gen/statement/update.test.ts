import { update } from "@asla/yoursql";
import { test, expect, describe } from "vitest";

interface Table {
  name: string;
  level: number;
  id: bigint;
}

describe("update", function () {
  test("update", function () {
    //@ts-expect-error
    expect(update<Table>("user").set({ id: "78", k: undefined, c: "" }).toString(), "忽略 undefined 和空字符串").toBe(
      "UPDATE user SET\nid= 78",
    );
    expect(update<Table>("user").set({ level: "1" }).where("id IS NULL").toString()).toBe(`UPDATE user SET
level= 1
WHERE id IS NULL`);
  });
  test("update-error", function () {
    expect(() => update<Table>("user").set({}), "值为空").toThrowError();
    expect(
      //@ts-expect-error
      () => update<Table>("user").set({ id: "78", name: 1 }),
      "key对应的类型只能是 string 或 undefined 类型",
    ).toThrowError(TypeError);
  });
  test("update-from", function () {
    const expectSql = "UPDATE user AS u SET\nu.level= ub.level\nFROM user_backup AS ub\nWHERE u.id = ub.id";
    const base = update<Table>("user", { asName: "u" }).set({ level: "ub.level" });
    const sql = base.from("user_backup AS ub").where("u.id = ub.id").toString();
    expect(sql, "使用 from 语句更新").toBe(expectSql);
  });
  test("update-from-multiple", function () {
    const expectSql = `UPDATE user AS a SET
a.level= b.level,a.name= c.name
FROM bbb AS b, ccc AS c
WHERE a.id = b.id AND a.name = c.name`;

    const base = update<Table>("user", { asName: "a" }).set({ level: "b.level", name: "c.name" });
    const q1 = base.from("bbb AS b", "ccc AS c").where("a.id = b.id AND a.name = c.name").toString();
    expect(q1).toBe(expectSql);
  });
});
