# Tessellate vs. Quiver: filtered vector search (published by Tessellate Inc., 2026-05)

Dataset: 50M vectors, 768-dim, 10% selectivity filter.

| Engine | Version | Filtered p95 (ms) |
|---|---|---|
| Tessellate | 4.0 | 34 |
| Quiver | 2.1 | 141 |

Conclusion: Tessellate is over 4x faster for filtered search.
