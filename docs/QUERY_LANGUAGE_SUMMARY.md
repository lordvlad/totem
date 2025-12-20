# Stream Query Language - Design Summary

## Executive Summary

This proposal adds a **SQL-like stream processing query language** to Totem, enabling real-time data transformation and routing. Inspired by ksqlDB but adapted for client-side execution.

## What Problem Does This Solve?

Current web applications struggle with:
- Complex real-time data transformations
- Coordinating multiple event streams  
- Imperative callback-heavy code
- No declarative way to express stream logic

## Proposed Solution

A query language that lets you write:

```sql
-- Instead of complex imperative code:
SELECT 
  user_id,
  COUNT(*) as actions,
  AVG(duration) as avg_duration
FROM user_events
WHERE event_type = 'interaction'
WINDOW TUMBLING (SIZE 5 MINUTES)
GROUP BY user_id
HAVING COUNT(*) > 10;
```

## Core Capabilities Matrix

| Capability | Supported | Example |
|------------|-----------|---------|
| **Filtering** | ✅ | `WHERE status = 'active'` |
| **Projection** | ✅ | `SELECT id, name, total` |
| **Arithmetic** | ✅ | `quantity * price AS total` |
| **String ops** | ✅ | `UPPER(name)`, `CONCAT()`, `SPLIT()` |
| **JSON ops** | ✅ | `data->>'user'->>'name'` |
| **Windowing** | ✅ | `WINDOW TUMBLING (SIZE 5 MINUTES)` |
| **Aggregation** | ✅ | `COUNT()`, `AVG()`, `SUM()`, etc. |
| **Joins** | ✅ | `FROM a JOIN b ON a.id = b.id WITHIN 1 MIN` |
| **Unions** | ✅ | `SELECT * FROM a UNION SELECT * FROM b` |
| **CTEs** | ✅ | `WITH filtered AS (...) SELECT * FROM filtered` |
| **Fan-out** | ✅ | `INSERT INTO topic1 ... INSERT INTO topic2` |
| **Pattern matching** | ❌ | Future: `MATCH_RECOGNIZE` |
| **UDFs** | ❌ | Future: Custom JavaScript functions |
| **Persistence** | ❌ | Out of scope (per requirements) |

## Syntax Overview

### Basic Structure

```sql
[WITH ephemeral_stream AS (subquery)]
SELECT columns
FROM source_topic
[JOIN other_topic ON condition WITHIN time_window]
[WHERE conditions]
[WINDOW window_spec]
[GROUP BY columns]
[HAVING conditions]
[INSERT INTO target_topic];
```

### Window Types

```sql
-- Tumbling (non-overlapping 5-min windows)
WINDOW TUMBLING (SIZE 5 MINUTES)

-- Hopping (10-min windows, advancing every 5 min)
WINDOW HOPPING (SIZE 10 MINUTES, ADVANCE BY 5 MINUTES)

-- Session (group events with <15 min gaps)
WINDOW SESSION (INACTIVITY GAP 15 MINUTES)

-- Count-based
WINDOW TUMBLING (SIZE 100 ROWS)
```

### Merge Strategies

```
┌─────────┐
│ UNION   │  Simple concatenation
├─────────┤  • Same schema
│ Stream1 │  • Preserves per-stream order
│ Stream2 │  • No correlation
└─────────┘

┌─────────┐
│ MERGE   │  Time-ordered interleaving
├─────────┤  • Sorted by timestamp
│ S1──S2  │  • Creates unified timeline
│ ──S1──S2│  • Requires timestamps
└─────────┘

┌─────────┐
│ JOIN    │  Correlate by key + time
├─────────┤  • Match on keys
│ S1══S2  │  • Within time window
│   ══    │  • Buffers for matching
└─────────┘

┌─────────┐
│COMBINE  │  Element-wise pairing
├─────────┤  • Align by timestamp
│ S1++S2  │  • Wait for all streams
│   ++++  │  • Synchronization
└─────────┘
```

## Architecture Fit

### Aligns with Totem's ADRs

| ADR | How Query Language Fits |
|-----|------------------------|
| **ADR-001** (Client-side only) | ✅ All execution in browser |
| **ADR-002** (Web Workers) | ✅ Executor runs in worker |
| **ADR-009** (Valtio) | ✅ Query metadata in Valtio |
| **ADR-003** (Bun) | ✅ Same build/test tools |

