import json
import sys
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest
from main import TranscriptionService

# Add parent directory to path so we can import main
sys.path.append(str(Path(__file__).parent.parent))

@pytest.fixture
def mock_model():
    with patch("main.AutoModel") as MockClass:
        mock_instance = MockClass.return_value
        yield mock_instance

@pytest.fixture
def service(mock_model):
    return TranscriptionService()

def test_transcribe_success(service, mock_model):
    """Test successful transcription flow."""
    # Setup mock return
    mock_model.generate.return_value = [{"text": "Hello world"}]
    
    # We must patch Path.exists to return True
    with patch("pathlib.Path.exists", return_value=True):
        service.load_model()
        result = service.transcribe(Path("dummy.wav"))
    
    assert len(result) == 1
    assert result[0]["text"] == "Hello world"
    assert "start" in result[0]
    assert "speaker_id" in result[0]

def test_transcribe_file_not_found(service):
    """Test file not found error."""
    service.load_model()
    with pytest.raises(FileNotFoundError):
        service.transcribe(Path("nonexistent.wav"))

def test_transcribe_model_not_loaded():
    """Test calling transcribe without loading model."""
    service = TranscriptionService()
    with pytest.raises(RuntimeError):
        with patch("pathlib.Path.exists", return_value=True):
            service.transcribe(Path("dummy.wav"))
