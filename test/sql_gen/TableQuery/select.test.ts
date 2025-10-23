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
  test("select-from-multiple", function () {
    const sql = table
      .fromAs("u")
      .from("table_a", "a")
      .from("table_b", "b")
      .select("*")
      .where("u.id = a.id AND u.level > 10")
      .toString();
    expect(sql).toBe("SELECT *\nFROM user AS u,table_a AS a,table_b AS b\nWHERE u.id = a.id AND u.level > 10");
  });
});
