import { select } from "@asla/yoursql";
import { test, expect } from "vitest";

const t = select("*").from("aaa");
test("orderBy", function () {
  expect(t.orderBy("a").genSql()).toBe("SELECT *\nFROM aaa\nORDER BY a");
  expect(t.orderBy(["a DESC", "a ASC"]).genSql()).toBe("SELECT *\nFROM aaa\nORDER BY a DESC,a ASC");

  expect(t.orderBy({ asc: true, key: "a" }).genSql()).toBe("SELECT *\nFROM aaa\nORDER BY a ASC");
  expect(t.orderBy({ asc: true, key: "a", nullLast: true }).genSql()).toBe(
    "SELECT *\nFROM aaa\nORDER BY a ASC NULLS LAST",
  );
  expect(t.orderBy({ asc: true, key: "a", nullLast: false }).genSql()).toBe(
    "SELECT *\nFROM aaa\nORDER BY a ASC NULLS FIRST",
  );

  expect(t.orderBy({ target: "ASC NULLS LAST", key: "a" }).genSql()).toBe(
    "SELECT *\nFROM aaa\nORDER BY a ASC NULLS LAST",
  );

  const c2 = t.orderBy([
    { asc: true, key: "a" },
    { key: "b", target: "DESC" },
  ]);
  expect(c2.genSql()).toBe("SELECT *\nFROM aaa\nORDER BY a ASC,b DESC");
});

test("orderBy empty", function () {
  expect(t.orderBy().genSql()).toBe("SELECT *\nFROM aaa");
  expect(t.orderBy("").genSql()).toBe("SELECT *\nFROM aaa");
  expect(t.orderBy([]).genSql()).toBe("SELECT *\nFROM aaa");
});
