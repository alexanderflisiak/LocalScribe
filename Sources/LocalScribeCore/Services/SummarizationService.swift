import Foundation

// For v1, we connect natively to the local Ollama instance (which is highly optimized C++ under the hood).
// This provides the fastest route to efficient summarization while keeping the shell fully native.
// Future iteration could use MLX-Swift for fully embedded LLM inference.
public class SummarizationService {

    public init() {}

    public enum SummarizationError: Error, LocalizedError {
        case invalidURL
        case invalidResponse
        case serverError(Int)
        case decodingError

        public var errorDescription: String? {
            switch self {
            case .invalidURL: return "Invalid server URL."
            case .invalidResponse: return "Invalid response from local AI."
            case .serverError(let code): return "Server returned error code: \(code). Is Ollama running?"
            case .decodingError: return "Failed to decode summary response."
            }
        }
    }

    struct OllamaRequest: Codable {
        let model: String
        let prompt: String
        let stream: Bool
    }

    struct OllamaResponse: Codable {
        let response: String
    }

    public func summarize(text: String) async throws -> String {
        let prompt = "Summarize the following meeting transcript concisely:\n\n\(text)"

        guard let url = URL(string: "http://localhost:11434/api/generate") else {
            throw SummarizationError.invalidURL
        }

        let requestBody = OllamaRequest(model: "qwen2.5-coder:7b", prompt: prompt, stream: false)

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder().encode(requestBody)

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw SummarizationError.invalidResponse
        }

        guard httpResponse.statusCode == 200 else {
            throw SummarizationError.serverError(httpResponse.statusCode)
        }

        do {
            let decoded = try JSONDecoder().decode(OllamaResponse.self, from: data)
            return decoded.response.trimmingCharacters(in: .whitespacesAndNewlines)
        } catch {
            throw SummarizationError.decodingError
        }
    }
}
