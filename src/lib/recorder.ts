import { BaseDirectory, writeFile, mkdir } from '@tauri-apps/plugin-fs';
import { appDataDir, join } from '@tauri-apps/api/path';

export class AudioRecorder {
    private mediaRecorder: MediaRecorder | null = null;
    private audioChunks: Blob[] = [];

    async start(): Promise<void> {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.mediaRecorder = new MediaRecorder(stream);
        this.audioChunks = [];

        this.mediaRecorder.ondataavailable = (event) => {
            this.audioChunks.push(event.data);
        };

        this.mediaRecorder.start();
    }

    async stop(): Promise<string> {
        return new Promise((resolve, reject) => {
            if (!this.mediaRecorder) {
                reject(new Error('Recorder not initialized'));
                return;
            }

            this.mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
                const arrayBuffer = await audioBlob.arrayBuffer();
                const uint8Array = new Uint8Array(arrayBuffer);

                try {
                    // Ensure directory exists
                    const appData = await appDataDir();

                    // Critical: Create the directory if it doesn't exist
                    await mkdir("", {
                        baseDir: BaseDirectory.AppData,
                        recursive: true
                    }).catch(() => { }); // Ignore if exists (or handle specific error)

                    // Generate filename
                    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                    const filename = `recording-${timestamp}.webm`;

                    // Write to AppData root
                    await writeFile(filename, uint8Array, { baseDir: BaseDirectory.AppData });

                    // Resolve absolute path for the sidecar
                    const absolutePath = await join(appData, filename);

                    resolve(absolutePath);
                } catch (error) {
                    reject(error);
                }
            };

            this.mediaRecorder.stop();
        });
    }
}
