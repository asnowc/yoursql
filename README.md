[![ESM package][package]][package-url]
[![NPM version][npm]][npm-url]
[![JSR version][jsr]][jsr-url]
[![Install size][size]][size-url]

[package]: https://img.shields.io/badge/package-ESM-ffe536.svg
[package-url]: https://nodejs.org/api/esm.html
[npm]: https://img.shields.io/npm/v/@asla/yoursql.svg
[npm-url]: https://npmjs.com/package/@asla/yoursql
[jsr]: https://jsr.io/badges/@asla/yoursql
[jsr-url]: https://jsr.io/@asla/yoursql
[node]: https://img.shields.io/node/v/@asla/yoursql.svg
[node-url]: https://nodejs.org
[size]: https://packagephobia.com/badge?p=@asla%2Fyoursql
[size-url]: https://packagephobia.com/result?p=@asla%2Fyoursql

SQL 生成器

[API 文档](https://jsr.io/@asla/yoursql/doc)

### 安全转将 JS 值转换为 SQL 值，避免 SQL 注入

导入

```ts
import { v } from "@asla/yoursql";
```

默认情况下，支持 PostgresSQL, 因为不同数据库的值转换有些差异，如果使用其他数据库，可能需要配置对象转换器

```ts
v(1); // "1"
v(1n); // "1"
v("te'xt"); // "'te''xt'"
v(new Date()); // "'2024-11-30T05:08:33.112Z'"
v([1, 2, 3]); // "ARRAY[1,2,3]"
v({ id: "abc", size: 1 }); // "'{\"id\":\"abc\",\"size\":1}'"
v(null); // "NULL"
v(undefined); // "DEFAULT"
```

如果传入 String 对象，将保留其字符串值，不会进行任何转换

```ts
v(new String("1+1")); // "1+1"
```

你可以自定义对象到字符串的转换, 例如，你想将 Set 转换为 PostgresSql 的 ARRAY[] 输入格式

```ts
v.setTransformer(Set, function (value: Set) {
  return this.v(Array.from(value));
});
```

转换对象数组

```ts
const values = [{ a: 1, b: 2 }, { c: 3 }];

// 这将自动选择数组中所有键的并集
v.objectListToValuesList(values); // "(1,2,null),(null,null,3)"

// 或者你可以指定选择键并指定顺序
v.objectListToValuesList(values, ["c", "b"]); // "(null,2),(3,3)"
```

### 生成 SQL 语句

```ts
import { Selection, v } from "@asla/yoursql";

const searchName = "Bob";
const s = Selection.from("user", "u")
  .innerJoin("role", "r", "u.id=r.user_id")
  .select({ uid: "u.id", rid: "r.id", example: "u.id||r.id" }) // SELECT u.id AS uid, r.id AS rid u.id||u.id AS example
  .where(`u.name LIKE %${v(searchName)}%`)
  .toString();
```

### client 抽象类

yoursql 还导出了一些抽象类，实现抽象类后可以方便的进行数据查询

```ts
import {
  type DbQueryPool,
  type DbTransaction,
  type DbConnection,
  DbQuery,
  DbCursor,
  DbPoolConnection,
  DbPoolTransaction,
} from "@asla/yoursql/client";
```

#### DbQuery 抽象类

```ts
class YourQuery extends DbQuery {
  // implement
}
const db: DbQuery = new YourQuery();
```

```ts
declare const db: DbQuery;

type Row = { name: string; age: number };
const sqlText = "SELECT * FROM user";

const rows: Row[] = await db.queryRows<Row>(sqlText);
const count: number = await db.queryCount(sqlText);
const rows: Map<string, Row> = await db.queryMap<Row>(sqlText, "name");
```

#### DbQueryPool 接口

```ts
class YourPool extends DbQuery implements DbQuery {
  // implement
}
const pool: DbQueryPool = new YourPool();
```

##### 普通查询

```ts
const conn = await pool.connect();
try {
  await conn.queryRows(sqlText);
} finally {
  conn.release();
}
```

或者，使用 `using` 语法更优雅

```ts
using conn = await pool.connect();
await conn.queryRows(sqlText);
```

##### 事务查询

```ts
const conn = pool.begin();
try {
  await conn.queryRows(sqlText);
  await conn.queryRows(sqlText);
  await conn.commit();
} catch (e) {
  await conn.rollback();
  throw e;
}
```

或者，使用 `using` 语法更优雅

```ts
await using conn = pool.begin();

await conn.queryRows(sqlText);
await conn.queryRows(sqlText);
await conn.commit();
```

##### 游标查询

```ts
const cursor = await pool.cursor(sqlText);

let rows = await cursor.read(20);
while (rows.length) {
  console.log(rows);
  rows = await cursor.read(20);
  if (conditions) {
    await cursor.close(); // 提前关闭游标
    break;
  }
}
```

或者使用 `for await of` 更优雅

```ts
const cursor = await pool.cursor(sqlText);
for await (const element of cursor) {
  console.log(element);
  if (conditions) break; //提前关闭游标
}
```
