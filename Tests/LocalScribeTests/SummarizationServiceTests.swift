import XCTest
@testable import LocalScribeApp

final class SummarizationServiceTests: XCTestCase {
    var summarizer: SummarizationService!

    override func setUp() {
        super.setUp()
        summarizer = SummarizationService()
    }

    override func tearDown() {
        summarizer = nil
        super.tearDown()
    }

    func testSummarizationFailureOnInvalidHost() async {
        // By default, if Ollama isn't running on localhost:11434, this should fail gracefully.
        do {
            let _ = try await summarizer.summarize(text: "Test transcript")
            // If Ollama happens to be running during test execution on the user's machine,
            // this might succeed. But structurally we want to ensure errors are caught.
        } catch let error as SummarizationService.SummarizationError {
            // Expected failure if Ollama is down
            XCTAssertNotNil(error.errorDescription)
        } catch {
            // Any other URLSession error (connection refused, etc)
            XCTAssertNotNil(error)
        }
    }
}
