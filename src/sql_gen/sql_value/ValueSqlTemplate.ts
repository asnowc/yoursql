import { SqlTemplate, SqlTextTemplate, SqlStatement } from "../SqlStatement.ts";

/** @alpha */
export class TemplateSqlStatement extends SqlStatement implements SqlTemplate, SqlTextTemplate {
  readonly templates: readonly string[];
  readonly args: readonly unknown[];
  constructor(
    private v: (value: unknown) => string,
    templates: readonly string[],
    values: readonly unknown[],
  ) {
    super();
    this.templates = templates;
    this.args = values;
  }
  #textArgs?: readonly string[];
  get textArgs(): readonly string[] {
    if (!this.#textArgs) {
      const textArgs = this.args.map((value) => this.v(value));
      this.#textArgs = textArgs;
    }
    return this.#textArgs;
  }
  #textTemplate?: string;
  get textTemplate(): string {
    if (this.#textTemplate === undefined) {
      const { templates } = this;
      let text = templates[0];
      for (let i = 1; i < templates.length; i++) {
        text += "$" + i;
        text += templates[i];
      }
      this.#textTemplate = text;
    }
    return this.#textTemplate;
  }
  toTextArgs(): string[] {
    return [...this.textArgs];
  }
  genSql(): string {
    const { templates } = this;
    const textArgs = this.textArgs;
    let sql = this.templates[0];
    for (let i = 1; i < templates.length; i++) {
      sql += textArgs[i - 1] + templates[i];
    }
    return sql;
  }
}