### Component Integration

```
┌──────────────────────────────────────────────┐
│              Totem UI (React)                │
├──────────────────────────────────────────────┤
│  • Query Editor (new)                        │
│  • Results Viewer (new)                      │
│  • Topic Browser (new)                       │
└────────────┬─────────────────────────────────┘
             │
┌────────────▼─────────────────────────────────┐
│         Valtio State (existing)              │
│  • Query metadata                            │
│  • Topic registry                            │
│  • UI state                                  │
└────────────┬─────────────────────────────────┘
             │
┌────────────▼─────────────────────────────────┐
│       Stream Executor (Web Worker)           │
│  • Parser                                    │
│  • Planner                                   │
│  • Operator graph                            │
│  • Topic connections                         │
└──────────────────────────────────────────────┘
```

## Topic Sources

Topics abstract over various data sources:

```typescript
// In-memory (default for ephemeral streams)
const topic = registry.createInMemoryTopic('temp_stream');

// WebSocket (bidirectional)
const topic = registry.createWebSocketTopic('events', 'wss://api.example.com/stream');

// Server-Sent Events (unidirectional)
const topic = registry.createSSETopic('notifications', 'https://api.example.com/sse');

// BroadcastChannel (cross-tab)
const topic = registry.createBroadcastTopic('shared_state');
```

## Use Case Examples

### 1. Real-Time Analytics Dashboard

```sql
-- Monitor API response times
SELECT 
  endpoint,
  COUNT(*) as request_count,
  AVG(duration_ms) as avg_duration,
  PERCENTILE(duration_ms, 0.95) as p95_duration
FROM api_requests
WINDOW TUMBLING (SIZE 1 MINUTE)
GROUP BY endpoint
HAVING avg_duration > 1000;
```

### 2. Event Correlation

```sql
-- Match clicks with impressions for ad analytics
SELECT 
  i.ad_id,
  i.impression_id,
  c.click_id,
  c.timestamp - i.timestamp as time_to_click
FROM impressions i
INNER JOIN clicks c
  ON i.ad_id = c.ad_id
  WITHIN 5 MINUTES;
```

### 3. Multi-Source Aggregation

```sql
-- Combine logs from microservices
WITH all_logs AS (
  SELECT 'api' as service, * FROM api_logs
  UNION
  SELECT 'worker' as service, * FROM worker_logs
  UNION
  SELECT 'frontend' as service, * FROM frontend_logs
)
SELECT 
  service,
  severity,
  COUNT(*) as count
FROM all_logs
WINDOW TUMBLING (SIZE 1 MINUTE)
GROUP BY service, severity;
```

### 4. Session Analysis

```sql
-- Detect user sessions and engagement
SELECT 
  user_id,
  COUNT(*) as page_views,
  COLLECT_LIST(page_url) as pages,
  MAX(timestamp) - MIN(timestamp) as session_duration
FROM page_views
WINDOW SESSION (INACTIVITY GAP 30 MINUTES)
GROUP BY user_id
HAVING COUNT(*) > 1;
```

### 5. Alerting with Fan-Out

```sql
-- Route errors by severity
WITH errors AS (
  SELECT * FROM logs WHERE level IN ('ERROR', 'CRITICAL')
)
INSERT INTO critical_alerts
SELECT * FROM errors WHERE level = 'CRITICAL';

INSERT INTO error_notifications
SELECT * FROM errors WHERE level = 'ERROR';
```

## Implementation Phases

### Phase 1: Foundation (MVP)
- [ ] Query parser (basic SELECT/FROM/WHERE)
- [ ] Core operators (source, map, filter, sink)
- [ ] Web Worker setup
- [ ] In-memory topics
- [ ] Basic UI (query editor + results)

### Phase 2: Transformations
- [ ] Arithmetic operations
- [ ] String functions
- [ ] JSON path access
- [ ] Projection and aliasing

### Phase 3: Windowing
- [ ] Tumbling windows
- [ ] Aggregation functions
- [ ] GROUP BY support
- [ ] HAVING clause

