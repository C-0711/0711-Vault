// swift-tools-version:5.9
import PackageDescription

let package = Package(
    name: "Vault0711",
    platforms: [.iOS(.v17)],
    products: [
        .library(name: "Vault0711", targets: ["Vault0711"]),
    ],
    targets: [
        .target(name: "Vault0711", path: "Sources/Vault0711"),
    ]
)
