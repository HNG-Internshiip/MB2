# Smart Utility Toolkit

A feature-rich mobile utility app built with **React Native + Expo Router**. Provides seven essential everyday tools in a single, beautifully designed app with a consistent dark theme and smooth bottom-tab navigation.

---

## Features

| Tab | Tool | Description |
|-----|------|-------------|
| ⚖️ | **Unit Converter** | Length, Weight, Temperature, Volume, Speed, Area |
| 💱 | **Currency Converter** | 15 world currencies with indicative exchange rates |
| 🔢 | **Calculator** | Full arithmetic calculator with expression display |
| 🏋️ | **BMI Calculator** | Metric & Imperial with color-coded category scale |
| ⏱️ | **Time Tools** | Stopwatch with lap tracking + circular countdown timer |
| ✅ | **Task Manager** | Create, edit, complete & delete tasks with offline persistence |
| 📝 | **Notes** | Color-tagged notes with full create/edit/delete support |

---

## Task Manager (Stage 1 Feature)

The Task Manager supports full offline CRUD functionality:

- **Create** tasks with a title, optional note, and priority level (Low / Medium / High)
- **Complete** tasks via a tap-to-toggle checkbox
- **Edit** tasks through a bottom sheet form
- **Delete** tasks with a confirmation prompt
- **Filter** tasks by All / Active / Completed
- **Progress bar** showing overall completion percentage
- **Clear completed** button to bulk-remove finished tasks
- **Persisted locally** using `AsyncStorage` — data survives app restarts

---

## Tech Stack

- [Expo](https://expo.dev/) (SDK 51+)
- [Expo Router](https://expo.github.io/router/) — file-based navigation
- [React Native](https://reactnative.dev/)
- [AsyncStorage](https://react-native-async-storage.github.io/async-storage/) — offline persistence
- [react-native-svg](https://github.com/software-mansion/react-native-svg) — countdown timer ring
- [react-native-safe-area-context](https://github.com/th3rdwave/react-native-safe-area-context) — safe area insets

---

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- iOS Simulator / Android Emulator **or** the Expo Go app on your device

### Installation

```bash
# 1. Clone the repo
git clone https://github.com/your-username/smart-utility-toolkit.git
cd smart-utility-toolkit

# 2. Install dependencies
npm install

# 3. Install native packages
npx expo install \
  @react-native-async-storage/async-storage \
  react-native-svg \
  react-native-safe-area-context \
  expo-status-bar

# 4. Start the dev server
npx expo start
```

Press `a` for Android, `i` for iOS, or scan the QR code with Expo Go.

### Building an APK (for Appetize)

```bash
# Install EAS CLI
npm install -g eas-cli

# Log in to Expo
eas login

# Configure (first time only)
eas build:configure

# Build Android APK
eas build --platform android --profile preview
```

Upload the resulting `.apk` to [appetize.io](https://appetize.io) to generate a public preview link.

---

## Project Structure

```
smart-utility-toolkit/
├── app/
│   ├── _layout.tsx          # Root layout + SafeAreaProvider
│   └── (tabs)/
│       ├── _layout.tsx      # Bottom tab navigator (7 tabs)
│       ├── index.tsx        # Unit Converter
│       ├── currency.tsx     # Currency Converter
│       ├── calculator.tsx   # Calculator
│       ├── bmi.tsx          # BMI Calculator
│       ├── time.tsx         # Stopwatch & Countdown Timer
│       ├── tasks.tsx        # Task Manager (Stage 1)
│       └── notes.tsx        # Notes
├── constants/
│   └── theme.ts             # Shared color palette
└── README.md
```

---

## Architecture Notes

- **File-based routing** via Expo Router keeps navigation declarative and scalable
- **Shared theme** (`constants/theme.ts`) ensures visual consistency across all screens
- **AsyncStorage** calls are isolated inside `useEffect` hooks — reads on mount, writes on every state change
- All screens use `SafeAreaView` for correct rendering on notched and gesture-nav devices
- No external UI libraries — all components are custom-built with `StyleSheet`

---

## License

MIT# MB2
