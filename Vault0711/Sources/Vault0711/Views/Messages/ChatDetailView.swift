import SwiftUI

struct ChatDetailView: View {
    let chat: Chat
    @State private var messageText = ""
    @Environment(\.dismiss) var dismiss
    
    var body: some View {
        VStack(spacing: 0) {
            // Messages
            ScrollView {
                VStack(spacing: 8) {
                    // Time Divider
                    Text("Heute")
                        .font(.system(size: 12))
                        .foregroundColor(.gray)
                        .padding(.vertical, 16)
                    
                    // Messages
                    ForEach(sampleMessages) { message in
                        MessageBubble(message: message)
                    }
                }
                .padding(.horizontal, 16)
                .padding(.bottom, 16)
            }
            
            // Encryption Footer
            Text("Alle Nachrichten sind ")
                .foregroundColor(.gray)
            + Text("Ende-zu-Ende verschlüsselt")
                .foregroundColor(.green)
            
            // Input Area
            HStack(spacing: 12) {
                Button(action: {}) {
                    Image(systemName: "plus")
                        .font(.system(size: 24))
                        .foregroundColor(.purple)
                }
                
                TextField("Nachricht...", text: $messageText)
                    .padding(12)
                    .background(Color.white.opacity(0.05))
                    .cornerRadius(22)
                
                Button(action: {}) {
                    Image(systemName: "arrow.up")
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundColor(.white)
                        .frame(width: 36, height: 36)
                        .background(Color.purple)
                        .clipShape(Circle())
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
            .background(Color.black.opacity(0.95))
        }
        .background(Color.black)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .principal) {
                HStack(spacing: 10) {
                    AsyncImage(url: URL(string: "https://i.pravatar.cc/80?\(chat.name.hashValue)")) { image in
                        image
                            .resizable()
                            .aspectRatio(contentMode: .fill)
                    } placeholder: {
                        Color.gray.opacity(0.3)
                    }
                    .frame(width: 40, height: 40)
                    .clipShape(Circle())
                    
                    VStack(alignment: .leading, spacing: 2) {
                        Text(chat.name)
                            .font(.system(size: 16, weight: .semibold))
                        Text("Verschlüsselt")
                            .font(.system(size: 12))
                            .foregroundColor(.green)
                    }
                }
            }
            
            ToolbarItem(placement: .topBarTrailing) {
                HStack(spacing: 16) {
                    Button(action: {}) {
                        Image(systemName: "phone.fill")
                            .foregroundColor(.purple)
                    }
                    Button(action: {}) {
                        Image(systemName: "video.fill")
                            .foregroundColor(.purple)
                    }
                }
            }
        }
    }
}

struct Message: Identifiable {
    let id = UUID()
    let text: String
    let time: String
    let isSent: Bool
}

let sampleMessages = [
    Message(text: "Hey! Hast du Zeit heute Abend?", time: "18:42", isSent: false),
    Message(text: "Hi! Ja, was hast du vor?", time: "18:45", isSent: true),
    Message(text: "Dachte wir könnten was essen gehen. Das neue Restaurant an der Ecke soll gut sein 🍝", time: "18:46", isSent: false),
    Message(text: "Oh ja, da wollte ich auch schon hin! 19:30?", time: "18:48", isSent: true),
    Message(text: "Perfekt! Ich reserviere uns einen Tisch.", time: "18:49", isSent: false),
    Message(text: "Super, danke! Freu mich 🙌", time: "18:50", isSent: true),
    Message(text: "Klingt gut! Bis dann 👋", time: "18:51", isSent: false),
]

struct MessageBubble: View {
    let message: Message
    
    var body: some View {
        HStack {
            if message.isSent { Spacer() }
            
            VStack(alignment: message.isSent ? .trailing : .leading, spacing: 4) {
                Text(message.text)
                    .font(.system(size: 16))
                    .foregroundColor(.white)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 12)
                    .background(message.isSent ? Color.purple : Color.white.opacity(0.1))
                    .cornerRadius(20, corners: message.isSent ? [.topLeft, .topRight, .bottomLeft] : [.topLeft, .topRight, .bottomRight])
                
                Text(message.time)
                    .font(.system(size: 11))
                    .foregroundColor(.gray)
                    .padding(.horizontal, 8)
            }
            
            if !message.isSent { Spacer() }
        }
    }
}

// Helper for selective corner radius
extension View {
    func cornerRadius(_ radius: CGFloat, corners: UIRectCorner) -> some View {
        clipShape(RoundedCorner(radius: radius, corners: corners))
    }
}

struct RoundedCorner: Shape {
    var radius: CGFloat = .infinity
    var corners: UIRectCorner = .allCorners

    func path(in rect: CGRect) -> Path {
        let path = UIBezierPath(roundedRect: rect, byRoundingCorners: corners, cornerRadii: CGSize(width: radius, height: radius))
        return Path(path.cgPath)
    }
}

#Preview {
    NavigationStack {
        ChatDetailView(chat: sampleChats[0])
    }
    .preferredColorScheme(.dark)
}
