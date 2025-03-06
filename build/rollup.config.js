import esmTsPlugin from "@rollup/plugin-typescript";
import { defineConfig } from "rollup";

const tsPlugin = esmTsPlugin;

export default defineConfig({
  input: { sql_gen: "./src/sql_gen/mod.ts", client: "./src/client/mod.ts" },
  output: {
    dir: "dist",
  },
  plugins: [
    tsPlugin({
      include: ["./src/**"],
      compilerOptions: {
        target: "ES2022",
        module: "nodenext",
        declaration: true,
        declarationDir: "dist",
        declarationMap: true,
      },
    }),
  ],
});
