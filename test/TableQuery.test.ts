import { DbTableQuery, PgSqlValue } from "@asnc/yoursql";
import { test, expect, describe } from "vitest";

describe("TableQuery", function () {
  interface Table {
    name: string;
    level: number;
    id: bigint;
  }
  interface CreateTable {
    name: string;
    level?: number;
  }
  const tableColumns: (keyof Table)[] = ["name", "id", "level"];
  const table = new DbTableQuery<Table, CreateTable>("user", tableColumns, new PgSqlValue());
  describe("select", function () {
    test("select-columns", function () {
      expect(table.select("*").toString()).toMatchSnapshot();
      expect(table.select({ name: true, level: "rename_level", id: "id" }).toString()).toMatchSnapshot();
    });
    test("select-option", function () {
      const sql = table
        .select("*")
        .toQuery({
          limit: 100,
          offset: 23,
          orderBy: { id: "ASC" },
          orderNullRule: "FIRST",
          where: "limit IS NULL",
        })
        .toString();
      expect(sql).toMatchSnapshot();
    });
  });
  describe("update", function () {
    test("update-base", function () {
      expect(table.update({ id: 78n })).toMatchSnapshot();
      expect(table.update({ id: 78n }, { where: "id IS NULL" })).toMatchSnapshot();
    });
    test("update-error", function () {
      expect(() => table.update({}), "值为空").toThrowError();
    });
    test("updateWithResult", function () {
      expect(
        table.updateWithResult({ id: 78n }, { level: "rename", name: true }).toString(),
        "返回结果重命名"
      ).toMatchSnapshot();

      expect(() => table.updateWithResult({ id: 78n }, {})).toThrowError();
    });
  });
  describe("delete", function () {
    test("delete", function () {
      expect(table.delete({ where: "id IS NULL" })).toMatchSnapshot();
    });
    test("deleteWithResult", function () {
      expect(table.deleteWithResult("*").toString()).toMatchSnapshot();
      expect(table.deleteWithResult({ level: "rename", name: true }).toString(), "返回结果重命名").toMatchSnapshot();

      expect(() => table.deleteWithResult({})).toThrowError();
    });
  });
  describe("insert", function () {
    test("insert", function () {
      expect(
        table.insert([
          { name: "张三", level: 8 },
          { name: "王五", level: 9 },
        ])
      ).toMatchSnapshot();

      expect(
        table.insert([{ name: "张三" }], { conflict: ["id", "level"], updateValues: { level: 89 } }),
        "冲突更新"
      ).toMatchSnapshot();
    });
    test("insert-error", function () {
      expect(() => table.insert([])).toThrowError();
      expect(() => table.insert([{}, {}] as any)).toThrowError();
    });
    test("insertWithResult", function () {
      const values = [{ name: "hh" }];
      expect(
        table.insertWithResult(values, { level: "rename", name: true }).toString(),
        "返回结果重命名"
      ).toMatchSnapshot();

      expect(() => table.insertWithResult([], { level: true }), "插入值不能为空").toThrowError();
      expect(() => table.insertWithResult(values, {}), "返回结果不能为空").toThrowError();
    });
  });
});
