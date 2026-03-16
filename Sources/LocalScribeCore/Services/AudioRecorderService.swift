import Foundation
import AVFoundation

public class AudioRecorderService {
    private var audioRecorder: AVAudioRecorder?

    public init() {
        // macOS permissions are handled via Info.plist and system prompts,
        // unlike iOS which uses AVAudioSession.
    }

    public func getDocumentsDirectory() -> URL {
        let paths = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)
        return paths[0]
    }

    public func startRecording() throws {
        let audioFilename = getDocumentsDirectory().appendingPathComponent("recording.m4a")

        let settings: [String: Any] = [
            AVFormatIDKey: Int(kAudioFormatMPEG4AAC),
            AVSampleRateKey: 16000,
            AVNumberOfChannelsKey: 1,
            AVEncoderAudioQualityKey: AVAudioQuality.high.rawValue
        ]

        audioRecorder = try AVAudioRecorder(url: audioFilename, settings: settings)
        audioRecorder?.record()
    }

    public func stopRecording() -> URL? {
        let url = audioRecorder?.url
        audioRecorder?.stop()
        audioRecorder = nil
        return url
    }
}
