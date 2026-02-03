import { useState, useRef, useCallback, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

export interface MediaDevice {
    deviceId: string;
    label: string;
}

export interface UseAudioRecorderReturn {
    isRecording: boolean;
    duration: number;
    startRecording: (deviceId?: string) => Promise<void>;
    stopRecording: () => Promise<string | null>;
    error: string | null;
    devices: MediaDevice[];
    refreshDevices: () => Promise<void>;
}

export function useAudioRecorder(): UseAudioRecorderReturn {
    const [isRecording, setIsRecording] = useState(false);
    const [duration, setDuration] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [devices, setDevices] = useState<MediaDevice[]>([]);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<number | null>(null);

    const refreshDevices = useCallback(async () => {
        try {
            // Ensure we have permission to list labels
            await navigator.mediaDevices.getUserMedia({ audio: true }).then(s => s.getTracks().forEach(t => t.stop()));

            const allDevices = await navigator.mediaDevices.enumerateDevices();
            const audioInputs = allDevices
                .filter(d => d.kind === 'audioinput')
                .map(d => ({
                    deviceId: d.deviceId,
                    label: d.label || `Microphone ${d.deviceId.slice(0, 5)}...`
                }));
            setDevices(audioInputs);
        } catch (err) {
            console.warn("Failed to refresh devices:", err);
        }
    }, []);

    // Initial load
    useEffect(() => {
        refreshDevices();
    }, [refreshDevices]);

    const startRecording = useCallback(async (deviceId?: string) => {
        try {
            setError(null);

            const constraints: MediaStreamConstraints = {
                audio: deviceId ? { deviceId: { exact: deviceId } } : true
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);

            // robust mimeType selection
            const mimeType = MediaRecorder.isTypeSupported('audio/webm')
                ? 'audio/webm'
                : MediaRecorder.isTypeSupported('audio/mp4')
                    ? 'audio/mp4'
                    : '';

            const options = mimeType ? { mimeType } : undefined;
            const mediaRecorder = new MediaRecorder(stream, options);

            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.start(200);
            setIsRecording(true);

            const startTime = Date.now();
            timerRef.current = window.setInterval(() => {
                setDuration(Math.floor((Date.now() - startTime) / 1000));
            }, 1000);

        } catch (err: any) {
            console.error("Error starting recording:", err);
            setError(err.message || "Failed to start recording");
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

                const mime = mediaRecorderRef.current?.mimeType || 'audio/webm';
                const ext = mime.includes('mp4') ? 'm4a' : 'webm';

                const blob = new Blob(audioChunksRef.current, { type: mime });
                const arrayBuffer = await blob.arrayBuffer();
                const payload = Array.from(new Uint8Array(arrayBuffer));

                // Cleanup tracks
                mediaRecorderRef.current?.stream.getTracks().forEach(t => t.stop());

                try {
                    const filename = `recording-${Date.now()}.${ext}`;
                    const path = await invoke<string>('save_audio', {
                        payload,
                        filename
                    });
                    resolve(path);
                } catch (err: any) {
                    console.error("Save failure:", err);
                    setError(err.message || "Failed to save audio");
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
        error,
        devices,
        refreshDevices
    };
}
