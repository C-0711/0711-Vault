import SwiftUI

struct WelcomeView: View {
    @EnvironmentObject var appState: AppState
    
    var body: some View {
        VStack(spacing: 0) {
            Spacer()
            
            // Logo
            VStack(spacing: 16) {
                Text("0711")
                    .font(.system(size: 64, weight: .heavy))
                    .foregroundColor(.white)
                + Text(".io")
                    .font(.system(size: 64, weight: .heavy))
                    .foregroundColor(.gray.opacity(0.4))
                
                VStack(spacing: 4) {
                    Text("Dein digitales Leben.")
                        .foregroundColor(.gray)
                    Text("Hinter verschlossenen Türen.")
                        .foregroundColor(Color.green)
                        .fontWeight(.semibold)
                }
                .font(.system(size: 18))
            }
            
            // Features
            VStack(spacing: 16) {
                FeatureRow(icon: "🔒", title: "Ende-zu-Ende", subtitle: "verschlüsselt")
                FeatureRow(icon: "🖼️", title: "Fotos & Dokumente", subtitle: "sicher gespeichert")
                FeatureRow(icon: "💬", title: "Private Nachrichten", subtitle: "ohne Überwachung")
            }
            .padding(.top, 48)
            
            Spacer()
            
            // Buttons
            VStack(spacing: 12) {
                Button(action: {
                    withAnimation {
                        appState.isOnboarding = false
                        appState.isAuthenticated = true
                    }
                }) {
                    Text("Vault erstellen")
                        .font(.system(size: 17, weight: .semibold))
                        .foregroundColor(.black)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 18)
                        .background(Color.green)
                        .cornerRadius(14)
                }
                
                Button(action: {
                    withAnimation {
                        appState.isOnboarding = false
                    }
                }) {
                    HStack(spacing: 4) {
                        Text("Bereits einen Vault?")
                            .foregroundColor(.gray)
                        Text("Anmelden")
                            .foregroundColor(.green)
                            .fontWeight(.semibold)
                    }
                    .font(.system(size: 15))
                }
            }
            .padding(.horizontal, 32)
            .padding(.bottom, 40)
        }
        .background(Color.black)
    }
}

struct FeatureRow: View {
    let icon: String
    let title: String
    let subtitle: String
    
    var body: some View {
        HStack(spacing: 16) {
            Text(icon)
                .font(.system(size: 20))
                .frame(width: 44, height: 44)
                .background(Color.white.opacity(0.05))
                .cornerRadius(12)
            
            HStack(spacing: 4) {
                Text(title)
                    .fontWeight(.semibold)
                    .foregroundColor(.white)
                Text(subtitle)
                    .foregroundColor(.gray)
            }
            .font(.system(size: 15))
            
            Spacer()
        }
        .padding(.horizontal, 32)
    }
}

#Preview {
    WelcomeView()
        .environmentObject(AppState())
}
