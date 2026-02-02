
import { useState, useRef, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';

export interface UseAudioRecorderReturn {
    isRecording: boolean;
    duration: number;
    startRecording: () => Promise<void>;
    stopRecording: () => Promise<string | null>;
    error: string | null;
}

export function useAudioRecorder(): UseAudioRecorderReturn {
    const [isRecording, setIsRecording] = useState(false);
    const [duration, setDuration] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<number | null>(null);

    const startRecording = useCallback(async () => {
        try {
            setError(null);
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm'
            });
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.start(100); // Collect 100ms chunks
            setIsRecording(true);

            // Start timer
            const startTime = Date.now();
            timerRef.current = window.setInterval(() => {
                setDuration(Math.floor((Date.now() - startTime) / 1000));
            }, 1000);

        } catch (err: any) {
            console.error("Error starting recording:", err);
            setError(`Failed to start: ${err.message || err}`);
            setIsRecording(false);
        }
    }, []);

    const stopRecording = useCallback(async (): Promise<string | null> => {
        return new Promise((resolve) => {
            if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
                resolve(null);
                return;
            }

            mediaRecorderRef.current.onstop = async () => {
                setIsRecording(false);
                if (timerRef.current) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
                }
                setDuration(0);

                const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const arrayBuffer = await blob.arrayBuffer();
                const uint8Array = new Uint8Array(arrayBuffer);
                const payload = Array.from(uint8Array);

                // Cleanup tracks
                mediaRecorderRef.current?.stream.getTracks().forEach(t => t.stop());

                try {
                    const filename = `recording-${Date.now()}.webm`;
                    console.log(`Invoking save_audio for ${filename} (${payload.length} bytes)`);

                    // Direct invoke call
                    const path = await invoke<string>('save_audio', {
                        payload,
                        filename
                    });

                    console.log("File saved at:", path);
                    resolve(path);
                } catch (err: any) {
                    console.error("Failed to save audio:", err);
                    setError(`Failed to save: ${err.message || err}`);
                    resolve(null);
                }
            };

            mediaRecorderRef.current.stop();
        });
    }, []);

    return {
        isRecording,
        duration,
        startRecording,
        stopRecording,
        error
    };
}
