import XCTest
import Combine
@testable import LocalScribeCore

@MainActor
final class AppViewModelTests: XCTestCase {
    var viewModel: AppViewModel!

    override func setUp() {
        super.setUp()
        viewModel = AppViewModel()
    }

    override func tearDown() {
        viewModel = nil
        super.tearDown()
    }

    func testInitialState() {
        XCTAssertFalse(viewModel.isRecording)
        XCTAssertFalse(viewModel.isProcessing)
        XCTAssertFalse(viewModel.isSummarizing)
        XCTAssertEqual(viewModel.recordingDuration, 0)
        XCTAssertEqual(viewModel.statusText, "READY")
        XCTAssertEqual(viewModel.formattedDuration, "00:00")
        XCTAssertTrue(viewModel.transcript.isEmpty)
        XCTAssertTrue(viewModel.summary.isEmpty)
        XCTAssertNil(viewModel.errorMessage)
    }

    func testStartRecordingUpdatesState() {
        viewModel.startRecording()

        XCTAssertTrue(viewModel.isRecording)
        XCTAssertEqual(viewModel.statusText, "RECORDING")
        XCTAssertNil(viewModel.errorMessage)

        // Cleanup state
        viewModel.stopRecording()
    }
}
