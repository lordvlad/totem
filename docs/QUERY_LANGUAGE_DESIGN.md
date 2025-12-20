# Stream Query Language Design for Totem

## Overview

This document outlines the design of a human-readable query language for consuming, transforming, and producing message streams within Totem's client-side architecture. The language draws inspiration from ksqlDB while adapting to browser-based constraints and focusing on real-time stream processing without persistence.

## Design Goals

1. **Human Readable**: SQL-like syntax that is intuitive for users familiar with SQL or ksqlDB
2. **Stream-First**: Native support for continuous data streams and windowing operations
3. **Client-Side Execution**: Runs entirely in the browser using Web Workers for compute-intensive operations
4. **No Persistence**: Focus on in-memory stream processing without file or table storage
5. **Composable**: Support for ephemeral streams (CTEs) to enable complex transformations
6. **Flexible Merging**: Multiple strategies for combining streams (union, join, merge, zip)

## Architecture

### Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Query Parser                             │
│  (Converts SQL-like queries to AST)                         │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                  Query Planner                               │
│  (Optimizes and plans execution strategy)                   │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                Stream Executor (Web Worker)                  │
│  - Source Operators (consume from topics)                   │
│  - Transform Operators (map, filter, window)                │
│  - Merge Operators (join, union, combine)                   │
│  - Sink Operators (produce to topics)                       │
└─────────────────────────────────────────────────────────────┘
```

### Stream Model

- **Topics**: Named streams of messages (ephemeral or connected to external systems)
- **Messages**: JSON objects with timestamp metadata
- **Windows**: Time-based or count-based groupings of messages
- **Ephemeral Streams**: Temporary streams defined within queries (similar to CTEs)

## Query Language Syntax

### Basic Stream Consumption

```sql
-- Select all messages from a topic
SELECT * FROM topic_name;

-- Select specific fields
SELECT field1, field2, timestamp 
FROM topic_name;

-- Filter messages
SELECT * 
FROM topic_name
WHERE field1 > 100 AND field2 = 'active';
```

### Transformations

#### Arithmetic Operations

```sql
-- Basic arithmetic
SELECT 
  quantity * price AS total,
  (quantity * price) * 1.1 AS total_with_tax,
  ROUND(quantity * price, 2) AS rounded_total
FROM orders;
```

#### String Manipulation

```sql
-- String operations (inspired by SQL and jq)
SELECT 
  UPPER(name) AS name_upper,
  LOWER(name) AS name_lower,
  CONCAT(first_name, ' ', last_name) AS full_name,
  SUBSTRING(description, 0, 100) AS preview,
  REPLACE(text, 'old', 'new') AS updated_text,
  SPLIT(tags, ',') AS tag_array,
  LENGTH(message) AS message_length
FROM messages;
```

#### JSON Manipulation

```sql
-- JSON path access (inspired by jq)
SELECT 
  data->>'user'->>'name' AS user_name,
  data->'items'->>0 AS first_item,
  data->'metadata' AS metadata_obj,
  JSON_EXTRACT(data, '$.user.email') AS user_email,
  JSON_KEYS(data) AS available_keys,
  JSON_LENGTH(data->'items') AS item_count
FROM events;

-- JSON construction
SELECT 
  JSON_OBJECT(
    'id', id,
    'name', name,
    'computed', value * 2
  ) AS result
FROM source_topic;

-- JSON array operations
SELECT 
  JSON_ARRAY_MAP(items, 'x => x * 2') AS doubled_items,
  JSON_ARRAY_FILTER(items, 'x => x > 10') AS filtered_items,
  JSON_ARRAY_REDUCE(items, 'acc, x => acc + x', 0) AS sum
FROM array_topic;
```

### Windowing Operations

```sql
-- Tumbling window (fixed, non-overlapping)
SELECT 
  user_id,
  COUNT(*) AS event_count,
  AVG(value) AS avg_value
FROM events
WINDOW TUMBLING (SIZE 5 MINUTES)
GROUP BY user_id;

-- Hopping window (overlapping)
SELECT 
  user_id,
  COUNT(*) AS event_count
FROM events
WINDOW HOPPING (SIZE 10 MINUTES, ADVANCE BY 5 MINUTES)
GROUP BY user_id;

-- Session window (gap-based)
SELECT 
  user_id,
  COUNT(*) AS events_in_session
FROM events
WINDOW SESSION (INACTIVITY GAP 15 MINUTES)
GROUP BY user_id;

-- Count-based window
SELECT 
  AVG(temperature) AS avg_temp
