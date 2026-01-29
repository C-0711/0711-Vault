# 0711 Data Liberation Flow

## Der komplette Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│  HEUTE: Deine Daten sind Geiseln                                        │
│                                                                         │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐                                 │
│  │  Apple  │  │  Google │  │  Meta   │  ...                            │
│  │  iCloud │  │  Photos │  │Instagram│                                 │
│  └────┬────┘  └────┬────┘  └────┬────┘                                 │
│       │            │            │                                       │
│       └────────────┼────────────┘                                       │
│                    │                                                    │
│              VERSTREUT                                                  │
│              NICHT DURCHSUCHBAR                                         │
│              WIRD FÜR ADS GESCANNT                                      │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                                 │
                                 │  0711 App
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│  SCHRITT 1: App herunterladen                                           │
│                                                                         │
│  User installiert 0711 App (iOS / Android / Mac)                        │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│  SCHRITT 2: Accounts verbinden                                          │
│                                                                         │
│  User gibt 0711 OAuth-Zugriff auf:                                      │
│  • Apple Photos (via native PhotoKit)                                   │
│  • Google Photos (via API)                                              │
│  • Google Drive                                                         │
│  • iCloud Drive                                                         │
│                                                                         │
│  0711 App → zieht ALLE Daten → 0711 Cloud                               │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│  SCHRITT 3: Verarbeitung auf 0711 Servern                               │
│  (passiert im Hintergrund, User wartet kurz)                            │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                                                                 │   │
│  │  • Alle Fotos analysieren                                       │   │
│  │  • Gesichter erkennen und GRUPPIEREN                            │   │
│  │  • Orte clustern (GPS)                                          │   │
│  │  • Dokumente kategorisieren                                     │   │
│  │  • Such-Vektoren erstellen                                      │   │
│  │                                                                 │   │
│  │  Ergebnis: Alles vorsortiert und gruppiert                      │   │
│  │                                                                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│  SCHRITT 4: Quick Tagging (~10 Minuten)                                 │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                                                                 │   │
│  │  "Fast fertig - wir haben alles vorbereitet"                    │   │
│  │                                                                 │   │
│  │  ┌──────────────────────────────────────────────────────────┐  │   │
│  │  │  Personen                               3 von 15 offen   │  │   │
│  │  │                                                          │  │   │
│  │  │  [Mama ✓]  [Papa ✓]  [Wer?]  [Wer?]  [Wer?]  ...        │  │   │
│  │  │   247       189       156      89       34               │  │   │
│  │  └──────────────────────────────────────────────────────────┘  │   │
│  │                                                                 │   │
│  │  ┌──────────────────────────────────────────────────────────┐  │   │
│  │  │  Orte                                   2 von 8 offen    │  │   │
│  │  │                                                          │  │   │
│  │  │  [Zuhause ✓]  [Büro ✓]  [Wo?]  [Wo?]  ...               │  │   │
│  │  │    892          234       156     67                     │  │   │
│  │  └──────────────────────────────────────────────────────────┘  │   │
│  │                                                                 │   │
│  │  User tippt nur noch Namen ein → FERTIG                         │   │
│  │                                                                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  WICHTIG: Die ganze Gruppierung ist VORHER schon passiert.              │
│  User bestätigt nur noch die Namen.                                     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│  SCHRITT 4b: Wir lernen aus den Korrekturen                             │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                                                                 │   │
│  │  Was wir lernen (aggregiert, anonym):                           │   │
│  │  • "Ältere Frau + häufig in Fotos = wahrscheinlich Familie"     │   │
│  │  • "Strand + Koffer = Urlaub"                                   │   │
│  │  • "Dokument mit Beträgen = Finanzen"                           │   │
│  │                                                                 │   │
│  │  Was PRIVAT bleibt:                                             │   │
│  │  • Echte Gesichter                                              │   │
│  │  • Echte Namen                                                  │   │
│  │  • Echte Orte                                                   │   │
│  │  • Dokumentinhalte                                              │   │
│  │                                                                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  → Besseres Modell für alle User                                        │
│  → DAS ist unser Competitive Moat                                       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│  SCHRITT 5: Vault wählen                                                │
│                                                                         │
│  ┌─────────────────────────────┐  ┌─────────────────────────────┐      │
│  │                             │  │                             │      │
│  │      OPTION A: LOKAL        │  │    OPTION B: 0711 CLOUD     │      │
│  │                             │  │                             │      │
│  │  • Mac / NAS / Server       │  │  • Verschlüsselt            │      │
│  │  • 100% Offline möglich     │  │  • Du hältst die Keys       │      │
│  │  • Einmal zahlen            │  │  • Sync auf alle Geräte     │      │
│  │                             │  │                             │      │
│  └─────────────────────────────┘  └─────────────────────────────┘      │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│  SCHRITT 6: Apple / Google löschen                                      │
│                                                                         │
│  → Alle Daten jetzt im eigenen Vault                                    │
│  → iCloud Fotos deaktivieren                                            │
│  → Google Photos leeren                                                 │
│  → FREI!                                                                │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│  DANACH: Kontrollierter Foto-Zugriff                                    │
│                                                                         │
│  App fragt: "Ich brauche ein Foto"                                      │
│                    ↓                                                    │
│  0711 Vault: "Welches willst du teilen?"                                │
│                    ↓                                                    │
│  User wählt EIN Foto → App bekommt nur das                              │
│                                                                         │
│  NIE WIEDER: "Allow access to ALL 10,000 photos"                        │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Zeitlicher Ablauf

| Schritt | Dauer | Was passiert |
|---------|-------|--------------|
| 1. App laden | 1 min | Download & Install |
| 2. Verbinden | 2 min | OAuth für Apple/Google |
| 3. Verarbeitung | 5-30 min | Läuft im Hintergrund |
| 4. Quick Tagging | **~10 min** | User bestätigt Namen |
| 5. Vault wählen | 1 min | Lokal oder Cloud |
| 6. Löschen | 2 min | Goodbye Apple/Google |

**Total: ~20-45 Minuten** → Digitale Souveränität

## Der Flywheel (Unser Moat)

```
User bestätigt Namen
        ↓
Wir lernen MUSTER (anonym)
        ↓
Bessere Gruppierung für alle
        ↓
Mehr User (weil's so gut funktioniert)
        ↓
Noch bessere Muster
        ↓
...
```

## Revenue

| Was | Preis |
|-----|-------|
| Onboarding | €49-199 (einmalig) |
| Cloud Vault | €5-20/mo (optional) |
| Local License | €199 (einmalig) |

## Key Insight

> **Die Daten sind SOWIESO bei Apple/Google.**
>
> Wir fügen kein Risiko hinzu.
> Wir ENTFERNEN es.
