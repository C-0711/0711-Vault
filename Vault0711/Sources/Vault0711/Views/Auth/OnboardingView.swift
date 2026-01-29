import SwiftUI

struct OnboardingView: View {
    @EnvironmentObject var appState: AppState
    @State private var currentPage = 0
    
    // Elegant design - no emojis, SF Symbols only
    let pages: [OnboardingPage] = [
        OnboardingPage(
            symbol: "lock.shield.fill",
            title: "Ende-zu-Ende\nverschlüsselt",
            subtitle: "Deine Daten verlassen niemals unverschlüsselt dein Gerät. Nur du hast den Schlüssel."
        ),
        OnboardingPage(
            symbol: "photo.stack.fill",
            title: "Fotos & Videos\nsicher gespeichert",
            subtitle: "Importiere deine Erinnerungen aus iCloud oder Google Photos. Wir löschen sie aus der Cloud."
        ),
        OnboardingPage(
            symbol: "doc.text.viewfinder",
            title: "Dokumente\nautomatisch erkannt",
            subtitle: "Scanne Verträge, Rechnungen und mehr. Intelligente Erkennung sortiert alles für dich."
        ),
        OnboardingPage(
            symbol: "bubble.left.and.bubble.right.fill",
            title: "Private Nachrichten\nohne Überwachung",
            subtitle: "Chats und Anrufe die niemand mitlesen kann. Auch wir nicht."
        ),
    ]
    
    var body: some View {
        ZStack {
            // Background - elegant dark gradient
            LinearGradient(
                colors: [Color(hex: "0a0a0a"), Color(hex: "111111")],
                startPoint: .top,
                endPoint: .bottom
            )
            .ignoresSafeArea()
            
            VStack(spacing: 0) {
                // Skip button
                HStack {
                    Spacer()
                    Button("Überspringen") {
                        withAnimation(.easeInOut(duration: 0.3)) {
                            appState.isOnboarding = false
                        }
                    }
                    .font(.system(size: 15, weight: .medium))
                    .foregroundColor(.white.opacity(0.5))
                    .padding(.trailing, 24)
                    .padding(.top, 16)
                }
                
                // Page content
                TabView(selection: $currentPage) {
                    ForEach(0..<pages.count, id: \.self) { index in
                        OnboardingPageView(page: pages[index])
                            .tag(index)
                    }
                }
                .tabViewStyle(.page(indexDisplayMode: .never))
                
                // Elegant page indicator
                HStack(spacing: 8) {
                    ForEach(0..<pages.count, id: \.self) { index in
                        Capsule()
                            .fill(currentPage == index ? Color.white : Color.white.opacity(0.2))
                            .frame(width: currentPage == index ? 24 : 8, height: 8)
                            .animation(.spring(response: 0.3), value: currentPage)
                    }
                }
                .padding(.bottom, 40)
                
                // CTA Button - subtle, elegant
                Button(action: {
                    if currentPage < pages.count - 1 {
                        withAnimation(.easeInOut(duration: 0.3)) {
                            currentPage += 1
                        }
                    } else {
                        withAnimation(.easeInOut(duration: 0.3)) {
                            appState.isOnboarding = false
                            appState.isAuthenticated = true
                        }
                    }
                }) {
                    Text(currentPage < pages.count - 1 ? "Weiter" : "Vault erstellen")
                        .font(.system(size: 17, weight: .semibold))
                        .foregroundColor(.black)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 18)
                        .background(Color.white)
                        .cornerRadius(14)
                }
                .padding(.horizontal, 32)
                
                // Secondary action
                if currentPage == pages.count - 1 {
                    Button(action: {
                        withAnimation {
                            appState.isOnboarding = false
                        }
                    }) {
                        Text("Bereits einen Vault? Anmelden")
                            .font(.system(size: 15, weight: .medium))
                            .foregroundColor(.white.opacity(0.5))
                    }
                    .padding(.top, 16)
                }
                
                Spacer()
                    .frame(height: 50)
            }
        }
    }
}

struct OnboardingPage {
    let symbol: String
    let title: String
    let subtitle: String
}

struct OnboardingPageView: View {
    let page: OnboardingPage
    
    var body: some View {
        VStack(spacing: 40) {
            Spacer()
            
            // Elegant icon with subtle glow
            ZStack {
                // Outer glow
                Circle()
                    .fill(
                        RadialGradient(
                            colors: [Color.white.opacity(0.08), Color.clear],
                            center: .center,
                            startRadius: 40,
                            endRadius: 100
                        )
                    )
                    .frame(width: 200, height: 200)
                
                // Icon container
                Circle()
                    .fill(Color.white.opacity(0.05))
                    .frame(width: 120, height: 120)
                
                // SF Symbol
                Image(systemName: page.symbol)
                    .font(.system(size: 48, weight: .light))
                    .foregroundColor(.white)
            }
            
            // Typography
            VStack(spacing: 16) {
                Text(page.title)
                    .font(.system(size: 32, weight: .bold, design: .default))
                    .multilineTextAlignment(.center)
                    .foregroundColor(.white)
                
                Text(page.subtitle)
                    .font(.system(size: 17, weight: .regular))
                    .multilineTextAlignment(.center)
                    .foregroundColor(.white.opacity(0.6))
                    .lineSpacing(4)
                    .padding(.horizontal, 40)
            }
            
            Spacer()
            Spacer()
        }
    }
}

// Color extension for hex
extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3:
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6:
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8:
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (1, 1, 1, 0)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}

#Preview {
    OnboardingView()
        .environmentObject(AppState())
}
