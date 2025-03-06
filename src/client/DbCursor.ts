/** @public */
export interface DbCursorOption {
  defaultSize?: number;
}

/** @public */
export abstract class DbCursor<T> {
  /** 读取游标，如果读取结束，返回空数组 */
  abstract read(maxSize?: number): Promise<T[]>;
  /** 提前关闭游标，如果多次调用，会被忽略 */
  abstract close(): Promise<void>;
  // implement
  [Symbol.asyncDispose]() {
    return this.close();
  }
  async *[Symbol.asyncIterator]() {
    let data = await this.read();
    try {
      while (data.length) {
        yield* data;
        data = await this.read();
      }
    } finally {
      await this.close();
    }
  }
}
