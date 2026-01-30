# 0711 Vault - Mobile App

Your personal AI knowledge vault that learns everything about you.

## Features

- 🧠 **Personal AI Chat** - Ask questions about your knowledge
- 📁 **Document Vault** - Store and organize documents
- 📷 **Document Scanner** - Scan documents with your camera
- 🔒 **Biometric Security** - Face ID / Touch ID protection
- 🌙 **Dark Mode** - Beautiful dark/light themes
- 📴 **Offline Mode** - Works without internet
- 🔄 **Sync** - Optional sync with 0711 server

## Tech Stack

- **React Native** with Expo
- **TypeScript** for type safety
- **Expo Camera** for document scanning
- **Expo SecureStore** for sensitive data
- **Expo LocalAuthentication** for biometrics

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npx expo start

# Run on Android
npx expo start --android

# Run on iOS
npx expo start --ios

# Build for production
eas build -p android
eas build -p ios
```

## Project Structure

```
Vault0711/
├── App.tsx                 # Main app with navigation
├── src/
│   ├── screens/
│   │   ├── ChatScreen.tsx      # AI chat interface
│   │   ├── VaultScreen.tsx     # Document list
│   │   ├── ScanScreen.tsx      # Camera/scanner
│   │   ├── SettingsScreen.tsx  # Settings
│   │   └── LockScreen.tsx      # Biometric lock
│   ├── hooks/
│   │   └── useChatService.ts   # Chat API hook
│   ├── components/             # Reusable components
│   ├── services/               # API services
│   └── theme/
│       └── index.ts            # Colors, fonts, spacing
├── assets/                     # Images, icons
└── app.json                    # Expo config
```

## Configuration

### API Keys

Set your Mistral API key in the app settings, or configure the local 0711 server:

```typescript
// In useChatService.ts
const API_BASE_URL = 'http://your-server:4080/api';
```

### Biometrics

The app automatically uses Face ID / Touch ID if available. Users can disable this in settings.

## Building for Production

### Android

```bash
# Configure EAS
eas build:configure

# Build APK
eas build -p android --profile preview

# Build for Play Store
eas build -p android --profile production
```

### iOS

```bash
# Build for TestFlight
eas build -p ios --profile production

# Submit to App Store
eas submit -p ios
```

## Privacy

0711 Vault is designed with privacy first:

- All data stored locally on device
- Biometric authentication
- No tracking or analytics
- Optional server sync (user choice)
- End-to-end encryption for sync

## License

Proprietary - 0711 AI GmbH
