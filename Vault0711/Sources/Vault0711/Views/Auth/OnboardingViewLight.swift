import SwiftUI

// Light/White version for comparison
struct OnboardingViewLight: View {
    @EnvironmentObject var appState: AppState
    @State private var currentPage = 0
    
    let pages: [OnboardingPageLight] = [
        OnboardingPageLight(
            symbol: "lock.shield.fill",
            title: "Ende-zu-Ende\nverschlüsselt",
            subtitle: "Deine Daten verlassen niemals unverschlüsselt dein Gerät. Nur du hast den Schlüssel.",
            color: .blue
        ),
        OnboardingPageLight(
            symbol: "photo.stack.fill",
            title: "Fotos & Videos\nsicher gespeichert",
            subtitle: "Importiere deine Erinnerungen aus iCloud oder Google Photos.",
            color: .purple
        ),
        OnboardingPageLight(
            symbol: "doc.text.viewfinder",
            title: "Dokumente\nautomatisch erkannt",
            subtitle: "Scanne Verträge und Rechnungen. Intelligente Erkennung sortiert alles.",
            color: .orange
        ),
        OnboardingPageLight(
            symbol: "bubble.left.and.bubble.right.fill",
            title: "Private Nachrichten",
            subtitle: "Chats und Anrufe die niemand mitlesen kann.",
            color: .green
        ),
    ]
    
    var body: some View {
        ZStack {
            // Clean white background
            Color.white.ignoresSafeArea()
            
            VStack(spacing: 0) {
                // Skip
                HStack {
                    Spacer()
                    Button("Überspringen") {
                        withAnimation {
                            appState.isOnboarding = false
                        }
                    }
                    .font(.system(size: 15, weight: .medium))
                    .foregroundColor(.gray)
                    .padding(.trailing, 24)
                    .padding(.top, 16)
                }
                
                // Pages
                TabView(selection: $currentPage) {
                    ForEach(0..<pages.count, id: \.self) { index in
                        OnboardingPageLightView(page: pages[index])
                            .tag(index)
                    }
                }
                .tabViewStyle(.page(indexDisplayMode: .never))
                
                // Page dots
                HStack(spacing: 8) {
                    ForEach(0..<pages.count, id: \.self) { index in
                        Circle()
                            .fill(currentPage == index ? pages[currentPage].color : Color.gray.opacity(0.3))
                            .frame(width: 8, height: 8)
                    }
                }
                .padding(.bottom, 40)
                
                // CTA
                Button(action: {
                    if currentPage < pages.count - 1 {
                        withAnimation {
                            currentPage += 1
                        }
                    } else {
                        withAnimation {
                            appState.isOnboarding = false
                            appState.isAuthenticated = true
                        }
                    }
                }) {
                    Text(currentPage < pages.count - 1 ? "Weiter" : "Vault erstellen")
                        .font(.system(size: 17, weight: .semibold))
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 18)
                        .background(pages[currentPage].color)
                        .cornerRadius(14)
                }
                .padding(.horizontal, 32)
                
                Spacer().frame(height: 50)
            }
        }
    }
}

struct OnboardingPageLight {
    let symbol: String
    let title: String
    let subtitle: String
    let color: Color
}

struct OnboardingPageLightView: View {
    let page: OnboardingPageLight
    
    var body: some View {
        VStack(spacing: 40) {
            Spacer()
            
            // Icon with color background
            ZStack {
                Circle()
                    .fill(page.color.opacity(0.1))
                    .frame(width: 160, height: 160)
                
                Circle()
                    .fill(page.color.opacity(0.15))
                    .frame(width: 120, height: 120)
                
                Image(systemName: page.symbol)
                    .font(.system(size: 48, weight: .medium))
                    .foregroundColor(page.color)
            }
            
            VStack(spacing: 16) {
                Text(page.title)
                    .font(.system(size: 32, weight: .bold))
                    .multilineTextAlignment(.center)
                    .foregroundColor(.black)
                
                Text(page.subtitle)
                    .font(.system(size: 17))
                    .multilineTextAlignment(.center)
                    .foregroundColor(.gray)
                    .lineSpacing(4)
                    .padding(.horizontal, 40)
            }
            
            Spacer()
            Spacer()
        }
    }
}
