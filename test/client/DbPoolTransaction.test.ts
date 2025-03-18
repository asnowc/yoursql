import { DbPoolTransaction, ParallelQueryError } from "@asla/yoursql/client";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { MockDbPoolConnection } from "./__mocks__/db_connection.ts";

test("未进行任何操作，直接 rollback() 会被忽略，且不获取连接", async function () {
  const conn = vi.fn();
  const transaction = new DbPoolTransaction(conn);
  await expect(transaction.rollback()).resolves.toBeUndefined();
  expect(conn).not.toBeCalled();
});
test("未进行任何操作，直接 commit() 会被忽略，且不获取连接", async function () {
  const conn = vi.fn();
  const transaction = new DbPoolTransaction(conn);
  await expect(transaction.commit()).resolves.toBeUndefined();
  expect(conn).not.toBeCalled();
});
test("rollback() 后直接释放连接", async function () {
  const conn = new MockDbPoolConnection();
  const connect = vi.fn(async () => conn);
  const transaction = new DbPoolTransaction(connect);

  await transaction.query("SELECT count(*) FROM test");
  await transaction.rollback();
  expect(conn.onRelease).toBeCalledTimes(1);
});
test("commit() 直接释放连接", async function () {
  const conn = new MockDbPoolConnection();
  const connect = vi.fn(async () => conn);
  const transaction = new DbPoolTransaction(connect);

  await transaction.query("SELECT count(*) FROM test");
  await transaction.commit();
  expect(conn.onRelease).toBeCalledTimes(1);
});
test("第一条语句与 begin 合并发生", async function () {
  const conn = new MockDbPoolConnection();
  const connect = vi.fn(async () => conn);
  const transaction = new DbPoolTransaction(connect);

  await transaction.query("SELECT count(*) FROM test");
  expect(conn.mockConn.multipleQuery, "BEGIN 和 query 合并发生").toBeCalledTimes(1);
  expect(conn.mockConn.query, "BEGIN 和 query 合并发生").toBeCalledTimes(0);
});
test("多次 commit() 或 rollback() 会被忽略", async function () {
  const conn = new MockDbPoolConnection();
  const connect = vi.fn(async () => conn);
  const transaction = new DbPoolTransaction(connect);

  await transaction.query("SELECT count(*) FROM test");
  await transaction.commit();
  expect(conn.mockConn.multipleQuery).toBeCalledTimes(1);
  expect(conn.mockConn.query).toBeCalledTimes(1);
  await transaction.commit();
  await transaction.rollback();
  await transaction.rollback();
  expect(conn.mockConn.query).toBeCalledTimes(1);
  expect(conn.mockConn.multipleQuery).toBeCalledTimes(1);
  expect(conn.onRelease).toBeCalledTimes(1);
});
test("不允许并行查询", async function () {
  const conn = new MockDbPoolConnection();
  const connect = vi.fn(async () => conn);
  const transaction = new DbPoolTransaction(connect);

  const p1 = transaction.query("SELECT count(*) FROM test");
  await expect(transaction.query("SELECT count(*) FROM test")).rejects.toThrowError(ParallelQueryError);
  expect(conn.mockConn.multipleQuery).toBeCalledTimes(1);
  expect(conn.mockConn.query).toBeCalledTimes(0);

  await p1;
  await expect(transaction.query("SELECT count(*) FROM test")).resolves.not.toBeUndefined();
  expect(conn.mockConn.multipleQuery).toBeCalledTimes(1);
  expect(conn.mockConn.query).toBeCalledTimes(1);
});

describe("事务执行出错", function () {
  let conn: MockDbPoolConnection;
  let transaction: DbPoolTransaction;
  beforeEach(function () {
    conn = new MockDbPoolConnection();
    transaction = new DbPoolTransaction(vi.fn(async () => conn));
  });
  test("事务第1条执行出错，应释放连接", async function ({}) {
    await expect(transaction.query("error sql")).rejects.toThrowError();
    expect(conn.onRelease).toBeCalledTimes(1);
    expect(conn.released).toBe(true);
  });
  test("事务第2条执行出错，应释放连接", async function () {
    await transaction.query("abc");

    await expect(transaction.query("error sql")).rejects.toThrowError();
    expect(conn.onRelease).toBeCalledTimes(1);
    expect(conn.released).toBe(true);
  });
  test("执行出错，试图再次 rollback", async function () {
    await expect(transaction.query("error sql")).rejects.toThrowError();
    const callCount = conn.mockConn.query.mock.calls.length;
    await transaction.rollback(); // rollback()
    expect(conn.mockConn.query.mock.calls.length, "rollback() 被忽略").toBe(callCount);
  });
});
test("errorRollback 为 true, 事务第1条执行出错，应释放连接, 并发送回滚", async function () {
  const conn = new MockDbPoolConnection();
  const transaction = new DbPoolTransaction(async () => conn, { errorRollback: true });

  await expect(transaction.query("error sql")).rejects.toThrowError();
  expect(conn.onRelease).toBeCalledTimes(1);
  expect(conn.mockConn.multipleQuery).toBeCalledTimes(1);
  expect(conn.mockConn.query).toBeCalledTimes(1);
  expect(conn.mockConn.query.mock.calls[0][0]).toBe("ROLLBACK");
});

test("errorRollback 为 true, 事务第2条执行出错，应释放连接, 并发送回滚", async function () {
  const conn = new MockDbPoolConnection();
  const transaction = new DbPoolTransaction(async () => conn, { errorRollback: true });

  await transaction.query("abc");
  await expect(transaction.query("error sql")).rejects.toThrowError();
  expect(conn.onRelease).toBeCalledTimes(1);

  expect(conn.mockConn.multipleQuery).toBeCalledTimes(1);
  expect(conn.mockConn.query).toBeCalledTimes(2);
  expect(conn.mockConn.query.mock.calls[1][0]).toBe("ROLLBACK");
});
