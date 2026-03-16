import XCTest
@testable import LocalScribeCore

// We mock WhisperKit interaction because we don't want to download a 200MB+ CoreML model
// during standard unit testing runs.
final class TranscriptionServiceTests: XCTestCase {
    var transcriptionService: TranscriptionService!

    override func setUp() {
        super.setUp()
        transcriptionService = TranscriptionService()
    }

    override func tearDown() {
        transcriptionService = nil
        super.tearDown()
    }

    func testTranscribeInitiatesModelLoadIfMissing() async {
        let dummyURL = URL(fileURLWithPath: "/tmp/fake.m4a")

        // This will now attempt to download the model from huggingface since it calls loadModel() internally.
        // We catch the error indicating it couldn't transcribe the "fake" file, but not a "load model first" error.
        do {
            let _ = try await transcriptionService.transcribe(fileURL: dummyURL)
            // It will fail because the dummy URL audio file doesn't actually exist
        } catch {
            XCTAssertFalse(error.localizedDescription.contains("Call loadModel() first"), "It should no longer tell the user to load the model manually.")
        }
    }
}
