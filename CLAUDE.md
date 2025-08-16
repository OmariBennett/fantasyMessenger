# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Fantasy Messenger** - a messaging gaming app using modern HTML5, CSS, and JavaScript. The project emphasizes modern web standards and follows specific development philosophies.

## Development Commands

This project is now a Socket.IO chat application with both client and server components:

- **Install Dependencies**: `npm install`
- **Start Server**: `npm start` or `npm run dev` (runs on http://localhost:3000)
- **Development**: Server automatically serves static files and handles Socket.IO connections
- **Requirements**: Node.js 18+ required for ES modules support

## Code Architecture & Structure

### CSS Architecture - CUBE CSS Methodology

The project follows **CUBE CSS** methodology (Composition, Utility, Block, Exception):

- **Composition**: High-level layout systems that suggest layout behavior to the browser
- **Utility**: Single-purpose CSS classes for reusable styling helpers  
- **Block**: Component-specific styles (max 80-100 lines per block)
- **Exception**: State deviations using data attributes (not CSS classes)

### File Structure

```
fantasyMessenger/
├── index.html          # Main HTML entry point
├── server.js           # Express + Socket.IO server
├── package.json        # Node.js dependencies and scripts
├── css/
│   ├── reset.css       # Modern CSS reset (Josh Comeau's reset)
│   ├── default.css     # CUBE CSS documentation and base structure
│   └── style.css       # Main styles with CSS custom properties
├── js/
│   ├── chat.js         # Client-side Socket.IO chat functionality
│   └── index.js        # Original JavaScript file
└── README.md          # Extensive project documentation
```

### Real-time Chat Architecture

- **Server**: Express.js server with Socket.IO for real-time bidirectional communication
- **Client**: Modern ES6+ class-based chat client with event-driven architecture
- **Communication**: WebSocket-based real-time messaging with automatic fallbacks
- **User Management**: Track connected users, join/leave notifications

### CSS Custom Properties System

The project uses a sophisticated CSS custom properties system:

- **Typography**: OpenSans, EB Garamond, JetBrains Mono with fluid font sizing using `clamp()`
- **Color System**: Uses OKLCH color space for modern color definitions
- **Responsive Typography**: Fluid font scales from `--font-size-300` to `--font-size-1000`

## Development Guidelines

### Modern Web Standards

- **HTML5 Semantic Elements**: Use `<header>`, `<nav>`, `<main>`, `<article>`, `<section>`, `<footer>`
- **Modern CSS**: Prefer Flexbox/Grid for layouts, CSS Custom Properties for consistency
- **Modern JavaScript**: Use ES6+ features, arrow functions, async/await, template literals, modules

### Code Style Preferences

**CSS:**
- Follow CUBE CSS methodology structure
- Use logical properties (`margin-inline`, `padding-block`) for internationalization
- Prefer `clamp()` for responsive typography
- Use CSS Custom Properties for design tokens

**JavaScript:**
- Use ES modules (`import/export`)
- Prefer arrow functions for callbacks
- Use async/await for asynchronous operations
- Utilize template literals for string interpolation

### Fantasy/Gaming Context

The project is themed around fantasy gaming concepts including:
- Character archetypes (fighters, mages, rogues, etc.)
- Fantasy weather and day/night systems
- Turn-based game mechanics
- Character stats and progression systems
- Monster archetypes and fantasy items

Reference the extensive README.md for detailed fantasy game system documentation that informs the project's domain concepts.