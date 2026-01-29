import SwiftUI

@main
struct Vault0711App: App {
    @StateObject private var appState = AppState()
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(appState)
                .preferredColorScheme(.dark)
        }
    }
}

class AppState: ObservableObject {
    @Published var isAuthenticated = false
    @Published var isOnboarding = true
    @Published var selectedTab: Tab = .home
    
    enum Tab: String, CaseIterable {
        case home = "Home"
        case photos = "Fotos"
        case documents = "Dokumente"
        case messages = "Chats"
        case settings = "Mehr"
        
        var icon: String {
            switch self {
            case .home: return "house.fill"
            case .photos: return "photo.fill"
            case .documents: return "doc.fill"
            case .messages: return "bubble.left.fill"
            case .settings: return "gearshape.fill"
            }
        }
    }
}

struct ContentView: View {
    @EnvironmentObject var appState: AppState
    
    var body: some View {
        Group {
            if appState.isOnboarding {
                OnboardingView()
            } else if !appState.isAuthenticated {
                UnlockView()
            } else {
                MainTabView()
            }
        }
    }
}
