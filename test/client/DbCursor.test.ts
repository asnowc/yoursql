import { DbCursor } from "@asla/yoursql/client";
import { vi, test, expect } from "vitest";

class MockDbCursor extends DbCursor<any> {
  close = vi.fn();
  read = vi.fn<(maxSize?: number) => Promise<any[]>>();
}

test("迭代器", async function () {
  const cursor = new MockDbCursor();

  let times = 2;
  cursor.read.mockImplementation(async (maxSize = 4) => {
    if (times-- === 0) return [];
    const rows = new Array(maxSize);
    for (let i = 0; i < maxSize; i++) {
      rows[i] = i;
    }
    return rows;
  });

  await expect(Array.fromAsync(cursor)).resolves.toEqual([0, 1, 2, 3, 0, 1, 2, 3]);
});
test("asyncDispose", async function () {
  function createCursor() {
    const cursor = new MockDbCursor();
    cursor.read.mockImplementationOnce(async () => {
      return [1, 2, 3, 4];
    });
    return cursor;
  }

  async function get() {
    await using cursor = createCursor();
    const list = await cursor.read();
    return cursor;
  }
  const cursor = await get();
  expect(cursor.close).toBeCalled();

  async function getAndClose() {
    await using cursor = createCursor();
    const list = await cursor.read();
    await cursor.close();
    return cursor;
  }
  const cursor2 = await getAndClose();
  expect(cursor2.close).toBeCalled();
});
