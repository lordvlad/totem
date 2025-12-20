# Query Language Architecture for Totem

## Integration with Totem's Architecture

This document describes how the stream query language integrates with Totem's existing client-side architecture.

## Architectural Principles (from ADRs)

### ADR-001: Client-Side Only Architecture
The query language must run entirely in the browser without backend dependencies:
- All query parsing, planning, and execution happens client-side
- Topics can connect to browser-native APIs (WebSockets, SSE, BroadcastChannel)
- No server-side state or persistence required

### ADR-002: Web Workers for Compute-Intensive Tasks
Query execution should leverage Web Workers:
- Query executor runs in a dedicated Web Worker
- Prevents UI blocking during complex transformations
- Enables parallel processing of multiple streams

### ADR-009: Valtio for State Management
Integration with Totem's state management:
- Query metadata stored in Valtio state
- Stream data flows through observables/streams, not Valtio
- UI components subscribe to query results via reactive patterns

## Topic Implementation Strategies

### 1. In-Memory Topics (Default)

```typescript
interface Topic<T = any> {
  name: string;
  subscribe(handler: (message: Message<T>) => void): Subscription;
  publish(message: T): void;
  close(): void;
}

interface Message<T = any> {
  key?: string;
  value: T;
  timestamp: number;
  headers?: Record<string, string>;
}
```

**Use cases**:
- Ephemeral streams within a query
- Testing and development
- Pure transformations without external I/O

**Implementation**:
```typescript
class InMemoryTopic<T> implements Topic<T> {
  private subscribers = new Set<(msg: Message<T>) => void>();
  
  subscribe(handler: (message: Message<T>) => void): Subscription {
    this.subscribers.add(handler);
    return {
      unsubscribe: () => this.subscribers.delete(handler)
    };
  }
  
  publish(message: T): void {
    const msg: Message<T> = {
      value: message,
      timestamp: Date.now()
    };
    this.subscribers.forEach(handler => handler(msg));
  }
  
  close(): void {
    this.subscribers.clear();
  }
}
```

### 2. WebSocket Topics

```typescript
class WebSocketTopic<T> implements Topic<T> {
  private ws: WebSocket;
  private subscribers = new Set<(msg: Message<T>) => void>();
  
  constructor(url: string) {
    this.ws = new WebSocket(url);
    this.ws.onmessage = (event) => {
      const message: Message<T> = JSON.parse(event.data);
      this.subscribers.forEach(handler => handler(message));
    };
  }
  
  subscribe(handler: (message: Message<T>) => void): Subscription {
    this.subscribers.add(handler);
    return {
      unsubscribe: () => this.subscribers.delete(handler)
    };
  }
  
  publish(message: T): void {
    const msg: Message<T> = {
      value: message,
      timestamp: Date.now()
    };
    this.ws.send(JSON.stringify(msg));
  }
}
```

**Use cases**:
- Real-time data from external services
- Bidirectional communication
- Low-latency streaming

### 3. Server-Sent Events (SSE) Topics

```typescript
class SSETopic<T> implements Topic<T> {
  private eventSource: EventSource;
  private subscribers = new Set<(msg: Message<T>) => void>();
  
  constructor(url: string, eventType = 'message') {
    this.eventSource = new EventSource(url);
    this.eventSource.addEventListener(eventType, (event) => {
      const message: Message<T> = JSON.parse(event.data);
      this.subscribers.forEach(handler => handler(message));
    });
  }
  
  subscribe(handler: (message: Message<T>) => void): Subscription {
    this.subscribers.add(handler);
    return {
      unsubscribe: () => this.subscribers.delete(handler)
    };
  }
  
  // SSE is read-only, publish would throw or be no-op
  publish(): void {
    throw new Error('SSETopic is read-only');
  }
}
```

**Use cases**:
- Server push notifications
- One-way streaming (read-only)
- Automatic reconnection

### 4. BroadcastChannel Topics

```typescript
class BroadcastChannelTopic<T> implements Topic<T> {
  private channel: BroadcastChannel;
  private subscribers = new Set<(msg: Message<T>) => void>();
  
  constructor(name: string) {
    this.channel = new BroadcastChannel(name);
    this.channel.onmessage = (event) => {
      this.subscribers.forEach(handler => handler(event.data));
    };
  }
  
  subscribe(handler: (message: Message<T>) => void): Subscription {
    this.subscribers.add(handler);
    return {
      unsubscribe: () => this.subscribers.delete(handler)
    };
  }
  
  publish(message: T): void {
    const msg: Message<T> = {
      value: message,
      timestamp: Date.now()
    };
    this.channel.postMessage(msg);
  }
}
```

**Use cases**:
- Communication between browser tabs/windows
- Coordination across multiple instances
- Broadcast patterns

### 5. IndexedDB-Backed Topics (Optional)

For buffering or replay scenarios:

