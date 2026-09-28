import { CommonModule } from '@angular/common';
import {
    AfterViewInit,
    Component,
    ContentChild,
    ElementRef,
    EventEmitter,
    Input,
    OnChanges,
    Output,
    SimpleChanges,
    TemplateRef,
    ViewChild,
} from '@angular/core';
import { ComposerFile } from '../models/chat-composer.models';

@Component({
    selector: 'lib-chat-composer',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './chat-composer.html',
})
export class ChatComposerComponent implements AfterViewInit, OnChanges {
    @Input() value = '';
    @Input() placeholder = '';
    @Input() disabled = false;
    @Input() sending = false;
    @Input() minRows = 1;
    @Input() maxRows = 5;
    @Input() showAttachment = false;
    @Input() files: ComposerFile[] = [];

    @Output() valueChange = new EventEmitter<string>();
    @Output() send = new EventEmitter<void>();
    @Output() attachClick = new EventEmitter<void>();
    @Output() removeFile = new EventEmitter<string>();

    @ContentChild('leftToolbar') leftToolbarTpl?: TemplateRef<unknown>;
    @ContentChild('rightToolbar') rightToolbarTpl?: TemplateRef<unknown>;

    @ViewChild('textareaEl') private readonly textareaEl?: ElementRef<HTMLTextAreaElement>;

    private lineHeightPx = 0;
    multiline = false;

    ngAfterViewInit(): void {
        this.measureLineHeight();
        queueMicrotask(() => this.resize());
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['value'] && !changes['value'].firstChange) {
            queueMicrotask(() => this.resize());
        }
        if (changes['maxRows'] && !changes['maxRows'].firstChange) {
            queueMicrotask(() => this.resize());
        }
    }

    get expanded(): boolean {
        return this.multiline || this.files.length > 0;
    }

    get gridTemplateAreas(): string {
        if (!this.expanded) return '"leading primary trailing"';
        const rows = this.files.length ? ['"files files files"'] : [];
        rows.push('"primary primary primary"', '"leading leading trailing"');
        return rows.join(' ');
    }

    onInput(event: Event): void {
        const target = event.target as HTMLTextAreaElement;
        this.value = target.value;
        this.valueChange.emit(this.value);
        this.resize();
    }

    onKeydown(event: KeyboardEvent): void {
        if (event.key !== 'Enter' || event.shiftKey) return;
        event.preventDefault();
        this.trySend();
    }

    onSendClick(): void {
        this.trySend();
    }

    onFileRemove(id: string): void {
        this.removeFile.emit(id);
    }

    get sendDisabled(): boolean {
        return this.disabled || this.sending || (!this.value.trim() && this.files.length === 0);
    }

    private trySend(): void {
        if (this.sendDisabled) return;
        this.send.emit();
    }

    private measureLineHeight(): void {
        const el = this.textareaEl?.nativeElement;
        if (!el) return;
        const computed = window.getComputedStyle(el);
        const parsed = parseFloat(computed.lineHeight);
        this.lineHeightPx = Number.isNaN(parsed) ? el.clientHeight || 20 : parsed;
    }

    private resize(): void {
        const el = this.textareaEl?.nativeElement;
        if (!el) return;
        if (!this.lineHeightPx) this.measureLineHeight();
        el.style.height = 'auto';
        const naturalHeight = el.scrollHeight;
        const maxHeightPx = this.lineHeightPx * this.maxRows;
        el.style.height = `${Math.min(naturalHeight, maxHeightPx)}px`;
        el.style.overflowY = naturalHeight > maxHeightPx ? 'auto' : 'hidden';
        this.multiline = naturalHeight > this.lineHeightPx * 1.4;
    }
}
