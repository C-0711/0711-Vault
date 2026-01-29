import SwiftUI

struct MessagesView: View {
    @State private var searchText = ""
    @State private var selectedChat: Chat?
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    // Search Bar
                    HStack {
                        Image(systemName: "magnifyingglass")
                            .foregroundColor(.gray)
                        TextField("Suchen...", text: $searchText)
                            .foregroundColor(.white)
                    }
                    .padding(12)
                    .background(Color.white.opacity(0.05))
                    .cornerRadius(12)
                    
                    // Encryption Badge
                    HStack(spacing: 6) {
                        Image(systemName: "lock.fill")
                            .font(.system(size: 12))
                        Text("Alle Nachrichten sind Ende-zu-Ende verschlüsselt")
                            .font(.system(size: 12))
                    }
                    .foregroundColor(.green)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 10)
                    .background(Color.green.opacity(0.1))
                    .cornerRadius(10)
                    
                    // Chat List
                    VStack(spacing: 0) {
                        ForEach(sampleChats) { chat in
                            NavigationLink(destination: ChatDetailView(chat: chat)) {
                                ChatRow(chat: chat)
                            }
                        }
                    }
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 20)
            }
            .background(Color.black)
            .navigationTitle("Nachrichten")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button(action: {}) {
                        Image(systemName: "ellipsis")
                            .font(.system(size: 18))
                            .foregroundColor(.white)
                    }
                }
            }
            .overlay(alignment: .bottomTrailing) {
                // Compose FAB
                Button(action: {}) {
                    Image(systemName: "square.and.pencil")
                        .font(.system(size: 20))
                        .foregroundColor(.white)
                        .frame(width: 56, height: 56)
                        .background(Color.purple)
                        .cornerRadius(16)
                        .shadow(color: .purple.opacity(0.3), radius: 10, y: 4)
                }
                .padding(.trailing, 20)
                .padding(.bottom, 20)
            }
        }
    }
}

struct Chat: Identifiable {
    let id = UUID()
    let name: String
    let lastMessage: String
    let time: String
    let unreadCount: Int
    let isOnline: Bool
}

let sampleChats = [
    Chat(name: "Lisa", lastMessage: "Klingt gut! Bis dann 👋", time: "Jetzt", unreadCount: 0, isOnline: true),
    Chat(name: "Max", lastMessage: "Hast du das Dokument bekommen?", time: "14:32", unreadCount: 2, isOnline: false),
    Chat(name: "Familie", lastMessage: "Mama: Wann kommst du vorbei?", time: "Gestern", unreadCount: 5, isOnline: false),
    Chat(name: "Sophie", lastMessage: "Das Foto ist super geworden!", time: "Mo", unreadCount: 0, isOnline: false),
    Chat(name: "Tom", lastMessage: "👍", time: "So", unreadCount: 0, isOnline: false),
    Chat(name: "Anna", lastMessage: "Können wir morgen telefonieren?", time: "Sa", unreadCount: 0, isOnline: false),
    Chat(name: "Arbeit Team", lastMessage: "Chef: Meeting verschoben auf 15 Uhr", time: "Fr", unreadCount: 0, isOnline: false),
]

struct ChatRow: View {
    let chat: Chat
    
    var body: some View {
        HStack(spacing: 14) {
            // Avatar
            ZStack(alignment: .bottomTrailing) {
                AsyncImage(url: URL(string: "https://i.pravatar.cc/112?\(chat.name.hashValue)")) { image in
                    image
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                } placeholder: {
                    Color.gray.opacity(0.3)
                }
                .frame(width: 56, height: 56)
                .clipShape(Circle())
                
                if chat.isOnline {
                    Circle()
                        .fill(Color.green)
                        .frame(width: 14, height: 14)
                        .overlay(Circle().stroke(Color.black, lineWidth: 3))
                }
            }
            
            // Info
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text(chat.name)
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundColor(.white)
                    Spacer()
                    Text(chat.time)
                        .font(.system(size: 13))
                        .foregroundColor(.gray)
                }
                
                Text(chat.lastMessage)
                    .font(.system(size: 14))
                    .foregroundColor(chat.unreadCount > 0 ? .white : .gray)
                    .fontWeight(chat.unreadCount > 0 ? .medium : .regular)
                    .lineLimit(1)
            }
            
            // Unread Badge
            if chat.unreadCount > 0 {
                Text("\(chat.unreadCount)")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundColor(.white)
                    .frame(width: 22, height: 22)
                    .background(Color.purple)
                    .clipShape(Circle())
            }
        }
        .padding(.vertical, 14)
        .contentShape(Rectangle())
    }
}

#Preview {
    MessagesView()
        .preferredColorScheme(.dark)
}
