import SwiftUI
import PhotosUI

struct ImportSourcesView: View {
    @EnvironmentObject var appState: AppState
    @State private var selectedSources: Set<ImportSource> = []
    @State private var showPhotoPicker = false
    @State private var selectedPhotoItems: [PhotosPickerItem] = []
    
    enum ImportSource: String, CaseIterable {
        case photos = "Fotos"
        case documents = "Dateien"
        case contacts = "Kontakte"
        
        var icon: String {
            switch self {
            case .photos: return "photo.stack.fill"
            case .documents: return "doc.fill"
            case .contacts: return "person.2.fill"
            }
        }
        
        var subtitle: String {
            switch self {
            case .photos: return "Aus Fotos App"
            case .documents: return "Aus Dateien App"
            case .contacts: return "Aus Kontakte App"
            }
        }
        
        var color: Color {
            switch self {
            case .photos: return .orange
            case .documents: return .blue
            case .contacts: return .purple
            }
        }
    }
    
    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()
            
            VStack(spacing: 0) {
                // Header
                VStack(alignment: .leading, spacing: 8) {
                    Text("Daten importieren")
                        .font(.system(size: 32, weight: .bold))
                    
                    Text("Wähle aus, was du in deinen\nVault übertragen möchtest.")
                        .font(.system(size: 17))
                        .foregroundColor(.gray)
                        .lineSpacing(4)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal, 24)
                .padding(.top, 60)
                .padding(.bottom, 32)
                
                // Import sources
                VStack(spacing: 12) {
                    ForEach(ImportSource.allCases, id: \.self) { source in
                        ImportSourceRow(
                            source: source,
                            isSelected: selectedSources.contains(source)
                        ) {
                            if selectedSources.contains(source) {
                                selectedSources.remove(source)
                            } else {
                                selectedSources.insert(source)
                            }
                        }
                    }
                }
                .padding(.horizontal, 24)
                
                Spacer()
                
                // Privacy note
                HStack(spacing: 8) {
                    Image(systemName: "lock.shield.fill")
                        .foregroundColor(.green)
                    Text("Deine Daten werden nur lokal auf diesem Gerät gespeichert")
                        .foregroundColor(.gray)
                }
                .font(.system(size: 13))
                .padding(.horizontal, 24)
                .padding(.bottom, 24)
                
                // CTA
                VStack(spacing: 12) {
                    // Main button - opens PHPicker for photos
                    PhotosPicker(
                        selection: $selectedPhotoItems,
                        maxSelectionCount: 1000,
                        matching: .images,
                        photoLibrary: .shared()
                    ) {
                        Text(selectedSources.isEmpty ? "Quellen auswählen" : "Import starten")
                            .font(.system(size: 17, weight: .semibold))
                            .foregroundColor(selectedSources.isEmpty ? .gray : .black)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 18)
                            .background(selectedSources.isEmpty ? Color.white.opacity(0.1) : Color.white)
                            .cornerRadius(14)
                    }
                    .disabled(selectedSources.isEmpty)
                    
                    // Skip
                    Button(action: {
                        withAnimation {
                            appState.isOnboarding = false
                            appState.isAuthenticated = true
                        }
                    }) {
                        Text("Später einrichten")
                            .font(.system(size: 15, weight: .medium))
                            .foregroundColor(.white.opacity(0.5))
                    }
                }
                .padding(.horizontal, 32)
                .padding(.bottom, 50)
            }
        }
    }
}

struct ImportSourceRow: View {
    let source: ImportSourcesView.ImportSource
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            HStack(spacing: 16) {
                // Icon
                ZStack {
                    RoundedRectangle(cornerRadius: 12)
                        .fill(source.color.opacity(0.15))
                        .frame(width: 48, height: 48)
                    
                    Image(systemName: source.icon)
                        .font(.system(size: 20))
                        .foregroundColor(source.color)
                }
                
                // Text
                VStack(alignment: .leading, spacing: 2) {
                    Text(source.rawValue)
                        .font(.system(size: 17, weight: .semibold))
                        .foregroundColor(.white)
                    
                    Text(source.subtitle)
                        .font(.system(size: 14))
                        .foregroundColor(.gray)
                }
                
                Spacer()
                
                // Checkbox
                ZStack {
                    Circle()
                        .stroke(isSelected ? Color.green : Color.white.opacity(0.2), lineWidth: 2)
                        .frame(width: 26, height: 26)
                    
                    if isSelected {
                        Circle()
                            .fill(Color.green)
                            .frame(width: 26, height: 26)
                        
                        Image(systemName: "checkmark")
                            .font(.system(size: 12, weight: .bold))
                            .foregroundColor(.black)
                    }
                }
            }
            .padding(16)
            .background(
                RoundedRectangle(cornerRadius: 16)
                    .fill(Color.white.opacity(0.05))
                    .overlay(
                        RoundedRectangle(cornerRadius: 16)
                            .stroke(isSelected ? Color.green.opacity(0.5) : Color.clear, lineWidth: 2)
                    )
            )
        }
    }
}

#Preview {
    ImportSourcesView()
        .environmentObject(AppState())
}
