import SwiftUI

struct HomeView: View {
    @State private var stats: VaultStats?
    @State private var isLoading = true
    @State private var searchText = ""
    @State private var searchResults: [SearchResult] = []
    @State private var isSearching = false
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 24) {
                    // Search Bar
                    HStack {
                        Image(systemName: "magnifyingglass")
                            .foregroundColor(.gray)
                        TextField("Suche Fotos, Personen, Orte...", text: $searchText)
                            .submitLabel(.search)
                            .onSubmit {
                                search()
                            }
                        if isSearching {
                            ProgressView()
                        }
                    }
                    .padding()
                    .background(Color(.systemGray6))
                    .cornerRadius(12)
                    .padding(.horizontal)
                    
                    // Search Results
                    if !searchResults.isEmpty {
                        VStack(alignment: .leading, spacing: 12) {
                            HStack {
                                Text("Ergebnisse")
                                    .font(.headline)
                                Spacer()
                                Button("Löschen") {
                                    searchResults = []
                                    searchText = ""
                                }
                                .font(.caption)
                            }
                            .padding(.horizontal)
                            
                            ScrollView(.horizontal, showsIndicators: false) {
                                HStack(spacing: 12) {
                                    ForEach(searchResults) { result in
                                        ResultCard(result: result)
                                    }
                                }
                                .padding(.horizontal)
                            }
                        }
                    }
                    
                    // Stats Grid
                    if let stats = stats {
                        LazyVGrid(columns: [
                            GridItem(.flexible()),
                            GridItem(.flexible())
                        ], spacing: 16) {
                            StatCard(
                                title: "Fotos",
                                value: "\(stats.photos)",
                                icon: "photo.fill",
                                color: .blue
                            )
                            StatCard(
                                title: "Dokumente",
                                value: "\(stats.documents)",
                                icon: "doc.fill",
                                color: .green
                            )
                            StatCard(
                                title: "Personen",
                                value: "\(stats.face_clusters)",
                                icon: "person.fill",
                                color: .purple
                            )
                            StatCard(
                                title: "Orte",
                                value: "\(stats.place_clusters)",
                                icon: "mappin.circle.fill",
                                color: .orange
                            )
                        }
                        .padding(.horizontal)
                    }
                    
                    // Storage Card
                    if let stats = stats {
                        VStack(alignment: .leading, spacing: 12) {
                            HStack {
                                Text("Speicher")
                                    .font(.headline)
                                Spacer()
                                Text("\(String(format: "%.1f", stats.total_gb)) GB")
                                    .foregroundColor(.secondary)
                            }
                            
                            GeometryReader { geometry in
                                ZStack(alignment: .leading) {
                                    RoundedRectangle(cornerRadius: 4)
                                        .fill(Color(.systemGray5))
                                        .frame(height: 8)
                                    
                                    RoundedRectangle(cornerRadius: 4)
                                        .fill(Color.blue)
                                        .frame(width: min(CGFloat(stats.total_gb / 10) * geometry.size.width, geometry.size.width), height: 8)
                                }
                            }
                            .frame(height: 8)
                            
                            Text("10 GB kostenlos")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                        .padding()
                        .background(Color(.systemGray6))
                        .cornerRadius(16)
                        .padding(.horizontal)
                    }
                    
                    // Processing Status
                    if let stats = stats, stats.pending > 0 {
                        HStack {
                            ProgressView()
                            VStack(alignment: .leading) {
                                Text("\(stats.pending) Elemente werden verarbeitet")
                                    .font(.subheadline)
                                Text("Albert analysiert deine Fotos")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                            Spacer()
                        }
                        .padding()
                        .background(Color.blue.opacity(0.1))
                        .cornerRadius(12)
                        .padding(.horizontal)
                    }
                    
                    // Quick Actions
                    VStack(spacing: 12) {
                        QuickAction(
                            title: "Fotos importieren",
                            subtitle: "Von deinem Gerät hochladen",
                            icon: "photo.badge.plus",
                            color: .blue
                        )
                        QuickAction(
                            title: "Albert trainieren",
                            subtitle: "Hilf Albert, Personen zu erkennen",
                            icon: "brain",
                            color: .purple
                        )
                    }
                    .padding(.horizontal)
                }
                .padding(.vertical)
            }
            .navigationTitle("Dein Vault")
            .refreshable {
                await loadStats()
            }
            .task {
                await loadStats()
            }
        }
    }
    
    func loadStats() async {
        do {
            stats = try await VaultAPI.shared.getStats()
        } catch {
            print("Failed to load stats: \(error)")
        }
        isLoading = false
    }
    
    func search() {
        guard !searchText.isEmpty else { return }
        isSearching = true
        
        Task {
            do {
                let response = try await VaultAPI.shared.search(query: searchText, limit: 20)
                searchResults = response.results
            } catch {
                print("Search failed: \(error)")
            }
            isSearching = false
        }
    }
}

struct StatCard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: icon)
                    .foregroundColor(color)
                Spacer()
            }
            Text(value)
                .font(.title)
                .fontWeight(.bold)
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(16)
    }
}

struct ResultCard: View {
    let result: SearchResult
    
    var body: some View {
        VStack {
            RoundedRectangle(cornerRadius: 8)
                .fill(Color(.systemGray5))
                .frame(width: 100, height: 100)
                .overlay(
                    Image(systemName: result.item_type == "photo" ? "photo" : "doc")
                        .foregroundColor(.gray)
                )
            Text(String(format: "%.0f%%", result.similarity * 100))
                .font(.caption)
                .foregroundColor(.secondary)
        }
    }
}

struct QuickAction: View {
    let title: String
    let subtitle: String
    let icon: String
    let color: Color
    
    var body: some View {
        HStack {
            Image(systemName: icon)
                .font(.title2)
                .foregroundColor(color)
                .frame(width: 44, height: 44)
                .background(color.opacity(0.1))
                .cornerRadius(10)
            
            VStack(alignment: .leading) {
                Text(title)
                    .fontWeight(.medium)
                Text(subtitle)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            Image(systemName: "chevron.right")
                .foregroundColor(.gray)
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}

#Preview {
    HomeView()
}
