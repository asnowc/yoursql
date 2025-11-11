import { withAs, withRecursiveAs } from "@asla/yoursql";
import { describe, expect, test } from "vitest";

describe("cte", function () {
  test("withAs", function () {
    const cte1 = withAs("cte1", "SELECT * FROM table1");
    expect(cte1.toString()).toBe("WITH \ncte1 AS(SELECT * FROM table1)");

    const cte2 = withAs("cte2 AS(SELECT * FROM table2)");
    expect(cte2.toString()).toBe("WITH \ncte2 AS(SELECT * FROM table2)");
  });

  test("multi withAs", function () {
    const cte = withAs("cte1", "SELECT * FROM table1")
      .as("cte2", "SELECT * FROM table2")
      .as("cte3", "SELECT * FROM table3");

    expect(cte.toString()).toBe(
      "WITH \ncte1 AS(SELECT * FROM table1),\ncte2 AS(SELECT * FROM table2),\ncte3 AS(SELECT * FROM table3)",
    );
  });
});
describe("withRecursiveAs", function () {
  test("withRecursiveAs", function () {
    const cte1 = withRecursiveAs("cte1", "SELECT * FROM table1");
    expect(cte1.toString()).toBe("WITH RECURSIVE \ncte1 AS(SELECT * FROM table1)");

    const cte2 = withRecursiveAs("cte2 AS(SELECT * FROM table2)");
    expect(cte2.toString()).toBe("WITH RECURSIVE \ncte2 AS(SELECT * FROM table2)");
  });

  test("multi withRecursiveAs", function () {
    const cte = withRecursiveAs("cte1", "SELECT * FROM table1")
      .as("cte2", "SELECT * FROM table2")
      .as("cte3", "SELECT * FROM table3");

    expect(cte.toString()).toBe(
      "WITH RECURSIVE \ncte1 AS(SELECT * FROM table1),\ncte2 AS(SELECT * FROM table2),\ncte3 AS(SELECT * FROM table3)",
    );
  });
});