FROM sensors
WINDOW TUMBLING (SIZE 100 ROWS);
```

### Ephemeral Streams (CTEs)

```sql
-- Define temporary streams using WITH clause
WITH filtered_orders AS (
  SELECT * 
  FROM orders 
  WHERE status = 'active'
),
enriched_orders AS (
  SELECT 
    o.*,
    o.quantity * o.price AS total
  FROM filtered_orders o
)
SELECT * FROM enriched_orders;

-- Multiple ephemeral streams
WITH 
  high_value AS (
    SELECT * FROM orders WHERE total > 1000
  ),
  recent AS (
    SELECT * FROM high_value WHERE timestamp > NOW() - INTERVAL 1 HOUR
  )
SELECT * FROM recent;
```

### Stream Merging and Combining

#### UNION (Combine multiple streams, preserving order)

```sql
-- Union streams of the same schema
SELECT * FROM topic1
UNION
SELECT * FROM topic2;

-- Union with transformation
SELECT 'source1' AS source, * FROM topic1
UNION
SELECT 'source2' AS source, * FROM topic2;
```

#### JOIN (Correlate streams based on keys and time)

```sql
-- Inner join with time window
SELECT 
  o.order_id,
  o.total,
  u.name,
  u.email
FROM orders o
INNER JOIN users u
  ON o.user_id = u.user_id
  WITHIN 1 HOUR;

-- Left join
SELECT 
  o.*,
  p.product_name
FROM orders o
LEFT JOIN products p
  ON o.product_id = p.product_id
  WITHIN 30 MINUTES;

-- Stream-stream join (both sides are streams)
SELECT 
  c.click_id,
  i.impression_id,
  i.timestamp AS impression_time,
  c.timestamp AS click_time
FROM clicks c
INNER JOIN impressions i
  ON c.ad_id = i.ad_id
  WITHIN 5 MINUTES;
```

#### MERGE (Time-ordered merge of streams)

```sql
-- Merge streams by timestamp (interleaving)
SELECT * FROM (
  MERGE 
    SELECT * FROM stream1,
    SELECT * FROM stream2,
    SELECT * FROM stream3
  ORDER BY timestamp
);

-- Merge with priority (stream1 messages take precedence)
MERGE PRIORITY
  SELECT * FROM high_priority,
  SELECT * FROM normal_priority
ORDER BY timestamp;
```

#### COMBINE (Zip streams element-wise)

```sql
-- Combine corresponding elements from multiple streams
SELECT 
  s1.sensor_id,
  s1.temperature,
  s2.humidity,
  s3.pressure
FROM (
  COMBINE
    SELECT * FROM temperature_sensors s1,
    SELECT * FROM humidity_sensors s2,
    SELECT * FROM pressure_sensors s3
  ALIGN BY timestamp TOLERANCE 1 SECOND
);
```

### Fan-Out (Produce to Multiple Topics)

```sql
-- Simple fan-out
INSERT INTO high_value_orders
SELECT * FROM orders WHERE total > 1000;

INSERT INTO low_value_orders
SELECT * FROM orders WHERE total <= 1000;

-- Fan-out with transformation
INSERT INTO topic1
SELECT id, name FROM source;

INSERT INTO topic2
SELECT id, UPPER(name) AS name_upper FROM source;

-- Conditional fan-out using CASE
INSERT INTO 
  CASE 
    WHEN status = 'active' THEN active_orders
    WHEN status = 'pending' THEN pending_orders
    ELSE archived_orders
  END
SELECT * FROM orders;
```

### Aggregations

```sql
-- Standard aggregations
SELECT 
  user_id,
  COUNT(*) AS event_count,
  SUM(amount) AS total_amount,
  AVG(amount) AS avg_amount,
  MIN(amount) AS min_amount,
  MAX(amount) AS max_amount,
  FIRST(amount) AS first_amount,
  LAST(amount) AS last_amount,
  COLLECT_LIST(amount) AS amounts,
  STDDEV(amount) AS stddev_amount
FROM events
WINDOW TUMBLING (SIZE 5 MINUTES)
GROUP BY user_id;

-- Having clause
SELECT 
  user_id,
  COUNT(*) AS event_count
FROM events
WINDOW TUMBLING (SIZE 5 MINUTES)
GROUP BY user_id
HAVING COUNT(*) > 10;
```

### Stream Control

```sql
-- Emit frequency control
SELECT * FROM topic
EMIT EVERY 1 SECOND;

-- Emit on changes
SELECT * FROM topic
EMIT ON CHANGE;

-- Emit on window close
SELECT 
  COUNT(*) AS count
