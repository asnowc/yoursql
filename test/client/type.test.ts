import { InferQueryResult, SqlStatementDataset, SqlTextStatementDataset } from "@asla/yoursql";
import { expectTypeOf } from "vitest";

expectTypeOf<InferQueryResult<SqlStatementDataset<{ age: number }>>>().toEqualTypeOf<{ age: number }>();

expectTypeOf<InferQueryResult<SqlTextStatementDataset<{ age: number }>>>().toEqualTypeOf<{ age: number }>();
