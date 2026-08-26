import { Injectable, OnDestroy } from '@angular/core';

const VAD_SPEECH = 16;
const VAD_SILENCE_MS = 1300;
const VAD_MIN_SPEECH_MS = 450;
const VAD_MAX_MS = 22_000;
const BARS_COUNT = 32;

export interface VoiceCaptureHooks {
    /** Called on every animation frame while recording, with per-bar level pixels (matches the legacy waveform bar heights). */
    onLevels: (levels: number[]) => void;
    /** Called once real speech has been heard and then a silence gap is detected — the natural "stop talking" signal. */
    onAutoStop: () => void;
    /** Called if `VAD_MAX_MS` elapses with no speech heard at all (visitor never spoke). */
    onNoSpeechTimeout: () => void;
}

/**
 * Wraps `MediaRecorder` + a Web Audio `AnalyserNode` for the live voice-conversation
 * mode — ported from the legacy `chat.component.ts`'s recording/waveform/VAD logic.
 * Deliberately NOT `providedIn: 'root'` — provide it in the Chat page's own
 * `providers` array so it's torn down with the page (see module conventions).
 */
@Injectable()
export class VoiceCaptureService implements OnDestroy {
    private mediaRecorder: MediaRecorder | null = null;
    private recordedChunks: Blob[] = [];
    private stream: MediaStream | null = null;
    private audioContext: AudioContext | null = null;
    private analyser: AnalyserNode | null = null;
    private waveformFrame: number | null = null;
    private hooks: VoiceCaptureHooks | null = null;

    private cancelled = false;
    private speechHeard = false;
    private speechStartedAt = 0;
    private lastSpeechAt = 0;
    private recordStartedAt = 0;
    private stopResolvers: ((blob: Blob | null) => void)[] = [];

    get isRecording(): boolean {
        return this.mediaRecorder?.state === 'recording';
    }

    /** Requests the mic, starts recording, and begins level/VAD monitoring. */
    async start(hooks: VoiceCaptureHooks): Promise<void> {
        this.hooks = hooks;
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.stream = stream;
        this.recordedChunks = [];
        this.cancelled = false;
        this.speechHeard = false;
        this.speechStartedAt = 0;
        this.lastSpeechAt = 0;
        this.recordStartedAt = performance.now();

        const recorder = new MediaRecorder(stream);
        this.mediaRecorder = recorder;
        recorder.ondataavailable = e => {
            if (e.data.size > 0) this.recordedChunks.push(e.data);
        };
        recorder.onstop = () => {
            stream.getTracks().forEach(t => t.stop());
            this.stopWaveform();
            const blob = this.cancelled || this.recordedChunks.length === 0 ? null : new Blob(this.recordedChunks, { type: 'audio/webm' });
            const resolvers = this.stopResolvers;
            this.stopResolvers = [];
            resolvers.forEach(r => r(blob));
        };
        recorder.start();
        this.startWaveform(stream);
    }

    /** Stops the recorder and resolves with the recorded blob (or `null` if nothing/cancelled). */
    stop(): Promise<Blob | null> {
        return new Promise(resolve => {
            if (!this.mediaRecorder || this.mediaRecorder.state !== 'recording') {
                resolve(null);
                return;
            }
            this.stopResolvers.push(resolve);
            this.mediaRecorder.stop();
        });
    }

    /** Stops (if recording) and discards the result — used for "end call" / cancel actions. */
    cancel(): void {
        this.cancelled = true;
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            this.mediaRecorder.stop();
        } else {
            this.stopWaveform();
        }
    }

    private startWaveform(stream: MediaStream): void {
        try {
            const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            this.audioContext = new AudioCtx();
            const source = this.audioContext.createMediaStreamSource(stream);
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 64;
            source.connect(this.analyser);
            const data = new Uint8Array(this.analyser.frequencyBinCount);

            const tick = () => {
                if (!this.analyser) return;
                this.analyser.getByteFrequencyData(data);
                const step = Math.floor(data.length / BARS_COUNT) || 1;
                const levels = Array.from({ length: BARS_COUNT }, (_, i) => {
                    const v = data[i * step] || 0;
                    return 6 + Math.round((v / 255) * 42);
                });
                this.hooks?.onLevels(levels);
                this.detectVoicePause(data);
                this.waveformFrame = requestAnimationFrame(tick);
            };
            tick();
        } catch {
            // Visualizer is a nice-to-have — recording itself still works even
            // if AudioContext isn't available in this browser/context.
        }
    }

    private stopWaveform(): void {
        if (this.waveformFrame !== null) cancelAnimationFrame(this.waveformFrame);
        this.waveformFrame = null;
        this.audioContext?.close();
        this.audioContext = null;
        this.analyser = null;
    }

    private detectVoicePause(data: Uint8Array): void {
        if (!this.isRecording) return;
        const now = performance.now();
        const avg = data.reduce((sum, v) => sum + v, 0) / (data.length || 1);
        if (avg >= VAD_SPEECH) {
            if (!this.speechHeard) this.speechStartedAt = now;
            this.speechHeard = true;
            this.lastSpeechAt = now;
        }
        const spokenLongEnough = this.speechHeard && now - this.speechStartedAt >= VAD_MIN_SPEECH_MS;
        const paused = this.speechHeard && now - this.lastSpeechAt >= VAD_SILENCE_MS;
        const tooLong = now - this.recordStartedAt >= VAD_MAX_MS;
        if (spokenLongEnough && paused) {
            this.hooks?.onAutoStop();
            return;
        }
        if (tooLong && !this.speechHeard) {
            this.cancelled = true;
            this.hooks?.onNoSpeechTimeout();
        }
    }

    ngOnDestroy(): void {
        this.cancel();
        this.stream?.getTracks().forEach(t => t.stop());
    }
}
