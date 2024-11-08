import { DbTableQuery, pgSqlTransformer, SqlValuesCreator } from "@asnc/yoursql";
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
  const table = new DbTableQuery<Table, CreateTable>("user", new SqlValuesCreator(pgSqlTransformer));
  describe("select", function () {
    test("select-columns", function () {
      expect(table.fromAs().select("*").toString()).toMatchSnapshot();
      expect(table.fromAs().select({ name: true, rename_level: "level", id: "id" }).toString()).toMatchSnapshot();
    });
    test("select-option", function () {
      const sql = table
        .fromAs()
        .select("*")
        .where("limit IS NULL")
        .orderBy(["id ASC NULLS FIRST"])
        .limit(100, 23)
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

      expect(table.insert("VALUES('张三')", ["name"]), "字符串值").toMatchSnapshot();
    });
    test("insert-error", function () {
      expect(() => table.insert([])).toThrowError();
      expect(() => table.insert([{}, {}] as any)).toThrowError();
      expect(() => table.insert({} as any)).toThrowError();
      //@ts-ignore
      expect(() => table.insert("VALUES(1)"), "没有指定列").toThrowError();
      expect(() => table.insert("VALUES(1)", []), "没有指定列").toThrowError();
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
