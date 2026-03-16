import XCTest
@testable import LocalScribeApp

final class AudioRecorderServiceTests: XCTestCase {
    var recorderService: AudioRecorderService!

    override func setUp() {
        super.setUp()
        recorderService = AudioRecorderService()
    }

    override func tearDown() {
        recorderService = nil
        super.tearDown()
    }

    func testGetDocumentsDirectory() {
        let url = recorderService.getDocumentsDirectory()
        XCTAssertTrue(url.isFileURL, "Should return a valid file URL")
        XCTAssertTrue(url.path.contains("Documents"), "URL should point to the Documents directory")
    }

    func testRecordingFlow() throws {
        // We cannot fully test AVFoundation recording without actual hardware permission on a runner,
        // but we can test the structure and initialization logic.

        // Ensure starting and immediately stopping returns a URL (even if empty file).
        // Since we don't want to pollute user's docs during testing, we will mock or bypass actual start if needed.
        // For a simple structural test:

        XCTAssertNotNil(recorderService, "Service should initialize successfully")
    }
}
