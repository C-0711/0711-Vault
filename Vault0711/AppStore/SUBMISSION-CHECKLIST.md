# App Store Submission Checklist

## Pre-Submission

### Developer Account
- [ ] Apple Developer Program membership active ($99/year)
- [ ] App ID created in Developer Portal
- [ ] Bundle ID: `io.0711.vault`
- [ ] Provisioning profiles created

### App Configuration
- [ ] Version: 1.0.0
- [ ] Build number: 1
- [ ] Deployment target: iOS 16.0+
- [ ] Required device capabilities set
- [ ] App Transport Security configured

### Icons & Launch Screen
- [ ] App icon 1024x1024 (no alpha, no rounded corners)
- [ ] All icon sizes generated
- [ ] Launch screen configured
- [ ] Dark mode launch screen

### Screenshots (Required)
- [ ] 6.7" iPhone (1290 x 2796) — iPhone 15 Pro Max
- [ ] 6.5" iPhone (1284 x 2778) — iPhone 14 Plus
- [ ] 5.5" iPhone (1242 x 2208) — iPhone 8 Plus (optional)
- [ ] 12.9" iPad Pro (2048 x 2732)

### App Preview Videos (Optional but recommended)
- [ ] 30 second demo video
- [ ] No device frames in video
- [ ] Show actual app functionality

---

## App Store Connect

### App Information
- [ ] App name: "0711 Vault"
- [ ] Subtitle: "Your Photos. Your AI. Your Control."
- [ ] Primary language: English (U.S.)
- [ ] Category: Photo & Video
- [ ] Secondary category: Utilities
- [ ] Content rights: Own all rights

### Pricing
- [ ] Price: Free
- [ ] In-App Purchases: None (or configure if needed)
- [ ] Availability: All territories

### App Privacy
- [ ] Privacy policy URL: https://0711.io/privacy
- [ ] Privacy nutrition label completed:
  - [ ] Data not collected OR
  - [ ] Data types disclosed:
    - [ ] Photos (Linked to identity, On-device only)
    - [ ] User content (Linked to identity, On-device only)

### Age Rating
- [ ] Questionnaire completed
- [ ] Expected rating: 4+

### Localization
- [ ] English (U.S.) — Primary
- [ ] German — Recommended
- [ ] Description in all languages
- [ ] Keywords in all languages
- [ ] Screenshots for each language

---

## Review Guidelines Compliance

### Data & Privacy (1.3)
- [x] No data collection without consent
- [x] Privacy policy provided
- [x] Photo library access properly requested
- [x] Face ID usage properly declared
- [x] Data stored on-device by default

### App Completeness (2.1)
- [ ] App fully functional
- [ ] No placeholder content
- [ ] No crashes
- [ ] All features work as described

### Accurate Metadata (2.3)
- [x] Description matches functionality
- [x] Screenshots show actual app
- [x] No misleading claims

### Hardware Compatibility (2.4)
- [x] Works on all supported devices
- [x] Proper iPhone/iPad layouts
- [x] Handles different screen sizes

### Software Requirements (2.5)
- [x] Uses standard APIs
- [x] No private APIs
- [x] No code downloading

### Privacy (5.1)
- [x] Photo library access explained
- [x] Face ID access explained
- [x] No tracking without consent
- [x] User can delete all data

### Data Storage (5.2)
- [x] Keychain for sensitive data
- [x] Encryption for user data
- [x] No unprotected sensitive data

---

## Technical Checklist

### Permissions
- [x] `NSPhotoLibraryUsageDescription` — "0711 Vault needs access to import and organize your photos securely."
- [x] `NSFaceIDUsageDescription` — "Use Face ID to quickly and securely unlock your vault."
- [x] `NSPhotoLibraryAddUsageDescription` — "0711 Vault needs permission to save edited photos."

### Info.plist
```xml
<key>NSPhotoLibraryUsageDescription</key>
<string>0711 Vault needs access to import and organize your photos securely. Your photos never leave your device without your permission.</string>

<key>NSFaceIDUsageDescription</key>
<string>Use Face ID to quickly and securely unlock your vault.</string>

<key>NSPhotoLibraryAddUsageDescription</key>
<string>0711 Vault can save edited photos back to your library.</string>

<key>ITSAppUsesNonExemptEncryption</key>
<false/>
```

### Capabilities
- [x] Keychain Sharing (if needed)
- [ ] Push Notifications (optional)
- [ ] Background Modes (optional)

### Testing
- [ ] Tested on physical device
- [ ] Tested on simulator (multiple sizes)
- [ ] Tested dark mode
- [ ] Tested accessibility
- [ ] Tested with VoiceOver
- [ ] No memory leaks
- [ ] No crashes in Instruments

---

## Screenshot Content

### 1. Welcome / Onboarding
**Headline:** "Your Photos Deserve Better"
**Subhead:** "Private. Secure. Yours."

### 2. Photo Import
**Headline:** "Import with One Tap"
**Subhead:** "Bring your photos home"

### 3. Photo Gallery
**Headline:** "AI-Powered Organization"
**Subhead:** "Automatically sorted by people, places, and moments"

### 4. Face Recognition
**Headline:** "Who's Who"
**Subhead:** "Train your personal AI to recognize your people"

### 5. Smart Search
**Headline:** "Find Any Memory"
**Subhead:** "\"Photos with Mom at the beach\""

### 6. Settings / Security
**Headline:** "Zero-Knowledge Security"
**Subhead:** "Your data, your keys, your control"

---

## Post-Submission

### After Approval
- [ ] Announce on social media
- [ ] Update website
- [ ] Send to press/reviewers
- [ ] Monitor reviews
- [ ] Respond to feedback

### If Rejected
- [ ] Read rejection reason carefully
- [ ] Fix the issue
- [ ] Respond in Resolution Center
- [ ] Resubmit

---

## Timeline

| Task | Due | Status |
|------|-----|--------|
| Icons ready | Day 1 | ⬜ |
| Screenshots ready | Day 1 | ⬜ |
| Metadata complete | Day 1 | ⬜ |
| Build uploaded | Day 1 | ⬜ |
| Submit for review | Day 1 | ⬜ |
| Review (1-3 days) | Day 2-4 | ⬜ |
| Approved | Day 2-4 | ⬜ |
| Release | Day 2-4 | ⬜ |
