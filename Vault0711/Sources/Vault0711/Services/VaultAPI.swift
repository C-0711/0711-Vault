import Foundation

/// API client for 0711 Vault backend
class VaultAPI {
    static let shared = VaultAPI()
    
    #if DEBUG
    private var baseURL = "http://localhost:8000"
    #else
    private var baseURL = "https://api-vault.0711.io"
    #endif
    private var token: String?
    
    private init() {
        // Load token from Keychain
        token = KeychainHelper.get(key: "vault_token")
    }
    
    // MARK: - Auth
    
    func getSalt(email: String) async throws -> String {
        let data = try await request(endpoint: "/auth/salt/\(email.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? email)", method: "GET")
        let response = try JSONDecoder().decode(SaltResponse.self, from: data)
        return response.salt
    }
    
    func register(email: String, authHash: String, salt: String, encryptedMasterKey: String) async throws {
        let body = RegisterRequest(email: email, auth_hash: authHash, salt: salt, encrypted_master_key: encryptedMasterKey)
        _ = try await request(endpoint: "/auth/register", method: "POST", body: body)
    }
    
    func login(email: String, authHash: String) async throws -> LoginResponse {
        let body = LoginRequest(email: email, auth_hash: authHash)
        let data = try await request(endpoint: "/auth/login", method: "POST", body: body)
        let response = try JSONDecoder().decode(LoginResponse.self, from: data)
        
        // Save token
        self.token = response.access_token
        KeychainHelper.save(key: "vault_token", value: response.access_token)
        
        return response
    }
    
    func logout() {
        token = nil
        KeychainHelper.delete(key: "vault_token")
    }
    
    // MARK: - Vault Items
    
    func getItems(type: String? = nil, limit: Int = 100) async throws -> ItemsResponse {
        var endpoint = "/vault/items?limit=\(limit)"
        if let type = type {
            endpoint += "&item_type=\(type)"
        }
        let data = try await request(endpoint: endpoint, method: "GET")
        return try JSONDecoder().decode(ItemsResponse.self, from: data)
    }
    
    func createItem(type: String, fileSize: Int, mimeType: String, encryptedMetadata: String?) async throws -> CreateItemResponse {
        let body = CreateItemRequest(item_type: type, file_size: fileSize, mime_type: mimeType, encrypted_metadata: encryptedMetadata)
        let data = try await request(endpoint: "/vault/items", method: "POST", body: body)
        return try JSONDecoder().decode(CreateItemResponse.self, from: data)
    }
    
