import { DbPoolConnection, ConnectionNotAvailableError, DbQueryBase } from "@asla/yoursql/client";
import { describe, it, expect, vi, afterEach } from "vitest";

describe("DbPoolConnection", () => {
  const mockQuery = vi.fn();
  const mockMultipleQuery = vi.fn();
  const mockOnRelease = vi.fn();

  const mockConnection: DbQueryBase = {
    query: mockQuery,
    multipleQuery: mockMultipleQuery,
  };

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should execute a query", async () => {
    const poolConnection = new DbPoolConnection(mockConnection, mockOnRelease);
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const result = await poolConnection.query("SELECT * FROM users");

    expect(mockQuery).toHaveBeenCalledWith("SELECT * FROM users");
    expect(result).toEqual({ rows: [] });
  });

  it("should throw an error if query is called after release", async () => {
    const poolConnection = new DbPoolConnection(mockConnection, mockOnRelease);
    poolConnection.release();

    await expect(poolConnection.query("SELECT * FROM users")).rejects.toThrow(ConnectionNotAvailableError);
  });

  it("should execute a transaction begin", async () => {
    const poolConnection = new DbPoolConnection(mockConnection, mockOnRelease);
    mockQuery.mockResolvedValueOnce(undefined);

    await poolConnection.begin();

    expect(mockQuery).toHaveBeenCalledWith("BEGIN");
  });

  it("should execute a transaction commit", async () => {
    const poolConnection = new DbPoolConnection(mockConnection, mockOnRelease);
    mockQuery.mockResolvedValueOnce(undefined);

    await poolConnection.commit();

    expect(mockQuery).toHaveBeenCalledWith("COMMIT");
  });

  it("should execute a transaction rollback", async () => {
    const poolConnection = new DbPoolConnection(mockConnection, mockOnRelease);
    mockQuery.mockResolvedValueOnce(undefined);

    await poolConnection.rollback();

    expect(mockQuery).toHaveBeenCalledWith("ROLLBACK");
  });

  it("should release the connection", () => {
    const poolConnection = new DbPoolConnection(mockConnection, mockOnRelease);

    poolConnection.release();

    expect(poolConnection.released).toBe(true);
    expect(mockOnRelease).toHaveBeenCalled();
  });

  it("should throw an error if multipleQuery is called after release", async () => {
    const poolConnection = new DbPoolConnection(mockConnection, mockOnRelease);
    poolConnection.release();

    await expect(poolConnection.multipleQuery("SELECT * FROM users; SELECT * FROM orders;")).rejects.toThrow(
      ConnectionNotAvailableError
    );
  });

  it("should call multipleQuery on the connection", async () => {
    const poolConnection = new DbPoolConnection(mockConnection, mockOnRelease);
    mockMultipleQuery.mockResolvedValueOnce({ results: [] });

    const result = await poolConnection.multipleQuery("SELECT * FROM users; SELECT * FROM orders;");

    expect(mockMultipleQuery).toHaveBeenCalledWith("SELECT * FROM users; SELECT * FROM orders;");
    expect(result).toEqual({ results: [] });
  });

  it("should call [Symbol.dispose] to release the connection", () => {
    const poolConnection = new DbPoolConnection(mockConnection, mockOnRelease);

    poolConnection[Symbol.dispose]();

    expect(poolConnection.released).toBe(true);
    expect(mockOnRelease).toHaveBeenCalled();
  });
});
