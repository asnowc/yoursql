import { select } from "@asla/yoursql";
import { test, expect, describe } from "vitest";

describe("where", () => {
  const base = select("*").from("users");
  const baseStr = "SELECT *\nFROM users";
  test("where string", () => {
    expect(base.where("id = 1").toString()).toBe(baseStr + "\nWHERE id = 1");
    expect(base.where("id = 1 OR name LIKE 'a'").toString()).toBe(baseStr + "\nWHERE id = 1 OR name LIKE 'a'");
  });

  test("where with array combined with AND", () => {
    const sql = base.where(["id = 1", "name = 'John'"]);
    expect(sql.toString()).toBe(baseStr + "\nWHERE id = 1 AND name = 'John'");

    expect(base.where([]).toString()).toBe(baseStr);
  });

  test("complex where with function", () => {
    const sql = base.where(() => "age > 18 AND (name = 'John' OR name = 'Jane')");
    expect(sql.toString()).toBe(baseStr + "\nWHERE age > 18 AND (name = 'John' OR name = 'Jane')");
  });

  test("where with empty string", () => {
    expect(base.where().toString()).toBe(baseStr);
    expect(base.where([]).toString()).toBe(baseStr);
    expect(base.where("").toString()).toBe(baseStr);
    expect(base.where(() => undefined).toString()).toBe(baseStr);
    expect(base.where(() => "").toString()).toBe(baseStr);
  });
});

describe("having", () => {
  const base = select("age, count(*)").from("users").groupBy("age");
  const baseStr = "SELECT age, count(*)\nFROM users\nGROUP BY age";
  test("where string", () => {
    expect(base.having("id = 1").toString()).toBe(baseStr + "\nHAVING id = 1");
    expect(base.having("id = 1 OR name LIKE 'a'").toString()).toBe(baseStr + "\nHAVING id = 1 OR name LIKE 'a'");
  });

  test("where with array combined with AND", () => {
    const sql = base.having(["id = 1", "name = 'John'"]);
    expect(sql.toString()).toBe(baseStr + "\nHAVING id = 1 AND name = 'John'");
  });

  test("complex where with function", () => {
    const sql = base.having(() => "age > 18 AND (name = 'John' OR name = 'Jane')");
    expect(sql.toString()).toBe(baseStr + "\nHAVING age > 18 AND (name = 'John' OR name = 'Jane')");
  });

  test("where with empty string", () => {
    expect(base.having().toString()).toBe(baseStr);
    expect(base.having([]).toString()).toBe(baseStr);
    expect(base.having("").toString()).toBe(baseStr);
    expect(base.having(() => undefined).toString()).toBe(baseStr);
    expect(base.having(() => "").toString()).toBe(baseStr);
  });
});
