import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { VoicePhase } from '../../models/chat.models';

/** Full-screen voice-conversation overlay: animated orb + waveform bars + phase chip, driven by `AnalyserNode` FFT data upstream. */
@Component({
    selector: 'lib-voice-orb',
    standalone: true,
    imports: [CommonModule, TranslateModule, ButtonModule],
    template: `
        <div class="flex flex-1 flex-col items-center justify-center gap-6 bg-gray-50 px-6 py-10" [attr.data-phase]="phase">
            <div class="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-gray-600">
                <span
                    class="h-2 w-2 rounded-full"
                    [class.bg-gray-300]="phase === 'idle'"
                    [class.bg-primary-500]="phase === 'listening'"
                    [class.animate-pulse]="phase !== 'idle'"
                    [class.bg-amber-500]="phase === 'transmitting' || phase === 'thinking'"
                    [class.bg-green-500]="phase === 'speaking'"
                ></span>
                {{ titleKey | translate }}
            </div>

            <div
                class="relative grid h-28 w-28 place-items-center rounded-full border-4 border-primary-500 bg-white text-primary-500 transition-transform"
                [class.scale-110]="phase === 'listening' || phase === 'speaking'"
            >
                <i class="pi pi-microphone text-4xl"></i>
            </div>

            <p class="max-w-xs text-center text-sm text-gray-500">{{ hintKey | translate }}</p>

            <div class="flex h-14 items-end gap-1" aria-hidden="true">
                @for (level of audioLevels; track $index) {
                    <span class="w-1 rounded-full bg-primary-400" [style.height.px]="level"></span>
                }
            </div>

            <div class="flex items-center gap-4 text-xs font-semibold text-gray-400">
                <span [class.text-primary-600]="phase === 'listening'">{{ 'mofaChatbot.chat.voice.stepListen' | translate }}</span>
                <span [class.text-primary-600]="phase === 'transmitting'">{{ 'mofaChatbot.chat.voice.stepSend' | translate }}</span>
                <span [class.text-primary-600]="phase === 'thinking'">{{ 'mofaChatbot.chat.voice.stepThink' | translate }}</span>
                <span [class.text-primary-600]="phase === 'speaking'">{{ 'mofaChatbot.chat.voice.stepSpeak' | translate }}</span>
            </div>

            <button type="button" pButton severity="danger" [outlined]="true" class="cursor-pointer" (click)="endCall.emit()">
                <span>{{ 'mofaChatbot.chat.voice.endCall' | translate }}</span>
            </button>
        </div>
    `,
})
export class VoiceOrbComponent {
    @Input() phase: VoicePhase = 'idle';
    @Input() audioLevels: number[] = [];

    @Output() endCall = new EventEmitter<void>();

    get titleKey(): string {
        return `mofaChatbot.chat.voice.title${this.phaseSuffix()}`;
    }
    get hintKey(): string {
        return `mofaChatbot.chat.voice.hint${this.phaseSuffix()}`;
    }
    private phaseSuffix(): string {
        switch (this.phase) {
            case 'listening':
                return 'Listening';
            case 'transmitting':
                return 'Transmitting';
            case 'thinking':
                return 'Thinking';
            case 'speaking':
                return 'Speaking';
            default:
                return 'Idle';
        }
    }
}
