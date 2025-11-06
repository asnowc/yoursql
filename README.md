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

### v()

安全转将 JS 值转换为 SQL 值，避免 SQL 注入

`v` 函数能够将 JS 值转换为 SQL 的文本形式。\
默认情况下，支持 PostgresSQL, 因为不同数据库的值转换有些差异，如果使用其他数据库，可能需要配置对象到字符串的自定义转换器

```ts
import { v } from "@asla/yoursql";

v(1); // "1"
v(1n); // "1"
v("te'xt"); // "'te''xt'"
v(new Date()); // "'2024-11-30T05:08:33.112Z'"
v([1, 2, 3]); // "ARRAY[1,2,3]"
v({ id: "abc", size: 1 }); // "'{\"id\":\"abc\",\"size\":1}'"
v(null); // "NULL"
v(undefined); // "DEFAULT"

const params = { id: 3 };
const sql = `SELECT * FROM user WHERE user_id=${v(params.id)}`;
```

如果传入 String 对象，将保留其字符串值，不会进行任何转换， 这在有些需要原生SQL操作的场景下非常有用

```ts
import { v } from "@asla/yoursql";

v(new String("1+1")); // "1+1"
```

你可以自定义对象到字符串的转换, 例如，你想将 Set 转换为 PostgresSql 的 ARRAY[] 输入格式

```ts
import { v } from "@asla/yoursql";

v.setTransformer(Set, function (value: Set) {
  return this.v(Array.from(value));
});

v(new Set([1, 2, 3])); // "ARRAY[1,2,3]"
```

#### v.toValues()

转换数组为 values 的单个值

```ts
import { v } from "@asla/yoursql";
v.toValues([1, "abc", null, undefined, { key: "value" }]); // `1,'abc',NULL,DEFAULT,'{"key":"value"}'`
```

#### v.objectToValue()

转换对象为 values 的单个值

```ts
import { v } from "@asla/yoursql";
const obj = { a: "a1", b: "b1", c: undefined, d: "d1" };
v.objectToValue(obj); // "'a1','b1',DEFAULT,'d1'"
v.objectToValue(obj, ["b", "a"]); // "'b1','a1'"
v.objectToValue(obj, [{ a: "TEXT", b: {} }]); // 'a1'::TEXT,'b1'"
```

#### v.objectListToValues()

转换对象数组为 values

```ts
import { v } from "@asla/yoursql";

const values = [{ a: 1, b: 2 }, { c: 3 }];

// 这将自动选择数组中所有键的并集
v.objectListToValues(values); // "(1,2,null),(null,null,3)"

// 或者你可以指定选择键并指定顺序
const valueStr = v.objectListToValues(values, ["c", "b"]); // "(null,2),(3,3)"

const sql = `INSERT INTO user(name, role) VALUES ${valueStr}`;
```

#### v.createValues()

```ts
const objectList = [{ age: 1, name: "hhh" }, { age: 2, name: "row2" }, { age: 3, name: "row3" }, {}];

v.createValues("customName", objectList, {
  age: { sqlType: "INT", sqlDefault: "MAXIMUM(1,2)" },
  name: "TEXT",
});
//这将返回
`(VALUES
  (1::INT,'hhh'::TEXT),
  (2,'row2'),
  (3,'row3'),
  (MAXIMUM(1,2),NULL))
  AS customName(age,name)`;
```

### 生成 SQL 语句

```ts
import { select, v } from "@asla/yoursql";

const searchName = "Bob";
const s = select({ uid: "u.id", rid: "r.id", example: "u.id||r.id" })
  .from("user AS u")
  .innerJoin("role", { as: "r", on: "u.id=r.user_id" })
  .where(`u.name LIKE %${v(searchName)}%`)
  .toString();
```

查看 [select](./docs/select.md) 用法
查看 [insert/update/delete](./docs/table.md) 用法

#### Constructable

toto

#### ConditionParam

toto

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
  query<T = any>(sql: StringLike): Promise<QueryRowsResult<T>> {
    // implement
  }
  multipleQuery<T extends MultipleQueryResult = MultipleQueryResult>(sql: StringLike): Promise<T> {
    // implement
  }
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

### 扩展查询链

```ts
import { v, SqlStatement, SqlStatementDataset, SqlValuesCreator } from "@asla/yoursql";
import type { DbCursor, QueryResult, QueryRowsResult } from "@asla/yoursql/client";

declare const pool: DbQueryPool = new YourPool(); // 你需要实现一个 DbQueryPool

export interface QueryableSql {
  query(): Promise<QueryResult>;
  queryCount(): Promise<number>;
}
export interface QueryableDataSql<T> extends QueryableSql {
  queryRows(): Promise<T[]>;
  queryMap<K>(key: string): Promise<Map<K, T>>;
  cursor(): Promise<DbCursor<T>>;
}
declare module "@asla/yoursql" {
  interface SqlStatement extends QueryableSql {}
  interface SqlStatementDataset<T> extends QueryableDataSql<T> {}
}
const base: QueryableSql = {
  queryCount(): Promise<number> {
    return dbPool.queryCount(this.toString());
  },
  query(): Promise<QueryRowsResult<any>> {
    return dbPool.query<any>(this);
  },
};
const obj: QueryableDataSql<any> = {
  ...base,
  cursor(): Promise<DbCursor<any>> {
    return dbPool.cursor(this.toString());
  },
  queryMap<K>(key: string): Promise<Map<K, any>> {
    return dbPool.queryMap(this.toString(), key);
  },
  queryRows(): Promise<any[]> {
    return dbPool.queryRows(this.toString());
  },
};

Object.assign(SqlStatement.prototype, base);
Object.assign(SqlStatementDataset.prototype, obj);
```

现在，以及扩展了 SqlStatement 和 SqlStatementDataset 类的原型链，你可以从 select 等语句直接调用查询方法了

```ts
import { Selection, v } from "@asla/yoursql";

const searchName = "Bob";
const rows = await Selection.from("user", "u")
  .innerJoin("role", "r", "u.id=r.user_id")
  .select({ uid: "u.id", rid: "r.id", example: "u.id||r.id" })
  .where(`u.name LIKE %${v(searchName)}%`)
  .queryRows();
```
