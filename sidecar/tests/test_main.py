import sys
from pathlib import Path
from unittest.mock import MagicMock, patch
import pytest

# Add parent directory to path so we can import main
sys.path.append(str(Path(__file__).parent.parent))

from main import TranscriptionService

@pytest.fixture
def mock_asr():
    with patch("main.AutoModel") as MockClass:
        mock_instance = MockClass.return_value
        # Mock generate return value
        mock_instance.generate.return_value = [{"text": "Hello world"}]
        yield mock_instance

@pytest.fixture
def mock_pipeline():
    with patch("main.Pipeline") as MockClass:
        mock_instance = MockClass.from_pretrained.return_value
        # Mock diarization output
        # Diarization returns an object with .itertracks()
        mock_annotation = MagicMock()
        # Yield (turn, _, speaker)
        turn = MagicMock()
        turn.start = 0.0
        turn.end = 1.0
        mock_annotation.itertracks.return_value = [(turn, None, "SPEAKER_01")]
        
        mock_instance.return_value = mock_annotation
        yield mock_instance

@pytest.fixture
def service(mock_asr, mock_pipeline):
    return TranscriptionService()

def test_load_models_success(service, mock_asr, mock_pipeline):
    """Test loading models."""
    with patch("os.environ.get", return_value="hf_token"):
        service.load_models()
    
    assert service.asr_model is not None
    assert service.diarization_pipeline is not None

def test_process_success(service, mock_asr, mock_pipeline):
    """Test successful processing behavior."""
    with patch("os.environ.get", return_value="hf_token"):
        service.load_models()

    with patch("pathlib.Path.exists", return_value=True):
        result = service.process(Path("dummy.wav"))

    assert len(result) == 1
    assert result[0]["text"] == "Hello world"
    assert result[0]["speaker_id"] == "SPEAKER_01"  # Dominant speaker logic
    
def test_process_file_not_found(service):
    """Test file not found error."""
    service.load_models() # Mock objects are used
    with pytest.raises(FileNotFoundError):
        service.process(Path("nonexistent.wav"))

def test_process_models_not_loaded():
    """Test calling process without loading models."""
    service = TranscriptionService()
    # Ensure models are None
    service.asr_model = None
    
    with pytest.raises(RuntimeError):
        with patch("pathlib.Path.exists", return_value=True):
            service.process(Path("dummy.wav"))
