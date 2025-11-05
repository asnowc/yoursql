import { select } from "@asla/yoursql";
import { test, expect } from "vitest";

test("groupBy", function () {
  const t = select("*").from("aaa");
  expect(t.groupBy("c1").toString()).toBe("SELECT *\nFROM aaa\nGROUP BY c1");
  expect(t.groupBy(["c1", "c2"]).toString()).toBe("SELECT *\nFROM aaa\nGROUP BY c1,c2");

  expect(t.groupBy("c1").having("COUNT(c1) > 1").toString()).toBe(
    "SELECT *\nFROM aaa\nGROUP BY c1\nHAVING COUNT(c1) > 1",
  );
});
test("groupBy empty", function () {
  const t = select("*").from("aaa");
  expect(t.groupBy().toString()).toBe("SELECT *\nFROM aaa");
  expect(t.groupBy([]).toString()).toBe("SELECT *\nFROM aaa");
});
