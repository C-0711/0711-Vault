import SwiftUI

struct MainTabView: View {
    @EnvironmentObject var appState: AppState
    
    var body: some View {
        TabView(selection: $appState.selectedTab) {
            HomeView()
                .tabItem {
                    Image(systemName: "house.fill")
                    Text("Home")
                }
                .tag(AppState.Tab.home)
            
            PhotosView()
                .tabItem {
                    Image(systemName: "photo.fill")
                    Text("Fotos")
                }
                .tag(AppState.Tab.photos)
            
            DocumentsView()
                .tabItem {
                    Image(systemName: "doc.fill")
                    Text("Dokumente")
                }
                .tag(AppState.Tab.documents)
            
            MessagesView()
                .tabItem {
                    Image(systemName: "bubble.left.fill")
                    Text("Chats")
                }
                .tag(AppState.Tab.messages)
            
            SettingsView()
                .tabItem {
                    Image(systemName: "gearshape.fill")
                    Text("Mehr")
                }
                .tag(AppState.Tab.settings)
        }
        .tint(.green)
    }
}

#Preview {
    MainTabView()
        .environmentObject(AppState())
        .preferredColorScheme(.dark)
}
