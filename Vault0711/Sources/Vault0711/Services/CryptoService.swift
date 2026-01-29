import Foundation
import CryptoKit
import CommonCrypto

/// Zero-knowledge encryption service
/// Keys never leave the device
class CryptoService {
    static let shared = CryptoService()
    
    private var masterKey: SymmetricKey?
    
    private init() {}
    
    // MARK: - Key Derivation
    
    /// Generate a random salt
    func generateSalt() -> String {
        var bytes = [UInt8](repeating: 0, count: 32)
        _ = SecRandomCopyBytes(kSecRandomDefault, bytes.count, &bytes)
        return bytes.map { String(format: "%02x", $0) }.joined()
    }
    
    /// Derive auth hash and encryption key from password using PBKDF2
    func deriveKeys(password: String, salt: String) -> (authHash: String, encryptionKey: String) {
        let passwordData = password.data(using: .utf8)!
        let saltData = Data(hexString: salt)!
        
        // Derive 64 bytes (32 for auth, 32 for encryption)
        var derivedKey = [UInt8](repeating: 0, count: 64)
        
        passwordData.withUnsafeBytes { passwordBytes in
            saltData.withUnsafeBytes { saltBytes in
                CCKeyDerivationPBKDF(
                    CCPBKDFAlgorithm(kCCPBKDF2),
                    passwordBytes.baseAddress?.assumingMemoryBound(to: Int8.self),
                    passwordData.count,
                    saltBytes.baseAddress?.assumingMemoryBound(to: UInt8.self),
                    saltData.count,
                    CCPseudoRandomAlgorithm(kCCPRFHmacAlgSHA512),
                    100_000,
                    &derivedKey,
                    64
                )
            }
        }
        
        let authKey = Array(derivedKey[0..<32])
        let encKey = Array(derivedKey[32..<64])
        
        return (
            authHash: authKey.map { String(format: "%02x", $0) }.joined(),
            encryptionKey: encKey.map { String(format: "%02x", $0) }.joined()
        )
    }
    
    /// Generate a random master key
    func generateMasterKey() -> String {
        let key = SymmetricKey(size: .bits256)
        return key.withUnsafeBytes { bytes in
            bytes.map { String(format: "%02x", $0) }.joined()
        }
    }
    
    // MARK: - Master Key Encryption
    
    /// Encrypt master key with user's encryption key
    func encryptMasterKey(_ masterKey: String, with encryptionKey: String) throws -> String {
        let keyData = Data(hexString: encryptionKey)!
        let masterKeyData = Data(hexString: masterKey)!
        let key = SymmetricKey(data: keyData)
        
        let sealedBox = try AES.GCM.seal(masterKeyData, using: key)
        return sealedBox.combined!.base64EncodedString()
    }
    
    /// Decrypt master key with user's encryption key
    func decryptMasterKey(_ encryptedMasterKey: String, with encryptionKey: String) throws -> String {
        let keyData = Data(hexString: encryptionKey)!
        let encryptedData = Data(base64Encoded: encryptedMasterKey)!
        let key = SymmetricKey(data: keyData)
        
        let sealedBox = try AES.GCM.SealedBox(combined: encryptedData)
        let decrypted = try AES.GCM.open(sealedBox, using: key)
        
        return decrypted.map { String(format: "%02x", $0) }.joined()
    }
    
    // MARK: - Data Encryption
    
    /// Store master key in memory for the session
    func setMasterKey(_ key: String) {
        let keyData = Data(hexString: key)!
        self.masterKey = SymmetricKey(data: keyData)
    }
    
    /// Clear master key from memory
    func clearMasterKey() {
        self.masterKey = nil
    }
    
    /// Check if master key is set
    var hasMasterKey: Bool {
        masterKey != nil
    }
    
    /// Encrypt string with master key
    func encrypt(_ string: String) throws -> String {
        guard let masterKey = masterKey else {
            throw CryptoError.noMasterKey
        }
        
        let data = string.data(using: .utf8)!
        let sealedBox = try AES.GCM.seal(data, using: masterKey)
        return sealedBox.combined!.base64EncodedString()
    }
    
    /// Decrypt string with master key
    func decrypt(_ encrypted: String) throws -> String {
        guard let masterKey = masterKey else {
            throw CryptoError.noMasterKey
        }
        
        let data = Data(base64Encoded: encrypted)!
        let sealedBox = try AES.GCM.SealedBox(combined: data)
        let decrypted = try AES.GCM.open(sealedBox, using: masterKey)
        
        return String(data: decrypted, encoding: .utf8)!
    }
    
    /// Encrypt file data with master key
    func encryptFile(_ data: Data) throws -> Data {
        guard let masterKey = masterKey else {
            throw CryptoError.noMasterKey
        }
        
        let sealedBox = try AES.GCM.seal(data, using: masterKey)
        return sealedBox.combined!
    }
    
    /// Decrypt file data with master key
    func decryptFile(_ encryptedData: Data) throws -> Data {
        guard let masterKey = masterKey else {
            throw CryptoError.noMasterKey
        }
        
        let sealedBox = try AES.GCM.SealedBox(combined: encryptedData)
        return try AES.GCM.open(sealedBox, using: masterKey)
    }
}

enum CryptoError: Error {
    case noMasterKey
    case encryptionFailed
    case decryptionFailed
}

extension Data {
    init?(hexString: String) {
        let len = hexString.count / 2
        var data = Data(capacity: len)
        var i = hexString.startIndex
        for _ in 0..<len {
            let j = hexString.index(i, offsetBy: 2)
            let bytes = hexString[i..<j]
            if var num = UInt8(bytes, radix: 16) {
                data.append(&num, count: 1)
            } else {
                return nil
            }
            i = j
        }
        self = data
    }
}
