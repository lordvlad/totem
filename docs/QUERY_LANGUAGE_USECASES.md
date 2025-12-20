# Stream Query Language - Use Case Gallery

Visual examples showing how the query language solves real problems.

## 1. 📊 Real-Time Dashboard Analytics

**Problem**: Monitor API performance in real-time across multiple services.

**Before** (100+ lines of imperative code):
```javascript
// Complex event listeners, timers, state management
let counters = new Map();
setInterval(() => {
  for (let [endpoint, stats] of counters.entries()) {
    if (stats.avg > 1000) {
      console.log(`Slow endpoint: ${endpoint}`);
    }
  }
  counters.clear();
}, 60000);
// ... plus buffering, aggregation logic, etc.
```

**After** (7 lines of declarative query):
```sql
SELECT 
  endpoint,
  COUNT(*) as requests,
  AVG(duration_ms) as avg_duration
FROM api_requests
WINDOW TUMBLING (SIZE 1 MINUTE)
GROUP BY endpoint
HAVING avg_duration > 1000;
```

**Data Flow**:
```
api_requests (stream)
  ↓ [filter by window]
  ↓ [group by endpoint]
  ↓ [aggregate: count, avg]
  ↓ [filter: having avg > 1000]
  ↓
results → dashboard
```

---

## 2. 🔗 Event Correlation (Click-through Attribution)

**Problem**: Match ad impressions with clicks to measure effectiveness.

**Before** (150+ lines):
```javascript
// Maintain buffers, track timeouts, handle expiry
const impressions = new Map();
const clicks = new Map();
// Complex matching logic with timeouts...
```

**After** (9 lines):
```sql
SELECT 
  i.ad_id,
  i.campaign_id,
  c.user_id,
  c.timestamp - i.timestamp as time_to_click
FROM impressions i
INNER JOIN clicks c
  ON i.ad_id = c.ad_id
  WITHIN 5 MINUTES;
```

**Data Flow**:
```
impressions (stream)    clicks (stream)
      ↓                       ↓
      └───[join on ad_id]────┘
                ↓
          [within 5 min]
                ↓
      matched_events → analytics
```

**Visual Timeline**:
```
Time:   0s    1s    2s    3s    4s    5s    6s
        │     │     │     │     │     │     │
Impr:   I1────────────────┐
                          │
Click:        C1──────────┤──→ MATCH! (within 5min)
                          │
Impr:              I2─────┼──────────────────┐
                          │                  │
Click:                    C2─────────────────┤──→ MATCH!
                                             │
                                            (timeout)
```

---

## 3. 🌊 Multi-Source Log Aggregation

**Problem**: Combine logs from different microservices for unified monitoring.

**Before** (200+ lines):
```javascript
// Set up multiple listeners
apiService.on('log', msg => handleLog('api', msg));
workerService.on('log', msg => handleLog('worker', msg));
frontendService.on('log', msg => handleLog('frontend', msg));
// Merge, sort, aggregate...
```

**After** (12 lines):
```sql
WITH all_logs AS (
  SELECT 'api' as service, * FROM api_logs
  UNION
  SELECT 'worker' as service, * FROM worker_logs
  UNION
  SELECT 'frontend' as service, * FROM frontend_logs
)
SELECT service, severity, COUNT(*) as count
FROM all_logs
WINDOW TUMBLING (SIZE 1 MINUTE)
GROUP BY service, severity;
```

**Data Flow**:
```
api_logs ──┐
           ├──[UNION]──→ all_logs ──[GROUP BY]──→ counts
worker_logs─┤
           │
frontend_logs┘
```

---

## 4. 👤 User Session Detection

**Problem**: Identify user sessions based on activity gaps.

**Before** (100+ lines):
```javascript
// Track last activity per user, detect gaps
const userSessions = new Map();
// Complex timeout management...
```