```typescript
class BufferedTopic<T> implements Topic<T> {
  private buffer: Message<T>[] = [];
  private maxSize = 1000;
  private dbPromise: Promise<IDBDatabase>;
  
  constructor(
    private name: string,
    private inner: Topic<T>
  ) {
    this.dbPromise = this.initDB();
    this.subscribeToInner();
  }
  
  private async initDB(): Promise<IDBDatabase> {
    // Initialize IndexedDB for persistence
    // Implementation details omitted for brevity
  }
  
  async replay(from: number): Promise<void> {
    // Replay messages from buffer/IndexedDB
  }
}
```

**Use cases**:
- Message replay
- Late subscriber catch-up
- Debugging and audit trails

## Query Execution Model

### Query Lifecycle

```
┌──────────────────┐
│  Parse Query     │
│  (Main Thread)   │
└────────┬─────────┘
         │
┌────────▼─────────┐
│  Validate &      │
│  Plan            │
│  (Main Thread)   │
└────────┬─────────┘
         │
┌────────▼─────────┐
│  Transfer to     │
│  Worker          │
└────────┬─────────┘
         │
┌────────▼─────────┐
│  Execute Query   │
│  (Web Worker)    │
│  - Build graph   │
│  - Connect ops   │
│  - Start streams │
└────────┬─────────┘
         │
┌────────▼─────────┐
│  Stream Results  │
│  to UI           │
│  (postMessage)   │
└──────────────────┘
```

### Worker Communication Protocol

```typescript
// Messages from main thread to worker
type WorkerRequest = 
  | { type: 'EXECUTE_QUERY'; query: string; context: QueryContext }
  | { type: 'STOP_QUERY'; queryId: string }
  | { type: 'PAUSE_QUERY'; queryId: string }
  | { type: 'RESUME_QUERY'; queryId: string };

// Messages from worker to main thread
type WorkerResponse =
  | { type: 'QUERY_STARTED'; queryId: string }
  | { type: 'QUERY_RESULT'; queryId: string; data: any }
  | { type: 'QUERY_ERROR'; queryId: string; error: string }
  | { type: 'QUERY_COMPLETED'; queryId: string }
  | { type: 'QUERY_METRICS'; queryId: string; metrics: Metrics };

interface QueryContext {
  topics: Record<string, TopicConfig>;
  parameters?: Record<string, any>;
}

interface TopicConfig {
  type: 'inmemory' | 'websocket' | 'sse' | 'broadcast';
  config: any;
}
```

### Operator Graph Execution

```typescript
interface Operator {
  type: string;
  inputs: Operator[];
  outputs: Operator[];
  
  start(): void;
  stop(): void;
  process(message: Message): void;
}

class OperatorGraph {
  private operators: Map<string, Operator> = new Map();
  
  addOperator(id: string, operator: Operator): void {
    this.operators.set(id, operator);
  }
  
  connect(sourceId: string, targetId: string): void {
    const source = this.operators.get(sourceId)!;
    const target = this.operators.get(targetId)!;
    source.outputs.push(target);
    target.inputs.push(source);
  }
  
  start(): void {
    // Start operators in topological order
    for (const operator of this.operators.values()) {
      operator.start();
    }
  }
  
  stop(): void {
    for (const operator of this.operators.values()) {
      operator.stop();
    }
  }
}
```

## Memory Management

### Windowing and Buffering

Windows require buffering messages in memory. Strategy:

1. **Sliding Window Buffer**: Circular buffer with fixed size
2. **Time-Based Eviction**: Remove messages older than window duration
3. **Memory Limits**: Stop accepting messages if memory threshold exceeded
4. **Backpressure**: Signal upstream to slow down

```typescript
class WindowBuffer<T> {
  private buffer: Message<T>[] = [];
  private maxSize: number;
  
  constructor(
    private windowDuration: number,
    maxSize = 10000
  ) {
    this.maxSize = maxSize;
  }
  
  add(message: Message<T>): void {
    // Add to buffer
    this.buffer.push(message);
    
    // Evict old messages
    const cutoff = Date.now() - this.windowDuration;
    while (this.buffer.length > 0 && this.buffer[0].timestamp < cutoff) {
      this.buffer.shift();
    }
    
    // Enforce size limit
    if (this.buffer.length > this.maxSize) {
      throw new Error('Window buffer overflow');
    }
  }
  
  getMessages(): Message<T>[] {
    return [...this.buffer];
  }
}
```

### Join State Management

Joins require maintaining state for matching:

```typescript
class JoinState<L, R> {
  private leftBuffer = new Map<string, Message<L>[]>();
  private rightBuffer = new Map<string, Message<R>[]>();
  
  addLeft(key: string, message: Message<L>): void {
    if (!this.leftBuffer.has(key)) {
      this.leftBuffer.set(key, []);
    }
    this.leftBuffer.get(key)!.push(message);
    this.evictOld(this.leftBuffer);
  }
  
  addRight(key: string, message: Message<R>): void {
    if (!this.rightBuffer.has(key)) {
      this.rightBuffer.set(key, []);
    }
    this.rightBuffer.get(key)!.push(message);
    this.evictOld(this.rightBuffer);
  }
  
  private evictOld(buffer: Map<string, Message<any>[]>): void {
    const cutoff = Date.now() - this.windowDuration;
    for (const [key, messages] of buffer.entries()) {
      const filtered = messages.filter(m => m.timestamp >= cutoff);
      if (filtered.length === 0) {
        buffer.delete(key);
      } else {
        buffer.set(key, filtered);
      }
    }
  }
}
```

