import SwiftUI

struct DocumentsView: View {
    @State private var searchText = ""
    @State private var selectedCategory = "Alle"
    
    let categories = ["Alle", "Verträge", "Rechnungen", "Steuer", "Gesundheit"]
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    // Search Bar
                    HStack {
                        Image(systemName: "magnifyingglass")
                            .foregroundColor(.gray)
                        TextField("Suche in Dokumenten...", text: $searchText)
                            .foregroundColor(.white)
                    }
                    .padding(12)
                    .background(Color.white.opacity(0.05))
                    .cornerRadius(12)
                    
                    // Category Pills
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 8) {
                            ForEach(categories, id: \.self) { category in
                                CategoryPill(
                                    title: category,
                                    isSelected: selectedCategory == category
                                ) {
                                    selectedCategory = category
                                }
                            }
                        }
                    }
                    
                    // Recent Documents
                    VStack(alignment: .leading, spacing: 12) {
                        Text("KÜRZLICH")
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundColor(.gray)
                            .tracking(1)
                        
                        VStack(spacing: 8) {
                            DocumentRow(
                                name: "Mietvertrag_Hauptstr_42.pdf",
                                type: .contract,
                                meta: "Vertrag · Läuft bis 31.12.2026",
                                date: "Heute"
                            )
                            DocumentRow(
                                name: "Rechnung_Telekom_Jan2026.pdf",
                                type: .invoice,
                                meta: "Rechnung · €47,99",
                                date: "Gestern"
                            )
                            DocumentRow(
                                name: "Steuerbescheid_2025.pdf",
                                type: .tax,
                                meta: "Steuer · Erstattung €1.234",
                                date: "15.01."
                            )
                        }
                    }
                    
                    // This Week
                    VStack(alignment: .leading, spacing: 12) {
                        Text("DIESE WOCHE")
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundColor(.gray)
                            .tracking(1)
                        
                        VStack(spacing: 8) {
                            DocumentRow(
                                name: "Arbeitsvertrag_2024.pdf",
                                type: .contract,
                                meta: "Vertrag · Unbefristet",
                                date: "10.01."
                            )
                            DocumentRow(
                                name: "KFZ_Versicherung_2026.pdf",
                                type: .invoice,
                                meta: "Versicherung · €89/Monat",
                                date: "05.01."
                            )
                        }
                    }
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 100)
            }
            .background(Color.black)
            .navigationTitle("Dokumente")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button(action: {}) {
                        Image(systemName: "folder")
                            .font(.system(size: 18))
                            .foregroundColor(.white)
                    }
                }
            }
            .overlay(alignment: .bottomTrailing) {
                // Scan FAB
                Button(action: {}) {
                    Image(systemName: "camera.fill")
                        .font(.system(size: 24))
                        .foregroundColor(.black)
                        .frame(width: 56, height: 56)
                        .background(Color.green)
                        .cornerRadius(16)
                        .shadow(color: .green.opacity(0.3), radius: 10, y: 4)
                }
                .padding(.trailing, 20)
                .padding(.bottom, 20)
            }
        }
    }
}

struct CategoryPill: View {
    let title: String
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.system(size: 14))
                .foregroundColor(isSelected ? .black : .gray)
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
                .background(isSelected ? Color.green : Color.white.opacity(0.05))
                .cornerRadius(20)
        }
    }
}

enum DocumentType {
    case contract, invoice, tax, health
    
    var color: Color {
        switch self {
        case .contract: return .purple
        case .invoice: return .green
        case .tax: return .red
        case .health: return .blue
        }
    }
}

struct DocumentRow: View {
    let name: String
    let type: DocumentType
    let meta: String
    let date: String
    
    var body: some View {
        HStack(spacing: 14) {
            // Icon
            Text("PDF")
                .font(.system(size: 11, weight: .bold))
                .foregroundColor(type.color)
                .frame(width: 44, height: 44)
                .background(type.color.opacity(0.15))
                .cornerRadius(10)
            
            // Info
            VStack(alignment: .leading, spacing: 2) {
                Text(name)
                    .font(.system(size: 15, weight: .medium))
                    .foregroundColor(.white)
                    .lineLimit(1)
                
                Text(meta)
                    .font(.system(size: 13))
                    .foregroundColor(.gray)
            }
            
            Spacer()
            
            Text(date)
                .font(.system(size: 12))
                .foregroundColor(.gray.opacity(0.6))
        }
        .padding(14)
        .background(Color.white.opacity(0.05))
        .cornerRadius(14)
    }
}

#Preview {
    DocumentsView()
        .preferredColorScheme(.dark)
}