FROM topic
WINDOW TUMBLING (SIZE 1 MINUTE)
EMIT ON WINDOW CLOSE;
```

## Merge Strategies Deep Dive

### 1. UNION - Combine schemas

**Use case**: Combine streams with identical or compatible schemas

```sql
-- Simple union (preserves order within each stream)
SELECT * FROM stream_a
UNION
SELECT * FROM stream_b;
```

**Behavior**:
- Messages from both streams are combined
- Relative order within each stream is preserved
- No guarantee about interleaving between streams
- Duplicate messages are NOT removed (use UNION DISTINCT if needed)

### 2. MERGE - Time-ordered interleaving

**Use case**: Combine streams into a single time-ordered stream

```sql
MERGE
  SELECT * FROM stream_a,
  SELECT * FROM stream_b
ORDER BY timestamp;
```

**Behavior**:
- Messages are interleaved based on timestamp
- Creates a single timeline from multiple sources
- Useful for audit logs, event sourcing
- Requires all messages to have timestamps

### 3. JOIN - Correlation by key

**Use case**: Correlate related events from different streams

```sql
SELECT *
FROM stream_a a
INNER JOIN stream_b b
  ON a.id = b.id
  WITHIN 5 MINUTES;
```

**Behavior**:
- Matches messages based on join key
- Time window controls how long to wait for matches
- Inner/Left/Right/Outer join semantics apply
- Buffers messages within the time window

### 4. COMBINE/ZIP - Element-wise pairing

**Use case**: Synchronize streams that should have corresponding elements

```sql
COMBINE
  SELECT * FROM stream_a,
  SELECT * FROM stream_b
ALIGN BY timestamp TOLERANCE 1 SECOND;
```

**Behavior**:
- Pairs messages that are close in time
- Waits for corresponding message from all streams
- Useful for synchronizing sensor readings
- Can drop unpaired messages or pad with nulls

### 5. COGROUP - Group before joining

**Use case**: Aggregate before correlating

```sql
SELECT 
  a.user_id,
  COLLECT_LIST(a.event) AS events_a,
  COLLECT_LIST(b.event) AS events_b
FROM stream_a a
COGROUP stream_b b
  ON a.user_id = b.user_id
  WINDOW TUMBLING (SIZE 1 MINUTE);
```

**Behavior**:
- Groups messages from both streams by key and window
- Useful for comparing aggregated metrics
- Each group can have multiple messages from each stream

## Query Examples

### Example 1: Simple Event Filtering and Transformation

```sql
-- Monitor high-value orders in real-time
SELECT 
  order_id,
  user_id,
  quantity * price AS total,
  UPPER(status) AS status,
  timestamp
FROM orders
WHERE quantity * price > 1000
  AND status IN ('pending', 'processing');
```

### Example 2: Clickstream Analysis with Windows

```sql
-- Count clicks per user per 5-minute window
WITH click_events AS (
  SELECT 
    user_id,
    page_url,
    timestamp
  FROM clickstream
  WHERE event_type = 'click'
)
SELECT 
  user_id,
  COUNT(*) AS click_count,
  COLLECT_LIST(page_url) AS pages_visited
FROM click_events
WINDOW TUMBLING (SIZE 5 MINUTES)
GROUP BY user_id
HAVING COUNT(*) > 5;
```

### Example 3: Stream Enrichment with Join

```sql
-- Enrich orders with user information
SELECT 
  o.order_id,
  o.total,
  u.name,
  u.email,
  u.customer_tier
FROM orders o
INNER JOIN users u
  ON o.user_id = u.user_id
  WITHIN 1 MINUTE;
```

### Example 4: Complex JSON Processing

```sql
-- Extract and transform nested JSON events
WITH parsed_events AS (
  SELECT 
    event_id,
    data->>'user'->>'id' AS user_id,
    data->>'user'->>'name' AS user_name,
    data->'items' AS items_json,
    timestamp
  FROM raw_events
  WHERE data->>'type' = 'purchase'
)
SELECT 
  user_id,
  user_name,
  JSON_ARRAY_LENGTH(items_json) AS item_count,
  JSON_ARRAY_REDUCE(
    JSON_ARRAY_MAP(items_json, 'x => x.price * x.quantity'),
    'acc, x => acc + x',
    0
  ) AS total_amount
FROM parsed_events;
```

### Example 5: Multi-Stream Merge with Fan-Out

```sql
-- Combine logs from multiple services and route by severity
WITH all_logs AS (
  SELECT 'api' AS service, * FROM api_logs
  UNION
  SELECT 'worker' AS service, * FROM worker_logs
  UNION
  SELECT 'frontend' AS service, * FROM frontend_logs
),
categorized_logs AS (
  SELECT 
    *,
    CASE 
      WHEN severity = 'error' OR severity = 'critical' THEN 'high'
      WHEN severity = 'warning' THEN 'medium'
      ELSE 'low'
    END AS priority
  FROM all_logs
)
-- Fan out to different topics
INSERT INTO high_priority_alerts
SELECT * FROM categorized_logs WHERE priority = 'high';

