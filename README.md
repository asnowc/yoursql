[![ESM package][package]][package-url] [![NPM version][npm]][npm-url]
[![JSR version][jsr]][jsr-url] [![Install size][size]][size-url]

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
默认情况下，支持 PostgresSQL,
因为不同数据库的值转换有些差异，如果使用其他数据库，可能需要配置对象到字符串的自定义转换器

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

如果传入 String 对象，将保留其字符串值，不会进行任何转换，
这在有些需要原生SQL操作的场景下非常有用

```ts
import { v } from "@asla/yoursql";

v(new String("1+1")); // "1+1"
```

你可以自定义对象到字符串的转换, 例如，你想将 Set 转换为 PostgresSql 的 ARRAY[]
输入格式

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
const objectList = [{ age: 1, name: "hhh" }, { age: 2, name: "row2" }, {
  age: 3,
  name: "row3",
}, {}];

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

查看 [select](./docs/select.md) 用法 查看
[insert/update/delete](./docs/table.md) 用法

#### Constructable

toto

#### ConditionParam

toto
