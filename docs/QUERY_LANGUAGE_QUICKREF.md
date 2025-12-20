# Stream Query Language - Quick Reference

## What is it?

A SQL-like language for processing message streams in the browser. Think ksqlDB, but client-side.

## Key Features

- **SQL-like syntax** - Familiar to anyone who knows SQL
- **Stream-first** - Built for continuous data, not batch processing
- **Client-side only** - Runs entirely in browser, no backend needed
- **Web Workers** - Non-blocking execution for heavy transformations
- **No persistence** - All in-memory, focus on real-time processing

## Quick Examples

### Basic Query

```sql
SELECT user_id, COUNT(*) as event_count
FROM user_events
WHERE action = 'click'
WINDOW TUMBLING (SIZE 5 MINUTES)
GROUP BY user_id;
```

### JSON Processing

```sql
SELECT 
  data->>'user'->>'name' AS user_name,
  data->'items' AS items
FROM events;
```

### Stream Join

```sql
SELECT o.order_id, o.total, u.name
FROM orders o
INNER JOIN users u
  ON o.user_id = u.user_id
  WITHIN 1 MINUTE;
```

### Fan-Out

```sql
INSERT INTO high_value_orders
SELECT * FROM orders WHERE total > 1000;

INSERT INTO low_value_orders
SELECT * FROM orders WHERE total <= 1000;
```

### Ephemeral Streams (CTEs)

```sql
WITH filtered AS (
  SELECT * FROM orders WHERE status = 'active'
),
enriched AS (
  SELECT *, quantity * price AS total FROM filtered
)
SELECT * FROM enriched;
```

## Merge Strategies

| Strategy | Use Case | Example |
|----------|----------|---------|
| **UNION** | Combine similar streams | `SELECT * FROM a UNION SELECT * FROM b` |
| **MERGE** | Time-ordered interleaving | `MERGE ... ORDER BY timestamp` |
| **JOIN** | Correlate by key | `FROM a JOIN b ON a.id = b.id WITHIN 1 MINUTE` |
| **COMBINE** | Sync streams | `COMBINE ... ALIGN BY timestamp TOLERANCE 1 SEC` |

## Windowing

| Type | Description | Example |
|------|-------------|---------|
| **Tumbling** | Fixed, non-overlapping | `WINDOW TUMBLING (SIZE 5 MINUTES)` |
| **Hopping** | Overlapping | `WINDOW HOPPING (SIZE 10 MIN, ADVANCE BY 5 MIN)` |
| **Session** | Gap-based | `WINDOW SESSION (INACTIVITY GAP 15 MINUTES)` |

## Functions

### String Operations
- `UPPER()`, `LOWER()`, `CONCAT()`, `SUBSTRING()`, `REPLACE()`, `SPLIT()`, `LENGTH()`

### JSON Operations
- `data->>'path'` - Navigate JSON
- `JSON_EXTRACT()`, `JSON_KEYS()`, `JSON_LENGTH()`
- `JSON_ARRAY_MAP()`, `JSON_ARRAY_FILTER()`, `JSON_ARRAY_REDUCE()`

### Aggregations
- `COUNT()`, `SUM()`, `AVG()`, `MIN()`, `MAX()`
- `FIRST()`, `LAST()`, `COLLECT_LIST()`, `STDDEV()`

### Arithmetic
- Standard: `+`, `-`, `*`, `/`, `%`
- Functions: `ROUND()`, `CEIL()`, `FLOOR()`, `ABS()`

## Topic Types

Topics can connect to various sources:

| Type | Use Case |
|------|----------|
| **In-Memory** | Ephemeral streams, testing |
| **WebSocket** | Real-time bidirectional communication |
| **SSE** | Server-sent events (read-only) |
| **BroadcastChannel** | Inter-tab communication |

## Architecture

```
Query Text → Parser → Planner → Web Worker Executor → Results
                                   ↓
                              Topic Sources
                              (WS, SSE, etc)
```

## What's NOT Included (Yet)

- ❌ File/table persistence
- ❌ Complex pattern matching (MATCH_RECOGNIZE)
- ❌ User-defined functions (UDFs)
- ❌ Exactly-once processing guarantees
- ❌ Backpressure mechanisms (initial version)

## Full Documentation

- [Complete Design Document](./QUERY_LANGUAGE_DESIGN.md) - Full syntax and examples
- [Architecture Document](./QUERY_LANGUAGE_ARCHITECTURE.md) - Implementation details

## Status

🚧 **Design Phase** - Waiting for feedback before implementation
