use serde_json::Value;
use tauri::command;
use tauri::{AppHandle, Runtime};
use tauri_plugin_shell::ShellExt;

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
        // Try to read from .credentials file in project root
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

    if res.status().is_success() {
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
        let status = res.status();
        println!("Ollama API returned error: {}", status);
        Err(format!("Ollama API error: {}", status))
    }
}
