import { InferQueryResult, SqlStatementDataset, SqlTextStatementDataset } from "@asla/yoursql";
import { expectTypeOf, test } from "vitest";

test("推断类型", function () {
  expectTypeOf<InferQueryResult<SqlStatementDataset<{ age: number }>>>().toEqualTypeOf<{ age: number }>();

  expectTypeOf<InferQueryResult<SqlTextStatementDataset<{ age: number }>>>().toEqualTypeOf<{ age: number }>();
});
