import { DbPoolConnection, ConnectionNotAvailableError, DbQueryBase } from "@asla/yoursql/client";
import { describe, it, expect, vi, afterEach, test } from "vitest";

describe("DbPoolConnection", () => {
  const mockQuery = vi.fn();
  const mockExecute = vi.fn(async () => {});
  const mockOnRelease = vi.fn();

  const mockConnection: DbQueryBase = {
    query: mockQuery,
    execute: mockExecute,
    multipleQuery: vi.fn(),
  };

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should execute a query", async () => {
    const poolConnection = new DbPoolConnection(mockConnection, mockOnRelease);
    mockQuery.mockResolvedValue({ rows: [] });

    {
      const result = await poolConnection.query("SELECT * FROM users");

      expect(mockQuery).toHaveBeenCalledWith("SELECT * FROM users");
      expect(result).toEqual({ rows: [] });
    }
    {
      const result = await poolConnection.query(() => "SELECT * FROM users");

      expect(mockQuery).toHaveBeenCalledWith("SELECT * FROM users");
      expect(result).toEqual({ rows: [] });
    }
  });
  test("execute sql", async () => {
    const poolConnection = new DbPoolConnection(mockConnection, mockOnRelease);
    await poolConnection.execute("UPDATE users SET name = 'test'");

    expect(mockExecute).toHaveBeenCalledWith("UPDATE users SET name = 'test'");
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

  it("should call [Symbol.dispose] to release the connection", () => {
    const poolConnection = new DbPoolConnection(mockConnection, mockOnRelease);

    poolConnection[Symbol.dispose]();

    expect(poolConnection.released).toBe(true);
    expect(mockOnRelease).toHaveBeenCalled();
  });

  test("dispose calls onDispose callback", () => {
    const mockOnDispose = vi.fn();
    const poolConnection = new DbPoolConnection(mockConnection, mockOnRelease, mockOnDispose);
    poolConnection.dispose();

    expect(poolConnection.released).toBe(true);
    expect(mockOnDispose).toHaveBeenCalled();
    expect(mockOnRelease).not.toHaveBeenCalled();
  });

  test("dispose 和 release 只能调用其一", () => {
    const mockOnDispose = vi.fn();
    const mockOnRelease = vi.fn();
    const c1 = new DbPoolConnection(mockConnection, mockOnRelease, mockOnDispose);
    c1.dispose();
    c1.release();

    expect(c1.released).toBe(true);
    expect(mockOnDispose).toHaveBeenCalled();
    expect(mockOnRelease).not.toHaveBeenCalled();

    mockOnDispose.mockClear();
    mockOnRelease.mockClear();
    const c2 = new DbPoolConnection(mockConnection, mockOnRelease, mockOnDispose);
    c2.release();
    c2.dispose();
    expect(c2.released).toBe(true);
    expect(mockOnRelease).toHaveBeenCalled();
    expect(mockOnDispose).not.toHaveBeenCalled();
  });
});
