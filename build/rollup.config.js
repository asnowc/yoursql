import esmTsPlugin from "@rollup/plugin-typescript";
import { defineConfig } from "rollup";

const tsPlugin = esmTsPlugin;

export default defineConfig({
  input: { "sql_gen/mod": "./src/sql_gen/mod.ts", "client/mod": "./src/client/mod.ts" },
  output: {
    dir: "dist",
    preserveModules: true,
    preserveModulesRoot: "src",
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
