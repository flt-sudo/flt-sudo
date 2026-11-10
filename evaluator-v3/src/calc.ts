/**
 * Deterministic arithmetic evaluator (recursive descent). Never uses eval/Function.
 * Grammar: expr := term (('+'|'-') term)* ; term := power (('*'|'/') power)* ;
 * power := unary ('^' power)? ; unary := '-' unary | primary ;
 * primary := number | ident '(' args ')' | '(' expr ')'
 * Numbers may contain '_' thousands separators (',' is reserved for function arguments) and a trailing '%' (divides by 100).
 */
const FUNCS: Record<string, (...a: number[]) => number> = {
  min: Math.min,
  max: Math.max,
  abs: Math.abs,
  sqrt: Math.sqrt,
  round: (x: number, d = 0) => Math.round(x * 10 ** d) / 10 ** d,
  ln: Math.log,
  exp: Math.exp,
};

export function evaluate(src: string): number {
  let i = 0;
  const s = src.replace(/\s+/g, "");
  const peek = () => s[i];
  const fail = (msg: string): never => {
    throw new Error(`calc: ${msg} at position ${i} in "${src}"`);
  };
  const eat = (c: string) => (s[i] === c ? (i++, true) : false);

  function expr(): number {
    let v = term();
    for (;;) {
      if (eat("+")) v += term();
      else if (eat("-")) v -= term();
      else return v;
    }
  }
  function term(): number {
    let v = power();
    for (;;) {
      if (eat("*")) v *= power();
      else if (eat("/")) {
        const d = power();
        if (d === 0) fail("division by zero");
        v /= d;
      } else return v;
    }
  }
  function power(): number {
    const b = unary();
    return eat("^") ? b ** power() : b;
  }
  function unary(): number {
    return eat("-") ? -unary() : eat("+") ? unary() : primary();
  }
  function primary(): number {
    if (eat("(")) {
      const v = expr();
      if (!eat(")")) fail("expected )");
      return v;
    }
    const num = /^(\d[\d_]*(\.\d+)?|\.\d+)(e[+-]?\d+)?%?/i.exec(s.slice(i));
    if (num) {
      i += num[0].length;
      let t = num[0].replace(/_/g, "");
      const pct = t.endsWith("%");
      if (pct) t = t.slice(0, -1);
      const v = Number(t);
      return pct ? v / 100 : v;
    }
    const id = /^[a-z]+/i.exec(s.slice(i));
    if (id) {
      const f = FUNCS[id[0].toLowerCase()];
      if (!f) fail(`unknown function ${id[0]}`);
      i += id[0].length;
      if (!eat("(")) fail("expected (");
      const args = [expr()];
      while (eat(",")) args.push(expr());
      if (!eat(")")) fail("expected )");
      return f!(...args);
    }
    return fail(`unexpected ${peek() ?? "end of input"}`);
  }

  const v = expr();
  if (i !== s.length) fail("trailing input");
  if (!Number.isFinite(v)) fail("non-finite result");
  return v;
}

export function withinTolerance(actual: number, claimed: number, relTol: number): boolean {
  if (actual === claimed) return true;
  const scale = Math.max(Math.abs(actual), Math.abs(claimed), 1e-12);
  return Math.abs(actual - claimed) / scale <= relTol;
}
