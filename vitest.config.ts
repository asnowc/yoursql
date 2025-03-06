import { defineConfig } from "vitest/config";
//@ts-ignore
import path from "node:path";
//@ts-ignore
const root = import.meta.dirname;
export default defineConfig({
  esbuild: { target: "es2020" },
  test: {
    api: 8809,
    alias: [{ find: /^@asnc\/yoursql$/, replacement: path.resolve(root, "src/sql_gen/mod.ts") }],
    coverage: {
      include: ["src"],
    },
  },
});
