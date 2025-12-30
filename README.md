# A Better Way

A minimal routing application using HERE Platform.

---

## About

**A Better Way** is about finding routes that feel good to drive, not just the fastest path. This is a reset baseline that focuses on simplicity.

---

## Tech Stack

- **Frontend**: Vue 3 + TypeScript + Vite
- **Maps**: HERE Maps API for JavaScript
- **Routing**: HERE Routing API v8

---

## Setup

### Prerequisites

- Node.js 20+ or 22+
- pnpm
- HERE API Key (get one at [developer.here.com](https://developer.here.com/))

### Installation

```bash
# Clone and install
pnpm install

# Configure environment
cp .env.example .env
# Edit .env and add your HERE_API_KEY
```

### Development

```bash
pnpm dev
```

### Build

```bash
pnpm build
```

---

## Usage

1. Open the app in your browser
2. Enter origin coordinates (lat,lng) in the first input
3. Enter destination coordinates (lat,lng) in the second input
4. Click **Route** to display the route polyline
5. Click **Clear** to remove the route

Default coordinates:

- Origin: Squamish, BC (49.7016,-123.1558)
- Destination: Vancouver, BC (49.2827,-123.1207)

---

## What Was Removed

> **Note**: Advanced navigation, rerouting, and tracking logic were intentionally removed in this reset.

This baseline intentionally does not include:

- Location tracking / GPS following
- Turn-by-turn navigation
- Route alternatives
- Traffic avoidance logic
- Search functionality

These features may be rebuilt in the future on top of this clean foundation.

---

## License

MIT
