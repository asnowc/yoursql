## select

与SQL 语法顺序有一些差异，SQL语法的 select column 写在最前面，但是 yoursql 的的 select column 在 join 之后

### 单表 select

```ts
Selection.from("user").select("*"); // SELECT * FROM user
Selection.from("user", "u").select("*"); // SELECT * FROM user AS u
Selection.from("user").select(["name AS n", "age"]); // SELECT name AS n,age FROM user
Selection.from("user").select({ n: "name", age: true }); // SELECT name AS n,age FROM user
```

### join

包括 crossJoin/naturalJoin/innerJoin/fullJoin/leftJoin/rightJoin

```ts
// SELECT u.name AS name,class_id AS c.id FROM user AS u
// INNER JOIN class AS c ON u.id=c.user_id AND u.type=c.type
Selection.from("user", "u")
  .innerJoin("class", "c", ["u.id=c.user_id", "u.type=c.type"])
  .select({ name: "u.name", class_id: "c.id" });
```

### where

todo

### group by

todo

### order by

todo

### limit offset

```ts
Selection.from("user").select("*").limit(10, 2); // SELECT * FROM user LIMIT 10 OFFSET 2
```

### 子选择语句
