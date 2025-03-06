import { defineConfig } from "vitest/config";
//@ts-ignore
import path from "node:path";
//@ts-ignore
const root = import.meta.dirname;
export default defineConfig({
  esbuild: { target: "es2020" },
  test: {
    api: 8809,
    alias: [
      { find: /^@asla\/yoursql$/, replacement: path.join(root, "src/sql_gen/mod.ts") },
      { find: /^@asla\/yoursql\/client$/, replacement: path.join(root, "src/client/mod.ts") },
    ],
    coverage: {
      include: ["src"],
    },
  },
});
