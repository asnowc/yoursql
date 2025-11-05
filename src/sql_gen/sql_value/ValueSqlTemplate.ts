import { SqlTemplate } from "../SqlStatement.ts";

export class ValueSqlTemplate implements SqlTemplate {
  readonly templates: readonly string[];
  readonly values: readonly unknown[];
  constructor(
    private v: (value: unknown) => string,
    templates: readonly string[],
    values: readonly unknown[],
  ) {
    this.templates = templates;
    this.values = values;
  }

  toTextTemplate(): { text: string; values: string[] } {
    let text = "";
    for (let i = 0; i < this.values.length; i++) {
      text += this.templates[i];
      text += "$" + (i + 1);
    }
    const values = this.values.map((value) => this.v(value));
    return { text, values };
  }

  genSql(): string {
    let sql = "";
    for (let i = 0; i < this.values.length; i++) {
      sql += this.templates[i];
      sql += this.v(this.values[i]);
    }
    sql += this.templates[this.values.length];
    return sql;
  }
}
