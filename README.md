# TaskFlow

TaskFlow is a local-first productivity workspace for planning work, prioritizing what matters, and making steady progress. It combines an intelligent task queue with a Kanban board, calendar, focus timer, personal analytics, and offline support.

## Screenshots

The application ships with a realistic sample workspace so the Dashboard, Board, Calendar, Smart Priority, and Analytics views are ready to explore after sign-in.

## Features

- Personalized demo sign-in with profile and preference settings
- Dashboard with a deterministic next-task recommendation, progress summary, deadline timeline, and weekly chart
- Task management with priority, status, category, tags, deadlines, estimates, recurrence, subtasks, notes, favorites, archive, and activity history
- List, grid, and drag-and-drop Kanban views
- Monthly deadline calendar and upcoming task list
- Focus timer with 25, 50, 90-minute and custom sessions, persisted session history, and task time tracking
- Search and command palette with keyboard navigation shortcuts
- Multi-view filters, sorting, custom categories, and recent searches
- Analytics derived from locally stored task and focus-session data
- Light, dark, and system appearance modes
- Browser reminders when supported, plus an in-app notification center
- JSON task backup and validated import
- Installable offline-capable PWA shell
- Responsive layouts with keyboard and screen-reader support

## Tech Stack

- React 19
- Vite 8
- React Router 7
- Tailwind CSS 4
- Lucide React
- Browser local storage and service workers

## Architecture

```text
src/
  components/    Shared shell, forms, task cards, dialogs, charts and command palette
  data/          Sample workspace data
  lib/           Date, storage, task normalization, priority and analytics logic
  pages/         Routed product views
  store/         Shared application state and task interaction providers
public/          PWA manifest, service worker and brand mark
```

Task and settings state are persisted locally. Priority ranking is deterministic and exposes its contributing factors; no external AI service or backend is implied. The sign-in screen is a prototype identity UI and does not authenticate against a server.

## Requirements

- Node.js 20.19+ or 22.12+
- npm

## Installation

```bash
git clone https://github.com/durveshk01/to-do-list.git
cd to-do-list
npm install
```

## Development

```bash
npm run dev
```

## Production Build

```bash
npm run build
npm run preview
```

## Mobile App (Android & iOS)

TaskFlow includes full native mobile support powered by Capacitor and React Native:

### Option 1: Native Mobile App via Capacitor (Android & iOS)
The root app is configured with Capacitor to provide 100% exact feature parity with the web version, including native status bar styling, splash screen, hardware back-button handling, haptic feedback, safe area insets, and offline storage.

```bash
# Build web assets and sync to the native Android project
npm run mobile:build

# Open project in Android Studio to build APK or run on emulator/device
npm run mobile:open

# Run directly on connected Android device
npm run mobile:run
```

### Option 2: Standalone React Native Expo App (`mobile/`)
A dedicated Expo React Native mobile app is located in `mobile/`:

```bash
cd mobile
npm install
npm start
```
Scan the QR code with **Expo Go** on iOS or Android.

## Deployment

The project builds to `dist/` and can be deployed as a static site to Vercel, Netlify, or Render. SPA fallback rules are included for Netlify and Vercel. The service worker is registered only in production.

## Data and Privacy

Tasks, profile details, settings, and focus sessions stay in this browser's local storage. Export a JSON backup before clearing browser data or moving to another device. Imported task files are validated and normalized before replacing the current task collection.

## Future Improvements

- Optional account-backed synchronization and multi-device collaboration
- Advanced custom recurrence schedules
- Calendar week/day planning and external calendar integrations
- User-defined saved filter views and richer historical analytics
