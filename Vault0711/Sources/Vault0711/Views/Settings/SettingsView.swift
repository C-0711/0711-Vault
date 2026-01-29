import SwiftUI

struct SettingsView: View {
    @EnvironmentObject var appState: AppState
    @State private var faceIDEnabled = true
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    // Profile Card
                    HStack(spacing: 16) {
                        Text("M")
                            .font(.system(size: 28, weight: .bold))
                            .foregroundColor(.black)
                            .frame(width: 64, height: 64)
                            .background(Color.green)
                            .clipShape(Circle())
                        
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Max Mustermann")
                                .font(.system(size: 20, weight: .semibold))
                            Text("max@beispiel.de")
                                .font(.system(size: 14))
                                .foregroundColor(.gray)
                        }
                        
                        Spacer()
                    }
                    .padding(20)
                    .background(Color.white.opacity(0.05))
                    .cornerRadius(16)
                    
                    // Security Section
                    SettingsSection(title: "SICHERHEIT") {
                        VStack(spacing: 0) {
                            SettingsToggleRow(
                                icon: "🔐",
                                iconColor: .green,
                                title: "Face ID",
                                subtitle: "Vault mit Face ID entsperren",
                                isOn: $faceIDEnabled
                            )
                            
                            Divider().background(Color.white.opacity(0.1))
                            
                            SettingsNavigationRow(
                                icon: "🔑",
                                iconColor: .blue,
                                title: "Vault Passwort ändern"
                            )
                            
                            Divider().background(Color.white.opacity(0.1))
                            
                            SettingsValueRow(
                                icon: "⏱️",
                                iconColor: .purple,
                                title: "Auto-Lock",
                                value: "Nach 5 Minuten"
                            )
                        }
                    }
                    
                    // Storage Section
                    SettingsSection(title: "SPEICHER") {
                        VStack(alignment: .leading, spacing: 12) {
                            HStack {
                                Text("34.2 GB")
                                    .font(.system(size: 24, weight: .bold))
                                    .foregroundColor(.green)
                                Spacer()
                                Text("von 100 GB")
                                    .font(.system(size: 14))
                                    .foregroundColor(.gray)
                            }
                            
                            GeometryReader { geo in
                                ZStack(alignment: .leading) {
                                    Rectangle()
                                        .fill(Color.white.opacity(0.1))
                                        .frame(height: 8)
                                        .cornerRadius(4)
                                    
                                    LinearGradient(
                                        colors: [.green, .blue],
                                        startPoint: .leading,
                                        endPoint: .trailing
                                    )
                                    .frame(width: geo.size.width * 0.34, height: 8)
                                    .cornerRadius(4)
                                }
                            }
                            .frame(height: 8)
                        }
                        .padding(16)
                    }
                    
                    // Data Section
                    SettingsSection(title: "DATEN") {
                        VStack(spacing: 0) {
                            SettingsNavigationRow(
                                icon: "📥",
                                iconColor: .blue,
                                title: "Daten importieren",
                                subtitle: "Fotos, Dokumente, Kontakte"
                            )
                            
                            Divider().background(Color.white.opacity(0.1))
                            
                            SettingsNavigationRow(
                                icon: "📤",
                                iconColor: .orange,
                                title: "Backup exportieren"
                            )
                        }
                    }
                    
                    // Account Section
                    SettingsSection(title: "KONTO") {
                        Button(action: {
                            withAnimation {
                                appState.isAuthenticated = false
                            }
                        }) {
                            HStack(spacing: 14) {
                                Text("🚪")
                                    .font(.system(size: 16))
                                    .frame(width: 32, height: 32)
                                    .background(Color.red.opacity(0.2))
                                    .cornerRadius(8)
                                
                                Text("Vault sperren")
                                    .font(.system(size: 16))
                                    .foregroundColor(.red)
                                
                                Spacer()
                            }
                            .padding(16)
                        }
                    }
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 20)
            }
            .background(Color.black)
            .navigationTitle("Einstellungen")
        }
    }
}

struct SettingsSection<Content: View>: View {
    let title: String
    @ViewBuilder let content: Content
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(title)
                .font(.system(size: 13, weight: .semibold))
                .foregroundColor(.gray)
                .tracking(1)
                .padding(.leading, 4)
            
            content
                .background(Color.white.opacity(0.05))
                .cornerRadius(14)
        }
    }
}

struct SettingsToggleRow: View {
    let icon: String
    let iconColor: Color
    let title: String
    let subtitle: String?
    @Binding var isOn: Bool
    
    init(icon: String, iconColor: Color, title: String, subtitle: String? = nil, isOn: Binding<Bool>) {
        self.icon = icon
        self.iconColor = iconColor
        self.title = title
        self.subtitle = subtitle
        self._isOn = isOn
    }
    
    var body: some View {
        HStack(spacing: 14) {
            Text(icon)
                .font(.system(size: 16))
                .frame(width: 32, height: 32)
                .background(iconColor.opacity(0.2))
                .cornerRadius(8)
            
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.system(size: 16))
                    .foregroundColor(.white)
                if let subtitle = subtitle {
                    Text(subtitle)
                        .font(.system(size: 13))
                        .foregroundColor(.gray)
                }
            }
            
            Spacer()
            
            Toggle("", isOn: $isOn)
                .tint(.green)
        }
        .padding(16)
    }
}

struct SettingsNavigationRow: View {
    let icon: String
    let iconColor: Color
    let title: String
    var subtitle: String? = nil
    
    var body: some View {
        HStack(spacing: 14) {
            Text(icon)
                .font(.system(size: 16))
                .frame(width: 32, height: 32)
                .background(iconColor.opacity(0.2))
                .cornerRadius(8)
            
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.system(size: 16))
                    .foregroundColor(.white)
                if let subtitle = subtitle {
                    Text(subtitle)
                        .font(.system(size: 13))
                        .foregroundColor(.gray)
                }
            }
            
            Spacer()
            
            Image(systemName: "chevron.right")
                .font(.system(size: 14, weight: .semibold))
                .foregroundColor(.gray.opacity(0.5))
        }
        .padding(16)
    }
}

struct SettingsValueRow: View {
    let icon: String
    let iconColor: Color
    let title: String
    let value: String
    
    var body: some View {
        HStack(spacing: 14) {
            Text(icon)
                .font(.system(size: 16))
                .frame(width: 32, height: 32)
                .background(iconColor.opacity(0.2))
                .cornerRadius(8)
            
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.system(size: 16))
                    .foregroundColor(.white)
                Text(value)
                    .font(.system(size: 13))
                    .foregroundColor(.gray)
            }
            
            Spacer()
            
            Image(systemName: "chevron.right")
                .font(.system(size: 14, weight: .semibold))
                .foregroundColor(.gray.opacity(0.5))
        }
        .padding(16)
    }
}

#Preview {
    SettingsView()
        .environmentObject(AppState())
        .preferredColorScheme(.dark)
}
