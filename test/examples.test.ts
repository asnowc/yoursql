import { DbTable, DbTableQuery, createSelect } from "@asnc/yoursql";
import { test } from "vitest";

const t0 = new DbTable<{ c1: string; c2: number; c3: string | null }>("aaa", ["c1", "c2", "c3"]);
test("常用选择", function () {
  const sql = createSelect(t0, { c1: true, c2: "abc" }, { tableAs: "n2" })
    .select(t0, "*") //选择多个表格
    .innerJoin(t0, "*", { on: "" }) // join
    .addColumns({}) // 构造列
    .toQuery({
      //过滤、分组
      limit: 1,
      offset: 1,
      orderBy: { c1: "ASC" },
      orderNullRule: "FIRST",
      where: "",
    });
    sql.toSelect()
});
