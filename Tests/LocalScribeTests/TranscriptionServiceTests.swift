import XCTest
@testable import LocalScribeApp

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

    func testTranscribeWithoutModelThrowsError() async {
        let dummyURL = URL(fileURLWithPath: "/tmp/fake.m4a")

        do {
            let _ = try await transcriptionService.transcribe(fileURL: dummyURL)
            XCTFail("Should throw an error because the model is not loaded yet.")
        } catch {
            XCTAssertTrue(error.localizedDescription.contains("Call loadModel() first"), "Error message should instruct to load model.")
        }
    }
}