**After** (9 lines):
```sql
SELECT 
  user_id,
  COUNT(*) as page_views,
  MAX(timestamp) - MIN(timestamp) as duration
FROM page_views
WINDOW SESSION (INACTIVITY GAP 30 MINUTES)
GROUP BY user_id
HAVING COUNT(*) > 1;
```

**Visual Timeline**:
```
User A: ●─────●───●──────────────────────────────●──●───●
        └─────Session 1──────┘                  └─Session 2─┘
              (30min gap ends session)

User B: ●───●─────────────────────────────────────────────
        └──Session 1──────────────────────────────────────
              (still active - no 30min gap)
```

---

## 5. 🚨 Intelligent Alerting with Fan-Out

**Problem**: Route different severity errors to appropriate channels.

**Before** (80+ lines):
```javascript
logs.on('entry', log => {
  if (log.level === 'CRITICAL') {
    criticalAlerts.send(log);
    pagerDuty.alert(log);
  } else if (log.level === 'ERROR') {
    errorChannel.send(log);
  } else {
    infoChannel.send(log);
  }
});
```

**After** (14 lines):
```sql
WITH errors AS (
  SELECT * FROM logs 
  WHERE level IN ('ERROR', 'CRITICAL')
)

INSERT INTO critical_alerts
SELECT * FROM errors WHERE level = 'CRITICAL';

INSERT INTO error_notifications  
SELECT * FROM errors WHERE level = 'ERROR';

INSERT INTO all_errors_archive
SELECT * FROM errors;
```

**Data Flow**:
```
                    ┌──→ critical_alerts
                    │    (PagerDuty)
logs ──[filter]──→ errors──→ error_notifications
                    │    (Email)
                    └──→ all_errors_archive
                         (Storage)
```

---

## 6. 🔄 Data Enrichment Pipeline

**Problem**: Enrich order events with user and product information.

**Before** (150+ lines):
```javascript
// Maintain lookup tables, handle timing
const userCache = new Map();
const productCache = new Map();
orders.on('order', async order => {
  const user = await fetchUser(order.user_id);
  const product = await fetchProduct(order.product_id);
  // Combine data...
});
```

**After** (12 lines):
```sql
SELECT 
  o.order_id,
  o.total,
  u.name as user_name,
  u.tier as customer_tier,
  p.name as product_name,
  p.category
FROM orders o
INNER JOIN users u ON o.user_id = u.user_id WITHIN 1 MINUTE
INNER JOIN products p ON o.product_id = p.product_id WITHIN 1 MINUTE;
```

**Data Flow**:
```
orders ──┐
         ├──[JOIN on user_id]──┐
users ───┘                      ├──[JOIN on product_id]──→ enriched_orders
                                │
products ───────────────────────┘
```

---

## 7. 📈 Moving Average Calculation

**Problem**: Calculate rolling averages for trend analysis.

**Before** (60+ lines):
```javascript
const buffer = [];
values.on('value', v => {
  buffer.push(v);
  if (buffer.length > 10) buffer.shift();
  const avg = buffer.reduce((a,b) => a+b) / buffer.length;
  // ...
});
```

**After** (6 lines):
```sql
SELECT 
  timestamp,
  value,
  AVG(value) OVER (ROWS BETWEEN 9 PRECEDING AND CURRENT ROW) as moving_avg
FROM sensor_data;
```

**Visual**:
```
Values:  10  12  15  11  13  14  16  15  17  18  20
         │   │   │   │   │   │   │   │   │   │   │
Avg(10): 10  11  12  12  12  13  13  14  14  15  15
         └───┴───┴───┴───┴───┴───┴───┴───┴───┘
              (10-value moving average)
```

---

## 8. 🔀 Stream Synchronization

**Problem**: Combine readings from multiple sensors taken at similar times.

**Before** (120+ lines):
```javascript
// Buffer all streams, find matching timestamps
const tempBuffer = [];
const humidityBuffer = [];
const pressureBuffer = [];
// Complex matching logic with tolerances...
```

