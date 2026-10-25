# TaskFlow Mobile App

This directory contains the mobile application for TaskFlow, built to bring 100% feature parity with the TaskFlow web productivity application to iOS and Android devices.

---

## Two Mobile Deployment Architectures

To give you complete flexibility, two production-ready mobile architectures are provided:

### 1. Capacitor Native Mobile App (Root Workspace)
The primary mobile app is powered by Capacitor, packaging the full React application into an official Android & iOS native project:
- **100% Feature Parity**: Every single screen, chart, Kanban board, focus timer, Smart Priority factor breakdown, dark mode, custom accent color, and filter.
- **Native Android Studio Project**: Full Gradle setup located in `android/`.
- **Native Features**:
  - Native hardware back-button handling (closes modals and navigates back).
  - Native status bar color and style updates that dynamically match light/dark theme.
  - Native splash screen with smooth fade-in.
  - Native haptic feedback for button taps, task completions, and focus timers.
  - Native bottom navigation bar with live unread badge counters.

#### Commands (from project root):
```bash
# Build web assets and sync to Android
npm run mobile:build

# Sync changes to native platform
npm run mobile:sync

# Open project in Android Studio
npm run mobile:open

# Run directly on connected Android device / emulator
npm run mobile:run
```

---

### 2. Standalone React Native Expo App (`mobile/`)
A dedicated pure React Native application with bottom tabs and native mobile components:
- **Screens**:
  - `Home (Dashboard)`: Productivity score meter, 4 stat meters, Smart Focus recommendation, today's priority tasks.
  - `Tasks`: Search bar, filter chips (All, Pending, High, Today, Overdue, Completed, etc.), task cards, add task modal.
  - `Smart Priority`: AI-free deterministic urgency ranking (0–100 scale), scoring guide, factor explanations.
  - `Focus`: Deep work Pomodoro timer (25m, 50m, 90m), pause/resume, task assignment, focus session logs.
  - `Calendar`: Month navigator, date picker carousel, deadline agenda.
  - `Settings`: Profile identity, accent color customizer, workspace statistics, sample data reset.
- **Data Persistence**: Offline-first using `@react-native-async-storage/async-storage`.

#### How to run the Expo app:
```bash
cd mobile
npm install
npm start
```
Scan the QR code with **Expo Go** on your Android or iPhone to run it instantly!
