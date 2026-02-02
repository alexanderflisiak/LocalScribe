
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAudioRecorder } from './recorder';
import { invoke } from '@tauri-apps/api/core';

// Mock Tauri invoke
vi.mock('@tauri-apps/api/core', () => ({
    invoke: vi.fn(),
}));

// Mock MediaRecorder
class MockMediaRecorder {
    state: 'inactive' | 'recording' | 'paused' = 'inactive';
    stream: MediaStream;
    ondataavailable: ((event: any) => void) | null = null;
    onstop: (() => void) | null = null;
    mimeType: string = 'audio/webm';

    constructor(stream: MediaStream) {
        this.stream = stream;
    }

    start(timeslice?: number) {
        this.state = 'recording';
    }

    stop() {
        this.state = 'inactive';
        // Simulate async stop event
        setTimeout(() => {
            if (this.onstop) {
                this.onstop();
            }
        }, 0);
    }
}

global.MediaRecorder = MockMediaRecorder as any;

// Mock Blob
global.Blob = class {
    parts: any[];
    constructor(parts: any[], options: any) {
        this.parts = parts;
    }
    async arrayBuffer() {
        return new ArrayBuffer(this.parts.length);
    }
} as any;

// Mock navigator.mediaDevices
Object.defineProperty(global.navigator, 'mediaDevices', {
    value: {
        getUserMedia: vi.fn().mockResolvedValue({
            getTracks: () => [{ stop: vi.fn() }]
        } as unknown as MediaStream),
    },
    writable: true,
});

describe('useAudioRecorder Hook', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should initialize with default state', () => {
        const { result } = renderHook(() => useAudioRecorder());
        expect(result.current.isRecording).toBe(false);
        expect(result.current.duration).toBe(0);
        expect(result.current.error).toBe(null);
    });

    it('should start recording', async () => {
        const { result } = renderHook(() => useAudioRecorder());

        await act(async () => {
            await result.current.startRecording();
        });

        expect(result.current.isRecording).toBe(true);
        expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled();
    });

    it('should stop and save', async () => {
        const { result } = renderHook(() => useAudioRecorder());

        await act(async () => {
            await result.current.startRecording();
        });

        // Mock successful save
        const mockPath = '/tmp/recording.webm';
        (invoke as any).mockResolvedValue(mockPath);

        let savedPath: string | null = null;
        await act(async () => {
            savedPath = await result.current.stopRecording();
        });

        expect(savedPath).toBe(mockPath);
        expect(result.current.isRecording).toBe(false);
        expect(invoke).toHaveBeenCalledWith('save_audio', expect.any(Object));
    });
});