**After** (9 lines):
```sql
SELECT 
  t.sensor_id,
  t.temperature,
  h.humidity,
  p.pressure
FROM temperature_sensors t
COMBINE humidity_sensors h, pressure_sensors p
ALIGN BY timestamp TOLERANCE 1 SECOND;
```

**Visual Timeline**:
```
Time:       0s    1s    2s    3s    4s    5s
            │     │     │     │     │     │
Temp:       20°───┼─────21°───┼─────22°──│
            │     │     │     │     │     │
Humidity:   50%───┼─────52%───┼─────51%──│
            │     │     │     │     │     │
Pressure:   1013──┼─────1012──┼─────1014─│
            │     │     │     │     │     │
Combined:   ●─────────●─────────●─────────
           (align within 1sec tolerance)
```

---

## 9. 📊 Percentile Calculation

**Problem**: Calculate p50, p95, p99 latencies for SLA monitoring.

**Before** (80+ lines):
```javascript
// Maintain sorted arrays, calculate percentiles
const latencies = [];
setInterval(() => {
  latencies.sort((a,b) => a-b);
  const p95 = latencies[Math.floor(latencies.length * 0.95)];
  // ...
}, 60000);
```

**After** (8 lines):
```sql
SELECT 
  endpoint,
  PERCENTILE(latency_ms, 0.50) as p50,
  PERCENTILE(latency_ms, 0.95) as p95,
  PERCENTILE(latency_ms, 0.99) as p99
FROM api_requests
WINDOW TUMBLING (SIZE 1 MINUTE)
GROUP BY endpoint;
```

---

## 10. 🔍 Anomaly Detection

**Problem**: Detect sudden spikes in error rates.

**Before** (150+ lines):
```javascript
// Track historical averages, detect deviations
const history = new Map();
// Complex statistical calculations...
```

**After** (18 lines):
```sql
WITH error_rates AS (
  SELECT 
    service,
    COUNT(*) as total,
    SUM(CASE WHEN status >= 500 THEN 1 ELSE 0 END) as errors,
    100.0 * SUM(CASE WHEN status >= 500 THEN 1 ELSE 0 END) / COUNT(*) as error_pct
  FROM requests
  WINDOW TUMBLING (SIZE 1 MINUTE)
  GROUP BY service
)
SELECT 
  service,
  error_pct,
  'ALERT' as status
FROM error_rates
WHERE error_pct > 5.0;
```

**Visual**:
```
Error Rate:
10%│         ●  ← Alert triggered
   │
 5%├─────────────────  (threshold)
   │
 2%│  ●    ●     ●   ●
   │
 0%└────────────────────→ time
     normal   spike!
```

---

## Summary Comparison

| Use Case | Before (LOC) | After (LOC) | Reduction |
|----------|--------------|-------------|-----------|
| Dashboard Analytics | 100+ | 7 | **93%** |
| Event Correlation | 150+ | 9 | **94%** |
| Log Aggregation | 200+ | 12 | **94%** |
| Session Detection | 100+ | 9 | **91%** |
| Alert Routing | 80+ | 14 | **82%** |
| Data Enrichment | 150+ | 12 | **92%** |
| Moving Average | 60+ | 6 | **90%** |
| Stream Sync | 120+ | 9 | **92%** |
| Percentiles | 80+ | 8 | **90%** |
| Anomaly Detection | 150+ | 18 | **88%** |

**Average code reduction: 90%**

---

## Key Benefits Across All Use Cases

✅ **Declarative** - Say *what* you want, not *how* to compute it
✅ **Concise** - 10-20 lines instead of 100-200 lines
✅ **Readable** - SQL-like syntax is familiar and self-documenting
✅ **Maintainable** - Less code = fewer bugs
✅ **Testable** - Queries can be tested independently
✅ **Composable** - CTEs enable query reuse

## Common Patterns

Most use cases follow these patterns:

1. **Filter → Transform → Aggregate**
2. **Merge → Enrich → Route**
3. **Window → Group → Alert**
4. **Join → Transform → Sink**

The query language makes these patterns first-class citizens.
