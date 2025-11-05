import { select } from "@asla/yoursql";
import { test, expect } from "vitest";

const t1 = "ccc";
const t2 = "bbb";

const s1 = select("*").from(t1);
const on = "t1.c1=t2.c1";

test("crossJoin", function () {
  expect(s1.crossJoin(t2 + " AS t1").toString()).toBe("SELECT *\nFROM ccc\nCROSS JOIN bbb AS t1");
  expect(s1.crossJoin(t2).toString()).toBe("SELECT *\nFROM ccc\nCROSS JOIN bbb");
});
test("naturalJoin", function () {
  expect(s1.naturalJoin(t2, { as: "t1" }).toString()).toBe("SELECT *\nFROM ccc\nNATURAL JOIN bbb AS t1");
});
test("innerJoin", function () {
  expect(s1.innerJoin(t2, { on, as: "t1" }).toString()).toBe("SELECT *\nFROM ccc\nINNER JOIN bbb AS t1 ON t1.c1=t2.c1");
});
test("fullJoin", function () {
  expect(s1.fullJoin(t2, { on, as: "t1" }).toString()).toBe("SELECT *\nFROM ccc\nFULL JOIN bbb AS t1 ON t1.c1=t2.c1");
});
test("leftJoin", function () {
  expect(s1.leftJoin(t2, { on, as: "t1" }).toString()).toBe("SELECT *\nFROM ccc\nLEFT JOIN bbb AS t1 ON t1.c1=t2.c1");
});
test("rightJoin", function () {
  expect(s1.rightJoin(t2, { on, as: "t1" }).toString()).toBe("SELECT *\nFROM ccc\nRIGHT JOIN bbb AS t1 ON t1.c1=t2.c1");
});
