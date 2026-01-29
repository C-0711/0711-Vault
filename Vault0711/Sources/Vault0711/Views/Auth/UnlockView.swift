import SwiftUI
import LocalAuthentication

struct UnlockView: View {
    @EnvironmentObject var appState: AppState
    @State private var password = ""
    @State private var isLoading = false
    @State private var error: String?
    @State private var showBiometricPrompt = true
    
    private let context = LAContext()
    
    var body: some View {
        VStack(spacing: 32) {
            Spacer()
            
            // Logo
            VStack(spacing: 16) {
                Text("0711")
                    .font(.system(size: 60, weight: .bold))
                    .foregroundColor(.white)
                
                Text("Vault")
                    .font(.title2)
                    .foregroundColor(.gray)
            }
            
            // Lock icon
            Image(systemName: "lock.fill")
                .font(.system(size: 50))
                .foregroundColor(.gray)
                .padding(.vertical, 32)
            
            // Biometric button
            if canUseBiometrics {
                Button(action: authenticateWithBiometrics) {
                    HStack {
                        Image(systemName: biometricType == .faceID ? "faceid" : "touchid")
                        Text(biometricType == .faceID ? "Mit Face ID entsperren" : "Mit Touch ID entsperren")
                    }
                    .font(.headline)
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.blue)
                    .cornerRadius(12)
                }
                .padding(.horizontal, 32)
            }
            
            // Password fallback
            VStack(spacing: 16) {
                SecureField("Passwort", text: $password)
                    .textFieldStyle(RoundedTextFieldStyle())
                    .padding(.horizontal, 32)
                
                if let error = error {
                    Text(error)
                        .foregroundColor(.red)
                        .font(.caption)
                }
                
                Button(action: authenticateWithPassword) {
                    if isLoading {
                        ProgressView()
                            .tint(.white)
                    } else {
                        Text("Entsperren")
                            .fontWeight(.semibold)
                    }
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.white.opacity(0.1))
                .foregroundColor(.white)
                .cornerRadius(12)
                .padding(.horizontal, 32)
                .disabled(password.isEmpty || isLoading)
            }
            
            Spacer()
            
            // Sign out
            Button("Abmelden") {
                signOut()
            }
            .foregroundColor(.gray)
            .padding(.bottom, 32)
        }
        .background(Color.black.ignoresSafeArea())
        .onAppear {
            if showBiometricPrompt && canUseBiometrics {
                authenticateWithBiometrics()
            }
        }
    }
    
    var canUseBiometrics: Bool {
        context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: nil)
    }
    
    var biometricType: LABiometryType {
        context.biometryType
    }
    
    func authenticateWithBiometrics() {
        context.evaluatePolicy(
            .deviceOwnerAuthenticationWithBiometrics,
            localizedReason: "Entsperre deinen Vault"
        ) { success, authError in
            DispatchQueue.main.async {
                if success {
                    // Load master key from Keychain
                    if let masterKey = KeychainHelper.get(key: "vault_master_key") {
                        CryptoService.shared.setMasterKey(masterKey)
                        appState.isAuthenticated = true
                    } else {
                        error = "Bitte melde dich erneut an"
                    }
                } else {
                    showBiometricPrompt = false
                }
            }
        }
    }
    
    func authenticateWithPassword() {
        isLoading = true
        error = nil
        
        Task {
            do {
                // Get saved email
                guard let email = KeychainHelper.get(key: "vault_email") else {
                    throw AuthError.noEmail
                }
                
                // Get salt
                let salt = try await VaultAPI.shared.getSalt(email: email)
                
                // Derive keys
                let (authHash, encryptionKey) = CryptoService.shared.deriveKeys(password: password, salt: salt)
                
                // Login
                let response = try await VaultAPI.shared.login(email: email, authHash: authHash)
                
                // Decrypt and store master key
                let masterKey = try CryptoService.shared.decryptMasterKey(response.encrypted_master_key, with: encryptionKey)
                CryptoService.shared.setMasterKey(masterKey)
                
                // Save master key to Keychain for biometric access
                KeychainHelper.save(key: "vault_master_key", value: masterKey)
                
                DispatchQueue.main.async {
                    appState.isAuthenticated = true
                }
            } catch {
                DispatchQueue.main.async {
                    self.error = "Falsches Passwort"
                    self.isLoading = false
                }
            }
        }
    }
    
    func signOut() {
        VaultAPI.shared.logout()
        CryptoService.shared.clearMasterKey()
        KeychainHelper.delete(key: "vault_master_key")
        KeychainHelper.delete(key: "vault_email")
        appState.isOnboarding = true
    }
}

enum AuthError: Error {
    case noEmail
    case invalidPassword
}

struct RoundedTextFieldStyle: TextFieldStyle {
    func _body(configuration: TextField<Self._Label>) -> some View {
        configuration
            .padding()
            .background(Color.white.opacity(0.1))
            .cornerRadius(12)
            .foregroundColor(.white)
    }
}

#Preview {
    UnlockView()
        .environmentObject(AppState())
}
