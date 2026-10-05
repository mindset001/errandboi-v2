/* eslint-disable @typescript-eslint/no-explicit-any */
// Minimal in-memory stand-in for the slice of the Supabase query builder our
// server code uses (select / update + eq / neq / is / in / or / limit /
// maybeSingle). Enough to run the money logic for real instead of mocking it.
type Row = Record<string, any>;
type Filter = (r: Row) => boolean;

class Query {
  private filters: Filter[] = [];
  private patch: Row | null = null;
  private max = Infinity;
  private selected = false;
  constructor(private rows: Row[]) {}

  select() { this.selected = true; return this; }
  update(patch: Row) { this.patch = patch; return this; }
  eq(c: string, v: any) { this.filters.push((r) => r[c] === v); return this; }
  neq(c: string, v: any) { this.filters.push((r) => r[c] !== v); return this; }
  is(c: string, v: null) { this.filters.push((r) => (r[c] ?? null) === v); return this; }
  in(c: string, vs: any[]) { this.filters.push((r) => vs.includes(r[c])); return this; }
  or(expr: string) {
    const parts = expr.split(",").map((p) => p.split("."));
    this.filters.push((r) => parts.some(([c, op, v]) => op === "eq" && r[c] === v));
    return this;
  }
  limit(n: number) { this.max = n; return this; }

  private run() {
    const matched = this.rows.filter((r) => this.filters.every((f) => f(r))).slice(0, this.max);
    if (this.patch) for (const r of matched) Object.assign(r, this.patch);
    return matched.map((r) => ({ ...r }));
  }
  maybeSingle() { return Promise.resolve({ data: this.run()[0] ?? null, error: null }); }
  single() { return this.maybeSingle(); }
  then(resolve: (v: any) => any, reject?: (e: any) => any) {
    return Promise.resolve({ data: this.run(), error: null }).then(resolve, reject);
  }
}

export function fakeAdmin(orders: Row[]) {
  return { from: (table: string) => { if (table !== "orders") throw new Error(`unexpected table ${table}`); return new Query(orders); } } as any;
}