INSERT INTO medium_priority_logs
SELECT * FROM categorized_logs WHERE priority = 'medium';

INSERT INTO low_priority_logs
SELECT * FROM categorized_logs WHERE priority = 'low';
```

### Example 6: Session-Based Analytics

```sql
-- Detect user sessions and compute metrics
SELECT 
  user_id,
  COUNT(*) AS events_in_session,
  MIN(timestamp) AS session_start,
  MAX(timestamp) AS session_end,
  MAX(timestamp) - MIN(timestamp) AS session_duration,
  COLLECT_LIST(page_url) AS pages_visited
FROM user_events
WINDOW SESSION (INACTIVITY GAP 30 MINUTES)
GROUP BY user_id;
```

### Example 7: Real-Time Anomaly Detection

```sql
-- Detect spikes in error rates
WITH error_rates AS (
  SELECT 
    service_name,
    COUNT(*) AS total_requests,
    SUM(CASE WHEN status >= 500 THEN 1 ELSE 0 END) AS error_count,
    SUM(CASE WHEN status >= 500 THEN 1 ELSE 0 END) * 100.0 / COUNT(*) AS error_rate
  FROM requests
  WINDOW TUMBLING (SIZE 1 MINUTE)
  GROUP BY service_name
)
SELECT 
  service_name,
  error_rate,
  'ALERT' AS status
FROM error_rates
WHERE error_rate > 5.0;
```

## Implementation Considerations

### 1. Parser

- Use a parser generator (e.g., PEG.js, nearley) or hand-written recursive descent parser
- Generate Abstract Syntax Tree (AST) from query text
- Validate syntax and semantic correctness

### 2. Query Planner

- Optimize query execution plan
- Push down filters and projections
- Reorder operations for efficiency
- Detect opportunities for parallelization

### 3. Stream Executor

- Implement as Web Worker for non-blocking execution
- Support backpressure and flow control
- Handle out-of-order messages
- Manage memory for windowing and joins
- Provide progress and error feedback

### 4. Operator Library

**Source Operators**:
- `TopicSource`: Read from a topic
- `IntervalSource`: Generate periodic messages
- `ArraySource`: Emit array elements as stream

**Transform Operators**:
- `Map`: Transform each message
- `Filter`: Select messages based on predicate
- `Window`: Group messages by time or count
- `Aggregate`: Compute aggregations over groups

**Merge Operators**:
- `Union`: Combine streams
- `Merge`: Time-ordered interleaving
- `Join`: Correlate by key and time
- `Combine`: Element-wise pairing

**Sink Operators**:
- `TopicSink`: Write to a topic
- `ConsoleSink`: Log to console (debugging)
- `CallbackSink`: Invoke callback for each message

### 5. Type System

- Infer types from JSON schema or sample data
- Support dynamic typing for flexibility
- Provide type checking for better error messages

### 6. Error Handling

- Syntax errors: Report line and column
- Semantic errors: Invalid field references, type mismatches
- Runtime errors: Division by zero, null references
- Provide helpful error messages with context

### 7. Testing Strategy

- Unit tests for parser, operators, and utilities
- Integration tests for complete queries
- Performance tests for throughput and latency
- Property-based tests for correctness

## Future Enhancements

1. **Pattern Matching**: Detect complex event patterns (e.g., MATCH_RECOGNIZE)
2. **User-Defined Functions**: Allow custom JavaScript functions
3. **Stateful Transformations**: Support for more complex state management
4. **Query Optimization**: Advanced optimization rules
5. **Visual Query Builder**: Drag-and-drop query construction
6. **Query Persistence**: Save and load queries
7. **Metrics and Monitoring**: Query performance metrics
8. **Schema Evolution**: Handle schema changes gracefully

## Open Questions for Feedback

1. **External Integration**: How should topics connect to external systems (WebSockets, Server-Sent Events, etc.)?
2. **State Management**: Should we use Valtio for query state, or a separate state management solution?
3. **UI Integration**: Should this be a separate tool or integrated into the existing Totem UI?
4. **Execution Model**: Single query at a time, or support for concurrent queries?
5. **Backpressure**: How should we handle slow consumers?
6. **Ordering Guarantees**: What ordering guarantees should we provide?
7. **Late Arrival**: How to handle late-arriving messages in windows?

## References

- [ksqlDB Documentation](https://docs.ksqldb.io/)
- [Apache Flink SQL](https://nightlies.apache.org/flink/flink-docs-master/docs/dev/table/sql/overview/)
- [jq Manual](https://stedolan.github.io/jq/manual/)
- [RxJS Operators](https://rxjs.dev/guide/operators)
- [Kafka Streams](https://kafka.apache.org/documentation/streams/)
