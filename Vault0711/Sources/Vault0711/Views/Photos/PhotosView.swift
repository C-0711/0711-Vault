import SwiftUI
import Photos

struct PhotosView: View {
    @State private var items: [VaultItem] = []
    @State private var localPhotos: [PHAsset] = []
    @State private var selectedPhotos: Set<String> = []
    @State private var isLoading = true
    @State private var isImporting = false
    @State private var showImportSheet = false
    @State private var uploadProgress: Double = 0
    @State private var viewMode: ViewMode = .grid
    
    enum ViewMode: String, CaseIterable {
        case grid = "Alle"
        case people = "Personen"
        case places = "Orte"
    }
    
    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // View Mode Picker
                Picker("Ansicht", selection: $viewMode) {
                    ForEach(ViewMode.allCases, id: \.self) { mode in
                        Text(mode.rawValue).tag(mode)
                    }
                }
                .pickerStyle(.segmented)
                .padding()
                
                // Content
                Group {
                    switch viewMode {
                    case .grid:
                        gridView
                    case .people:
                        peopleView
                    case .places:
                        placesView
                    }
                }
            }
            .navigationTitle("Fotos")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: { showImportSheet = true }) {
                        Image(systemName: "plus")
                    }
                }
            }
            .sheet(isPresented: $showImportSheet) {
                PhotoImportView(onImport: importPhotos)
            }
            .task {
                await loadItems()
            }
        }
    }
    
    // MARK: - Grid View
    
    var gridView: some View {
        ScrollView {
            if isLoading {
                ProgressView()
                    .padding(.top, 100)
            } else if items.isEmpty {
                emptyState
            } else {
                LazyVGrid(columns: [
                    GridItem(.adaptive(minimum: 100), spacing: 2)
                ], spacing: 2) {
                    ForEach(items) { item in
                        PhotoThumbnail(item: item)
                    }
                }
                .padding(2)
            }
        }
    }
    
    var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "photo.on.rectangle.angled")
                .font(.system(size: 60))
                .foregroundColor(.gray)
            Text("Keine Fotos")
                .font(.title2)
                .fontWeight(.semibold)
            Text("Tippe auf + um Fotos zu importieren")
                .foregroundColor(.secondary)
            Button(action: { showImportSheet = true }) {
                Text("Fotos importieren")
                    .fontWeight(.semibold)
                    .padding(.horizontal, 24)
                    .padding(.vertical, 12)
                    .background(Color.blue)
                    .foregroundColor(.white)
                    .cornerRadius(10)
            }
        }
        .padding()
    }
    
    // MARK: - People View
    
    var peopleView: some View {
        ScrollView {
            LazyVGrid(columns: [
                GridItem(.adaptive(minimum: 100), spacing: 16)
            ], spacing: 16) {
                // Placeholder for face clusters
                ForEach(0..<6) { i in
                    VStack {
                        Circle()
                            .fill(Color.gray.opacity(0.3))
                            .frame(width: 80, height: 80)
                            .overlay(
                                Image(systemName: "person.fill")
                                    .font(.system(size: 30))
                                    .foregroundColor(.gray)
                            )
                        Text("Person \(i + 1)")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
            }
            .padding()
        }
    }
    
    // MARK: - Places View
    
    var placesView: some View {
        ScrollView {
            LazyVGrid(columns: [
                GridItem(.adaptive(minimum: 150), spacing: 16)
            ], spacing: 16) {
                // Placeholder for place clusters
                ForEach(0..<4) { i in
                    VStack(alignment: .leading) {
                        RoundedRectangle(cornerRadius: 12)
                            .fill(Color.gray.opacity(0.3))
                            .frame(height: 100)
                            .overlay(
                                Image(systemName: "mappin.circle.fill")
                                    .font(.system(size: 30))
                                    .foregroundColor(.gray)
                            )
                        Text("Ort \(i + 1)")
                            .font(.subheadline)
                            .fontWeight(.medium)
                        Text("23 Fotos")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
            }
            .padding()
        }
    }
    
    // MARK: - Actions
    
    func loadItems() async {
        isLoading = true
        do {
            let response = try await VaultAPI.shared.getItems(type: "photo", limit: 100)
            items = response.items
        } catch {
            print("Failed to load items: \(error)")
        }
        isLoading = false
    }
    
    func importPhotos(_ assets: [PHAsset]) {
        Task {
            isImporting = true
            uploadProgress = 0
            
            let total = Double(assets.count)
            var completed = 0.0
            
            for asset in assets {
                do {
                    // Get image data
                    let imageData = try await loadImageData(from: asset)
                    
                    // Encrypt metadata
                    let metadata = try CryptoService.shared.encrypt("{\"filename\": \"photo.jpg\"}")
                    
                    // Create item
                    let response = try await VaultAPI.shared.createItem(
                        type: "photo",
                        fileSize: imageData.count,
                        mimeType: "image/jpeg",
                        encryptedMetadata: metadata
                    )
                    
                    // Encrypt file
                    let encryptedData = try CryptoService.shared.encryptFile(imageData)
                    
                    // Upload
                    if let uploadURL = URL(string: response.upload_url) {
                        try await VaultAPI.shared.uploadFile(url: uploadURL, data: encryptedData)
                    }
                    
                    completed += 1
                    uploadProgress = completed / total
                } catch {
                    print("Failed to import photo: \(error)")
                }
            }
            
            isImporting = false
            await loadItems()
        }
    }
    
    func loadImageData(from asset: PHAsset) async throws -> Data {
        return try await withCheckedThrowingContinuation { continuation in
            let options = PHImageRequestOptions()
            options.deliveryMode = .highQualityFormat
            options.isNetworkAccessAllowed = true
            
            PHImageManager.default().requestImageDataAndOrientation(for: asset, options: options) { data, _, _, _ in
                if let data = data {
                    continuation.resume(returning: data)
                } else {
                    continuation.resume(throwing: NSError(domain: "PhotosView", code: 1, userInfo: nil))
                }
            }
        }
    }
}

struct PhotoThumbnail: View {
    let item: VaultItem
    
    var body: some View {
        Rectangle()
            .fill(Color.gray.opacity(0.3))
            .aspectRatio(1, contentMode: .fill)
            .overlay(
                Image(systemName: "photo")
                    .foregroundColor(.gray)
            )
    }
}

#Preview {
    PhotosView()
}
