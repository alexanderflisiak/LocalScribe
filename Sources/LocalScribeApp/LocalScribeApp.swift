import SwiftUI
import AppKit
import LocalScribeCore

@main
struct LocalScribeApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
                .frame(minWidth: 800, minHeight: 600)
                // Minimalist Notion-style background color
                .background(Color(nsColor: NSColor(calibratedRed: 0.97, green: 0.97, blue: 0.96, alpha: 1.0)))
        }
        .windowStyle(.hiddenTitleBar)
    }
}