### Phase 4: Composition
- [ ] CTEs (WITH clause)
- [ ] UNION support
- [ ] Basic joins (INNER)
- [ ] Multiple outputs (fan-out)

### Phase 5: Advanced Merging
- [ ] MERGE (time-ordered)
- [ ] COMBINE (zip)
- [ ] Hopping windows
- [ ] Session windows
- [ ] Outer joins

### Phase 6: Polish
- [ ] Error handling
- [ ] Query metrics
- [ ] Performance optimization
- [ ] Documentation
- [ ] Examples

## Performance Considerations

### Memory Management

| Feature | Memory Strategy |
|---------|----------------|
| **Streaming** | Constant memory (pass-through) |
| **Windows** | Bounded buffer (time/count limited) |
| **Joins** | Bounded buffer (time window) |
| **Aggregations** | Per-group state (bounded keys) |

### Throughput Expectations

| Scenario | Expected Throughput |
|----------|-------------------|
| **Simple filter** | 100K+ msgs/sec |
| **Arithmetic transform** | 50K+ msgs/sec |
| **JSON parsing** | 20K+ msgs/sec |
| **Windowed aggregation** | 10K+ msgs/sec |
| **Stream join** | 5K+ msgs/sec |

*Note: Actual performance depends on message size and complexity*

## Risk Analysis

| Risk | Mitigation |
|------|-----------|
| **Memory overflow** | Fixed buffer sizes, backpressure signals |
| **Browser compatibility** | Target modern browsers, detect features |
| **Performance** | Web Workers, optimization, benchmarking |
| **Complexity** | Incremental rollout, good docs, examples |
| **Adoption** | Clear use cases, simple getting started |

## Success Metrics

How we'll know this is successful:

1. **Functional**: Users can express stream logic in <20 lines vs >100 lines imperative code
2. **Performance**: Handles 10K msgs/sec for typical queries
3. **Usability**: New users can write basic queries in <5 minutes
4. **Adoption**: Used in at least 3 real-world scenarios
5. **Reliability**: <1% error rate in production use

## Comparison to Alternatives

| Feature | This Design | RxJS | Plain Callbacks |
|---------|-------------|------|-----------------|
| **Declarative** | ✅ SQL syntax | ⚠️ Operator chains | ❌ Imperative |
| **Joins** | ✅ Native | ⚠️ Complex | ❌ Manual |
| **Windowing** | ✅ Native | ✅ Yes | ❌ Manual |
| **Learning curve** | ✅ SQL familiar | ⚠️ Steep | ✅ Simple |
| **Debugging** | ⚠️ New tooling | ⚠️ Difficult | ✅ Standard |
| **Performance** | ✅ Optimized | ✅ Good | ⚠️ Variable |

## Questions & Feedback Requested

### Critical Questions

1. **Primary use cases**: What specific problems would this solve for Totem users?
2. **Integration scope**: Separate tool or core Totem feature?
3. **Topic sources**: What external systems need connecting?
4. **Persistence**: Do we need to reconsider the no-persistence constraint?

### Design Feedback

5. **Syntax**: Are there SQL patterns that feel wrong for streams?
6. **Merge strategies**: Are the 4 strategies sufficient?
7. **Windowing**: Any other window types needed?
8. **Functions**: Critical missing functions?

### Implementation Feedback

9. **Phasing**: Is the 6-phase rollout reasonable?
10. **Performance**: Are throughput expectations realistic?
11. **Testing**: What test coverage is expected?
12. **Documentation**: What docs are priorities?

## Next Steps

1. **Review design docs**: Please review all 3 design documents
2. **Provide feedback**: Comment on open questions above
3. **Validate use cases**: Confirm this solves real problems
4. **Approve or iterate**: Green-light implementation or request changes

## Related Documents

- [Complete Design](./QUERY_LANGUAGE_DESIGN.md) - Full syntax specification (16KB)
- [Architecture](./QUERY_LANGUAGE_ARCHITECTURE.md) - Implementation details (15KB)  
- [Quick Reference](./QUERY_LANGUAGE_QUICKREF.md) - Cheat sheet (4KB)

---

**Status**: 🚧 Design phase - awaiting feedback before implementation

**Last Updated**: 2025-12-20
