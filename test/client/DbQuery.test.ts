import { describe, beforeEach, test, expect, vi } from "vitest";
import { DbQuery } from "@asla/yoursql/client";

class MockDbQuery extends DbQuery {
  query = vi.fn();
  multipleQuery = vi.fn();
}

describe("DbQuery", () => {
  let dbQuery: MockDbQuery;

  beforeEach(() => {
    dbQuery = new MockDbQuery();
  });

  test("should call query with correct SQL and return rows in queryRows", async () => {
    const mockRows = [{ id: 1, name: "test" }];
    dbQuery.query.mockResolvedValue({ rowCount: 1, rows: mockRows });

    const result = await dbQuery.queryRows("SELECT * FROM users");
    expect(dbQuery.query).toHaveBeenCalledWith("SELECT * FROM users");
    expect(result).toEqual(mockRows);
  });

  test("should call query with correct SQL and return first row in queryFirstRow", async () => {
    const mockRows = [{ id: 1, name: "test" }];
    dbQuery.query.mockResolvedValue({ rowCount: 1, rows: mockRows });

    const result = await dbQuery.queryFirstRow("SELECT * FROM users");
    expect(dbQuery.query).toHaveBeenCalledWith("SELECT * FROM users");
    expect(result).toEqual(mockRows[0]);
  });

  test("should throw an error if queryFirstRow returns no rows", async () => {
    dbQuery.query.mockResolvedValue({ rowCount: 0, rows: [] });

    await expect(dbQuery.queryFirstRow("SELECT * FROM users")).rejects.toThrow("Query did not return any rows");
  });

  test("should call query with correct SQL and return row count in queryCount", async () => {
    dbQuery.query.mockResolvedValue({ rowCount: 5 });

    const result = await dbQuery.queryCount("UPDATE users SET name = 'test'");
    expect(dbQuery.query).toHaveBeenCalledWith("UPDATE users SET name = 'test'");
    expect(result).toBe(5);
  });

  test("should call multipleQuery with correct SQL and return rows in multipleQueryRows", async () => {
    const mockResults = [
      { rowCount: 1, rows: [{ id: 1, name: "test1" }] },
      { rowCount: 1, rows: [{ id: 2, name: "test2" }] },
    ];
    dbQuery.multipleQuery.mockResolvedValue(mockResults);

    const result = await dbQuery.multipleQueryRows("SELECT * FROM users; SELECT * FROM orders");
    expect(dbQuery.multipleQuery).toHaveBeenCalledWith("SELECT * FROM users; SELECT * FROM orders");
    expect(result).toEqual([[{ id: 1, name: "test1" }], [{ id: 2, name: "test2" }]]);
  });

  test("should call query with correct SQL and return a map in queryMap", async () => {
    const mockRows = [
      { id: 1, name: "test1" },
      { id: 2, name: "test2" },
    ];
    dbQuery.query.mockResolvedValue({ rowCount: 2, rows: mockRows });

    const result = await dbQuery.queryMap("SELECT * FROM users", "id");
    expect(dbQuery.query).toHaveBeenCalledWith("SELECT * FROM users");
    expect(result).toEqual(
      new Map([
        [1, { id: 1, name: "test1" }],
        [2, { id: 2, name: "test2" }],
      ])
    );
  });
});
