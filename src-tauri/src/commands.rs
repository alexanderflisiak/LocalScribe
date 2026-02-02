use serde_json::Value;
use tauri::command;
use tauri::{AppHandle, Runtime};
use tauri_plugin_shell::ShellExt;

/// Transcribes an audio file using the Python Sidecar.
///
/// Spawns the `api-sidecar` binary as a child process.
/// It automatically injects the `HF_TOKEN` environment variable if found
/// in the system environment or a local `.credentials` file.
///
/// # Arguments
/// * `app` - The Tauri App Handle (used to spawn sidecar).
/// * `file_path` - Absolute path to the .webm audio file.
///
/// # Returns
/// * `Ok(Value)` - JSON object containing transcribed segments.
/// * `Err(String)` - Error message if sidecar fails or file is missing.
#[command]
pub async fn transcribe_audio<R: Runtime>(
    app: AppHandle<R>,
    file_path: String,
) -> Result<Value, String> {
    println!("Invoking transcription for: {}", file_path);

    let mut sidecar_command = app
        .shell()
        .sidecar("api-sidecar")
        .map_err(|e| e.to_string())?;

    if let Ok(token) = std::env::var("HF_TOKEN") {
        sidecar_command = sidecar_command.env("HF_TOKEN", token);
    } else {
        // Fallback: Check for a local `.credentials` file (useful for dev/portable setups).
        // This allows users to provide tokens without polluting global env vars.
        let paths = vec!["../.credentials", ".credentials"];
        for path in paths {
            if let Ok(content) = std::fs::read_to_string(path) {
                for line in content.lines() {
                    if line.starts_with("HF_TOKEN=") {
                        let token = line.trim_start_matches("HF_TOKEN=").trim_matches('"');
                        if !token.is_empty() {
                            println!("Loaded HF_TOKEN from {}", path);
                            sidecar_command = sidecar_command.env("HF_TOKEN", token);
                            break;
                        }
                    }
                }
            }
        }
    }

    let output = sidecar_command
        .args(&[&file_path])
        .output()
        .await
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout);
        // Parse the JSON output from the sidecar
        let result: Value = serde_json::from_str(&stdout).map_err(|e| {
            format!(
                "Failed to parse sidecar output: {}. Output was: {}",
                e, stdout
            )
        })?;
        Ok(result)
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        Err(format!("Sidecar failed: {}", stderr))
    }
}

/// Generates a concise summary of the provided text using a local Ollama instance.
///
/// Connects to `http://localhost:11434/api/generate` and uses the
/// `qwen2.5-coder:7b` model to process the transcript.
///
/// # Arguments
/// * `text` - The full transcript text to summarize.
///
/// # Returns
/// * `Ok(String)` - The generated summary text.
/// * `Err(String)` - Network error or Ollama API failure message.
#[command]
pub async fn summarize_text(text: String) -> Result<String, String> {
    println!("Summarizing text (length: {})", text.len());
    let client = reqwest::Client::new();
    let res = client
        .post("http://localhost:11434/api/generate")
        .json(&serde_json::json!({
            "model": "qwen2.5-coder:7b",
            "prompt": format!("Summarize the following text concisely:\n\n{}", text),
            "stream": false
        }))
        .send()
        .await
        .map_err(|e| {
            println!("Ollama request failed: {}", e);
            e.to_string()
        })?;

    let status = res.status();
    if status.is_success() {
        let body: Value = res.json().await.map_err(|e| e.to_string())?;
        match body["response"].as_str() {
            Some(response) => {
                println!("Summarization successful");
                Ok(response.to_string())
            }
            None => {
                println!("Ollama response missing 'response' field");
                Err("Ollama response missing 'response' field".to_string())
            }
        }
    } else {
        println!("Ollama API returned error: {}", status);
        Err(format!("Ollama API error: {}", status))
    }
}

/// Saves the audio payload to the AppData/recordings directory.
///
/// # Arguments
/// * `app` - AppHandle to access paths.
/// * `payload` - The raw bytes of the audio file.
/// * `filename` - The desired filename (e.g., "recording-123.webm").
///
/// # Returns
/// * `Ok(String)` - Absolute path to the saved file.
/// * `Err(String)` - Error message.
#[command]
pub async fn save_audio<R: Runtime>(
    app: AppHandle<R>,
    payload: Vec<u8>,
    filename: String,
) -> Result<String, String> {
    use std::io::Write;
    use tauri::Manager;

    println!("Saving audio file: {} ({} bytes)", filename, payload.len());

    let app_data_dir = app.path().app_data_dir().map_err(|e| {
        let msg = format!("Failed to resolve AppData dir: {}", e);
        println!("{}", msg);
        msg
    })?;

    let recordings_dir = app_data_dir.join("recordings");
    if !recordings_dir.exists() {
        std::fs::create_dir_all(&recordings_dir).map_err(|e| {
            let msg = format!("Failed to create recordings dir: {}", e);
            println!("{}", msg);
            msg
        })?;
    }

    let file_path = recordings_dir.join(&filename);
    let mut file = std::fs::File::create(&file_path).map_err(|e| {
        let msg = format!("Failed to create file: {}", e);
        println!("{}", msg);
        msg
    })?;

    file.write_all(&payload).map_err(|e| {
        let msg = format!("Failed to write file content: {}", e);
        println!("{}", msg);
        msg
    })?;

    let absolute_path = file_path.to_string_lossy().to_string();
    println!("File saved successfully to: {}", absolute_path);
    Ok(absolute_path)
}
