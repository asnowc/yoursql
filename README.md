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

#### v.createExplicitValues() 和 v.createImplicitValues()

转换单个对象或对象数组为 VALUES

```ts
import { v } from "@asla/yoursql";

const values = [{ a: 1, b: undefined }, { c: 3 }];

// 这将自动选择数组中所有键的并集
v.createExplicitValues(values).text; // "(1,NULL,NULL),(NULL,NULL,3)"
v.createImplicitValues(values).text; // "(1,DEFAULT,NULL),(NULL,NULL,3)"

// 或者你可以指定选择键并指定顺序
const valueStr = v.createExplicitValues(values, ["c", "b"]).text; // "(NULL,2),(3,NULL)"

const sql = `INSERT INTO user(name, role) VALUES ${valueStr}`;
```

可以指定 SQL类型和 JS 类型断言

```ts
const objectList = [{ age: 1, name: "hhh" }, { age: 2, name: "row2" }, { age: 3, name: "row3" }, {}];

v.createExplicitValues("customName", objectList, {
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
  execute(sql: QueryInput | MultipleQueryInput): Promise<void> {
    // implement
  }

  query<T extends MultipleQueryResult = MultipleQueryResult>(sql: MultipleQueryInput): Promise<T>;
  query<T = any>(sql: QueryDataInput<T>): Promise<QueryRowsResult<T>>;
  query<T = any>(sql: QueryInput): Promise<QueryRowsResult<T>>;
  query<T = any>(sql: QueryInput | MultipleQueryInput): Promise<QueryRowsResult<T>> {
    // implement
  }
  multipleQuery<T extends MultipleQueryResult = MultipleQueryResult>(sql: StringLike): Promise<T> {
    // implement
  }
  /**
   * 执行多语句的方法
   * @deprecated 不建议使用。改用 query()
   */
  abstract multipleQuery<T extends MultipleQueryResult = MultipleQueryResult>(sql: SqlLike | SqlLike[]): Promise<T>;
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

#### DbQueryPool 抽象类

```ts
class YourPool extends DbQueryPool {
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

或者，使用 `using` 语法更优雅 (推荐)

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

或者，使用 `using` 语法更优雅 (推荐)

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

或者使用 `for await of` 更优雅 (推荐)

```ts
const cursor = await pool.cursor(sqlText);
for await (const element of cursor) {
  console.log(element);
  if (conditions) break; //提前关闭游标
}
```
