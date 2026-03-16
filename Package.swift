// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "LocalScribe",
    platforms: [
        .macOS(.v14),
        .iOS(.v17)
    ],
    products: [
        .executable(
            name: "LocalScribeApp",
            targets: ["LocalScribeApp"]
        ),
        .library(
            name: "LocalScribeCore",
            targets: ["LocalScribeCore"]
        )
    ],
    dependencies: [
        // Using WhisperKit for highly optimized native CoreML transcription on Apple Silicon
        .package(url: "https://github.com/argmaxinc/WhisperKit", exact: "0.8.0")
    ],
    targets: [
        .target(
            name: "LocalScribeCore",
            dependencies: [
                .product(name: "WhisperKit", package: "WhisperKit")
            ],
            path: "Sources/LocalScribeCore"
        ),
        .executableTarget(
            name: "LocalScribeApp",
            dependencies: [
                "LocalScribeCore"
            ],
            path: "Sources/LocalScribeApp"
        ),
        .testTarget(
            name: "LocalScribeTests",
            dependencies: ["LocalScribeCore"],
            path: "Tests/LocalScribeTests"
        ),
    ]
)