## UI Integration

### Query Editor Component

```typescript
interface QueryEditorProps {
  initialQuery?: string;
  topics: string[];
  onExecute: (query: string) => void;
  onStop: () => void;
}

// Component would provide:
// - Syntax highlighting
// - Auto-completion for topic names, functions
// - Query validation
// - Execute/stop buttons
```

### Results Viewer Component

```typescript
interface ResultsViewerProps {
  queryId: string;
  results: Message[];
  schema?: Schema;
  onExport?: (format: 'json' | 'csv') => void;
}

// Component would provide:
// - Streaming result display
// - Pagination for large result sets
// - Column formatting
// - Export functionality
```

### Topic Browser Component

```typescript
interface TopicBrowserProps {
  topics: TopicMetadata[];
  onSelectTopic: (topic: string) => void;
  onPreview: (topic: string) => void;
}

// Component would provide:
// - List of available topics
// - Schema preview
// - Sample messages
// - Statistics (message rate, lag, etc.)
```

## Configuration and Registration

### Topic Registry

```typescript
class TopicRegistry {
  private topics = new Map<string, Topic>();
  
  register(name: string, topic: Topic): void {
    this.topics.set(name, topic);
  }
  
  get(name: string): Topic | undefined {
    return this.topics.get(name);
  }
  
  list(): string[] {
    return Array.from(this.topics.keys());
  }
  
  // Factory methods for different topic types
  createWebSocketTopic(name: string, url: string): Topic {
    const topic = new WebSocketTopic(url);
    this.register(name, topic);
    return topic;
  }
  
  createInMemoryTopic(name: string): Topic {
    const topic = new InMemoryTopic();
    this.register(name, topic);
    return topic;
  }
}
```

### Configuration File

```typescript
// config/streams.ts
export const streamConfig: StreamConfig = {
  topics: {
    'user_events': {
      type: 'websocket',
      url: 'wss://example.com/events'
    },
    'notifications': {
      type: 'sse',
      url: 'https://example.com/notifications'
    },
    'local_cache': {
      type: 'inmemory'
    }
  },
  defaults: {
    windowSize: 60000, // 1 minute
    maxBufferSize: 10000,
    emitInterval: 1000 // 1 second
  }
};
```

## Error Handling and Observability

### Error Categories

1. **Parse Errors**: Syntax errors in query
2. **Validation Errors**: Semantic errors (unknown topics, invalid types)
3. **Runtime Errors**: Division by zero, null references
4. **System Errors**: Network failures, out of memory

### Error Reporting

```typescript
interface QueryError {
  type: 'parse' | 'validation' | 'runtime' | 'system';
  message: string;
  location?: {
    line: number;
    column: number;
    length: number;
  };
  context?: string;
  suggestion?: string;
}
```

### Metrics Collection

```typescript
interface QueryMetrics {
  queryId: string;
  startTime: number;
  messagesProcessed: number;
  messagesEmitted: number;
  bytesProcessed: number;
  operatorMetrics: Map<string, OperatorMetrics>;
}

interface OperatorMetrics {
  operatorId: string;
  type: string;
  messagesIn: number;
  messagesOut: number;
  processingTimeMs: number;
  errors: number;
}
```

## Testing Strategy

### Unit Tests

- Parser: Test query parsing with various inputs
- Operators: Test each operator in isolation
- Utilities: Test helper functions

### Integration Tests

- End-to-end query execution
- Multi-operator pipelines
- Error propagation

### Performance Tests

- Throughput: Messages per second
- Latency: Time from input to output
- Memory: Peak memory usage
- Scalability: Performance with increasing load

## Deployment Considerations

### Bundle Size

- Use tree-shaking to minimize bundle size
- Lazy-load query executor worker
- Separate parser from executor if needed

### Browser Compatibility

- Target modern browsers with Web Worker support
- Polyfills for missing features (if any)
- Graceful degradation for older browsers

### Performance

- Optimize hot paths (operator execution)
- Use TypedArrays for numerical operations
- Batch message processing where possible
- Profile and optimize based on real usage

## Next Steps

1. **Prototype Parser**: Implement basic query parser
2. **Core Operators**: Implement essential operators (source, map, filter, sink)
3. **Worker Integration**: Set up Web Worker communication
4. **Simple UI**: Basic query editor and results viewer
5. **Documentation**: API docs and user guide
6. **Examples**: Sample queries and use cases
7. **Testing**: Comprehensive test suite
8. **Optimization**: Performance tuning based on benchmarks

## Questions for Discussion

1. Should we support saved queries? If so, where to store them?
2. What level of query optimization should we implement initially?
3. How to handle schema evolution for topics?
4. Should we support query debugging (step through, breakpoints)?
5. What monitoring/observability features are essential?
6. How to handle versioning of the query language?
