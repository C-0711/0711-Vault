import SwiftUI
import Photos
import PhotosUI

struct PhotoImportView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var selectedItems: [PhotosPickerItem] = []
    @State private var authorizationStatus: PHAuthorizationStatus = .notDetermined
    @State private var isLoading = false
    
    let onImport: ([PHAsset]) -> Void
    
    var body: some View {
        NavigationView {
            VStack(spacing: 24) {
                if authorizationStatus == .authorized || authorizationStatus == .limited {
                    // Photo picker
                    PhotosPicker(
                        selection: $selectedItems,
                        maxSelectionCount: 100,
                        matching: .images
                    ) {
                        VStack(spacing: 16) {
                            Image(systemName: "photo.on.rectangle.angled")
                                .font(.system(size: 60))
                                .foregroundColor(.blue)
                            Text("Fotos auswählen")
                                .font(.title2)
                                .fontWeight(.semibold)
                            Text("Wähle bis zu 100 Fotos aus")
                                .foregroundColor(.secondary)
                        }
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                        .background(Color(.systemGroupedBackground))
                        .cornerRadius(16)
                        .padding()
                    }
                    
                    if !selectedItems.isEmpty {
                        VStack(spacing: 12) {
                            Text("\(selectedItems.count) Fotos ausgewählt")
                                .font(.headline)
                            
                            Button(action: importSelected) {
                                HStack {
                                    if isLoading {
                                        ProgressView()
                                            .tint(.white)
                                    }
                                    Text(isLoading ? "Importiere..." : "Importieren")
                                        .fontWeight(.semibold)
                                }
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Color.blue)
                                .foregroundColor(.white)
                                .cornerRadius(12)
                            }
                            .disabled(isLoading)
                        }
                        .padding()
                    }
                } else if authorizationStatus == .denied || authorizationStatus == .restricted {
                    // Permission denied
                    VStack(spacing: 16) {
                        Image(systemName: "photo.badge.exclamationmark")
                            .font(.system(size: 60))
                            .foregroundColor(.red)
                        Text("Zugriff verweigert")
                            .font(.title2)
                            .fontWeight(.semibold)
                        Text("Bitte erlaube den Zugriff auf deine Fotos in den Einstellungen")
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                        Button("Einstellungen öffnen") {
                            if let url = URL(string: UIApplication.openSettingsURLString) {
                                UIApplication.shared.open(url)
                            }
                        }
                        .padding()
                        .background(Color.blue)
                        .foregroundColor(.white)
                        .cornerRadius(10)
                    }
                    .padding()
                } else {
                    // Request permission
                    VStack(spacing: 16) {
                        Image(systemName: "photo.on.rectangle")
                            .font(.system(size: 60))
                            .foregroundColor(.blue)
                        Text("Fotozugriff erforderlich")
                            .font(.title2)
                            .fontWeight(.semibold)
                        Text("Um Fotos zu importieren, benötigen wir Zugriff auf deine Fotomediathek")
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                        Button("Zugriff erlauben") {
                            requestAccess()
                        }
                        .padding()
                        .background(Color.blue)
                        .foregroundColor(.white)
                        .cornerRadius(10)
                    }
                    .padding()
                }
            }
            .navigationTitle("Fotos importieren")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Abbrechen") {
                        dismiss()
                    }
                }
            }
            .task {
                checkAuthorization()
            }
        }
    }
    
    func checkAuthorization() {
        authorizationStatus = PHPhotoLibrary.authorizationStatus(for: .readWrite)
    }
    
    func requestAccess() {
        PHPhotoLibrary.requestAuthorization(for: .readWrite) { status in
            DispatchQueue.main.async {
                authorizationStatus = status
            }
        }
    }
    
    func importSelected() {
        isLoading = true
        
        Task {
            var assets: [PHAsset] = []
            
            for item in selectedItems {
                if let identifier = item.itemIdentifier {
                    let fetchResult = PHAsset.fetchAssets(withLocalIdentifiers: [identifier], options: nil)
                    if let asset = fetchResult.firstObject {
                        assets.append(asset)
                    }
                }
            }
            
            DispatchQueue.main.async {
                onImport(assets)
                dismiss()
            }
        }
    }
}

#Preview {
    PhotoImportView { _ in }
}
