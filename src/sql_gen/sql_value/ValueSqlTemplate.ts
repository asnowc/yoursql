import { SqlTemplate } from "../SqlStatement.ts";

export class ValueSqlTemplate implements SqlTemplate {
  readonly templates: readonly string[];
  readonly args: readonly unknown[];
  constructor(
    private v: (value: unknown) => string,
    templates: readonly string[],
    values: readonly unknown[],
  ) {
    this.templates = templates;
    this.args = values;
  }

  toTextTemplate(): { text: string; args: string[] } {
    const { templates, args } = this;
    let text = templates[0];
    for (let i = 1; i < templates.length; i++) {
      text += "$" + i;
      text += templates[i];
    }
    const values = args.map((value) => this.v(value));
    return { text, args: values };
  }

  genSql(): string {
    const { templates, args } = this;
    let sql = this.templates[0];
    for (let i = 1; i < templates.length; i++) {
      sql += this.v(args[i - 1]) + templates[i];
    }
    return sql;
  }
}
