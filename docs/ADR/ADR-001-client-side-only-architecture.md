# ADR-001: Client-Side Only Architecture (No Backend)

## Status

Accepted

## Context

Totem allows users to create custom audio books for the Tiptoi electronic pen system. Users need to upload audio files, generate GME files, and create printable visual codes. The application needs to be accessible without barriers while respecting user privacy.

## Decision

Totem runs entirely in the browser with no backend server, no cloud storage, and no data transmission to external servers. All processing happens client-side using modern browser APIs.

**Key Implementation:**
- All audio processing happens in the browser using Web APIs
- No server-side API endpoints
- No user authentication or account management
- No data is uploaded or stored on external servers
- Static site deployment (GitHub Pages)

## Rationale

1. **Privacy**: User data never leaves their computer - no concerns about data breaches, GDPR compliance, or user tracking
2. **Cost**: No hosting costs for compute or storage infrastructure
3. **Accessibility**: No installation required - works directly in any modern browser
4. **Simplicity**: No need to maintain backend infrastructure, databases, or authentication systems
5. **Transparency**: Users can verify through browser DevTools that no network requests are made with their data

## Consequences

### Positive
- Zero operational costs
- Complete user privacy
- No user data management required
- Simple deployment pipeline
- Works offline after initial page load (with service worker)
- Users maintain full control over their files

### Negative
- Limited to browser capabilities and APIs
- Cannot leverage server-side processing power
- File size limitations based on browser memory constraints
- Cannot share projects between devices without manual file transfer
- Requires modern browser with Web Workers, File System Access API support

## Notes

This decision aligns with the project's core constraints:
- "I don't want to pay for hosting or storage"
- "I don't want to handle user data"
- "No installation required"

All heavy computation is handled via Web Workers to keep the UI responsive.