    func uploadFile(url: URL, data: Data) async throws {
        var request = URLRequest(url: url)
        request.httpMethod = "PUT"
        request.httpBody = data
        
        let (_, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse, (200...299).contains(httpResponse.statusCode) else {
            throw APIError.uploadFailed
        }
    }
    
    // MARK: - Stats
    
    func getStats() async throws -> VaultStats {
        let data = try await request(endpoint: "/vault/stats", method: "GET")
        return try JSONDecoder().decode(VaultStats.self, from: data)
    }
    
    // MARK: - Faces
    
    func getFaceClusters() async throws -> FaceClustersResponse {
        let data = try await request(endpoint: "/faces/clusters", method: "GET")
        return try JSONDecoder().decode(FaceClustersResponse.self, from: data)
    }
    
    func getUnlabeledFaces(limit: Int = 50) async throws -> UnlabeledFacesResponse {
        let data = try await request(endpoint: "/faces/unlabeled?limit=\(limit)", method: "GET")
        return try JSONDecoder().decode(UnlabeledFacesResponse.self, from: data)
    }
    
    func trainFaces(faceIds: [String], clusterId: String?, encryptedName: String?, relationship: String?) async throws {
        let body = TrainFacesRequest(face_ids: faceIds, cluster_id: clusterId, encrypted_name: encryptedName, relationship: relationship)
        _ = try await request(endpoint: "/faces/train", method: "POST", body: body)
    }
    
    // MARK: - Search
    
    func search(query: String, limit: Int = 20) async throws -> SearchResponse {
        let body = SearchRequest(query: query, limit: limit)
        let data = try await request(endpoint: "/search/semantic", method: "POST", body: body)
        return try JSONDecoder().decode(SearchResponse.self, from: data)
    }
    
    // MARK: - Private
    
    private func request<T: Encodable>(endpoint: String, method: String, body: T? = nil as String?) async throws -> Data {
        guard let url = URL(string: baseURL + endpoint) else {
            throw APIError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        if let token = token {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        if let body = body {
            request.httpBody = try JSONEncoder().encode(body)
        }
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }
        
        if httpResponse.statusCode == 401 {
            logout()
            throw APIError.unauthorized
        }
        
        guard (200...299).contains(httpResponse.statusCode) else {
            throw APIError.serverError(httpResponse.statusCode)
        }
        
        return data
    }
}

// MARK: - Models

struct SaltResponse: Codable {
    let salt: String
}

struct RegisterRequest: Codable {
    let email: String
    let auth_hash: String
    let salt: String
    let encrypted_master_key: String
}

struct LoginRequest: Codable {
    let email: String
    let auth_hash: String
}

struct LoginResponse: Codable {
    let access_token: String
    let token_type: String
    let user_id: String
    let encrypted_master_key: String
}

struct CreateItemRequest: Codable {
    let item_type: String
    let file_size: Int
    let mime_type: String
    let encrypted_metadata: String?
}

struct CreateItemResponse: Codable {
    let item_id: String
    let storage_key: String
    let upload_url: String
}

struct ItemsResponse: Codable {
    let items: [VaultItem]
    let count: Int
}

struct VaultItem: Codable, Identifiable {
    let id: String
    let item_type: String
    let encrypted_metadata: String?
    let file_size: Int
    let mime_type: String?
    let processing_status: String
}

struct VaultStats: Codable {
    let photos: Int
    let documents: Int
    let videos: Int
    let total_bytes: Int
    let total_gb: Double
    let processed: Int
    let pending: Int
    let face_clusters: Int
    let place_clusters: Int
}

struct FaceClustersResponse: Codable {
    let clusters: [FaceCluster]
}

struct FaceCluster: Codable, Identifiable {
    let id: String
    let encrypted_name: String?
    let relationship: String?
    let photo_count: Int
}

struct UnlabeledFacesResponse: Codable {
    let faces: [UnlabeledFace]
}

struct UnlabeledFace: Codable, Identifiable {
    let id: String
    let item_id: String
    let bbox_x: Double
    let bbox_y: Double
    let bbox_width: Double
    let bbox_height: Double
    let storage_key: String
}

struct TrainFacesRequest: Codable {
    let face_ids: [String]
    let cluster_id: String?
    let encrypted_name: String?
    let relationship: String?
}

struct SearchRequest: Codable {
    let query: String
    let limit: Int
}

struct SearchResponse: Codable {
    let query: String
    let results: [SearchResult]
}

struct SearchResult: Codable, Identifiable {
    let id: String
    let item_type: String
    let storage_key: String
    let similarity: Double
}

enum APIError: Error {
    case invalidURL
    case invalidResponse
    case unauthorized
    case uploadFailed
    case serverError(Int)
}

// MARK: - Keychain Helper

class KeychainHelper {
    static func save(key: String, value: String) {
        let data = value.data(using: .utf8)!
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecValueData as String: data
        ]
        SecItemDelete(query as CFDictionary)
        SecItemAdd(query as CFDictionary, nil)
    }
    
    static func get(key: String) -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecReturnData as String: true
        ]
        var result: AnyObject?
        SecItemCopyMatching(query as CFDictionary, &result)
        guard let data = result as? Data else { return nil }
        return String(data: data, encoding: .utf8)
    }
    
    static func delete(key: String) {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key
        ]
        SecItemDelete(query as CFDictionary)
    }
}
