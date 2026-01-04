/** @public */
export interface SqlValuesDataset {
  readonly columns: readonly string[];
  readonly text: string;

  toSelect(name: string): string;
}

export class ExplicitSqlValues implements SqlValuesDataset {
  constructor(
    public columns: readonly string[],
    readonly columnsSqlType: readonly string[],
    firstValues: string[],
    nextRows: string[],
  ) {
    this.#firstValues = firstValues;
    this.#rows = nextRows;
  }
  #rows: string[];
  #firstValues: string[];
  #text?: string;
  get text(): string {
    if (!this.#text) {
      this.#text = this.#genText();
    }
    return this.#text;
  }
  #genText(): string {
    const { columnsSqlType } = this;
    const firstValues = this.#firstValues;
    let firstRow: string[] = new Array(firstValues.length);
    for (let i = 0; i < firstValues.length; i++) {
      firstRow[i] = firstValues[i];
      if (columnsSqlType[i]) firstRow[i] += "::" + columnsSqlType[i];
    }
    const base = "(" + firstRow.join(",") + ")";
    if (this.#rows.length === 0) {
      return base;
    }
    return "(" + firstRow.join(",") + "),\n" + this.#rows.join(",\n");
  }
  /**
   * @example
   * ```ts
   *  const t = v.createImplicitValues(
   *    [
   *      { id: 1, name: "name1" },
   *      { id: 2, name: "name2" },
   *    ],
   *    { id: "INT", name: "VARCHAR" },
   *  );
   *  // 返回 (VALUES (1::INT,'name1'::VARCHAR),(2,'name2')) AS t1(id,name)
   *  t.toSelect("t1(id,name)")
   * ```
   */
  toSelect(name: string): string {
    return `(VALUES\n${this.text})\nAS ${name}(${this.columns.join(",")})`;
  }
}
