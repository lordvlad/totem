# Stream Query Language Documentation

This directory contains the complete design for Totem's stream query language.

## 📄 Documents

### For Decision Makers
- **[QUERY_LANGUAGE_SUMMARY.md](./QUERY_LANGUAGE_SUMMARY.md)** (12KB, 387 lines)
  - Executive summary
  - Problem statement
  - Core capabilities matrix
  - Use case examples
  - Implementation phases
  - Risk analysis
  - Questions for feedback

### For Developers
- **[QUERY_LANGUAGE_ARCHITECTURE.md](./QUERY_LANGUAGE_ARCHITECTURE.md)** (16KB, 630 lines)
  - Integration with Totem
  - Topic implementation strategies
  - Worker communication protocol
  - Memory management
  - UI integration
  - Testing strategy

### For Users
- **[QUERY_LANGUAGE_DESIGN.md](./QUERY_LANGUAGE_DESIGN.md)** (18KB, 685 lines)
  - Complete syntax specification
  - All operators and functions
  - Merge strategies deep dive
  - Windowing operations
  - 7 comprehensive examples
  - Future enhancements

### Quick Reference
- **[QUERY_LANGUAGE_QUICKREF.md](./QUERY_LANGUAGE_QUICKREF.md)** (4KB, 138 lines)
  - Syntax cheat sheet
  - Quick examples
  - Function reference
  - Table summaries

## 🚀 Quick Start

### For Reviewers
1. Start with [QUERY_LANGUAGE_SUMMARY.md](./QUERY_LANGUAGE_SUMMARY.md)
2. Review the open questions section
3. Check use case examples
4. Provide feedback on critical questions

### For Implementers
1. Read [QUERY_LANGUAGE_ARCHITECTURE.md](./QUERY_LANGUAGE_ARCHITECTURE.md)
2. Review implementation phases
3. Check component integration
4. Review testing strategy

### For End Users (Future)
1. Start with [QUERY_LANGUAGE_QUICKREF.md](./QUERY_LANGUAGE_QUICKREF.md)
2. Try basic examples
3. Refer to [QUERY_LANGUAGE_DESIGN.md](./QUERY_LANGUAGE_DESIGN.md) for details

## 📊 Document Overview

```
┌─────────────────────────────────────────┐
│  SUMMARY.md (Executive Overview)        │
│  • What & Why                           │
│  • Use cases                            │
│  • Open questions                       │
└─────────────┬───────────────────────────┘
              │
    ┌─────────┴─────────┐
    │                   │
┌───▼──────────┐  ┌────▼─────────────┐
│ DESIGN.md    │  │ ARCHITECTURE.md  │
│ (User Guide) │  │ (Dev Guide)      │
│              │  │                  │
│ • Syntax     │  │ • Integration    │
│ • Functions  │  │ • Workers        │
│ • Examples   │  │ • Memory         │
└───┬──────────┘  └────┬─────────────┘
    │                  │
    └─────────┬────────┘
              │
    ┌─────────▼─────────┐
    │  QUICKREF.md      │
    │  (Cheat Sheet)    │
    └───────────────────┘
```

## 🎯 Design Status

**Current Phase**: Design & Feedback
- ✅ Syntax design complete
- ✅ Architecture design complete
- ✅ Documentation complete
- ⏳ Awaiting feedback
- ⏸️ Implementation pending approval

## 📝 Feedback Requested

Please review and provide feedback on:

1. **Overall direction** - Does this solve real problems?
2. **Syntax choices** - Is SQL-like syntax appropriate?
3. **Use cases** - What are the primary use cases?
4. **Integration** - Separate tool or core feature?
5. **Priorities** - What to implement first?

See [QUERY_LANGUAGE_SUMMARY.md](./QUERY_LANGUAGE_SUMMARY.md) for complete list of questions.

## 🔗 Related Totem Documentation

- [Architecture Decision Records](./ADR/README.md)
- [Contributing Guide](../CONTRIBUTING.md)
- [Main README](../README.md)

## 📚 External References

- [ksqlDB Documentation](https://docs.ksqldb.io/)
- [Apache Flink SQL](https://nightlies.apache.org/flink/flink-docs-master/docs/dev/table/sql/overview/)
- [jq Manual](https://stedolan.github.io/jq/manual/)
- [Kafka Streams](https://kafka.apache.org/documentation/streams/)

---

**Questions?** Please comment on the PR or open an issue.
