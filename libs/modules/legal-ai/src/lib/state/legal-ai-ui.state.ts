import { Injectable, signal } from '@angular/core';

/** Open/closed state of the module-level drawers, shared between the shell and its pages. */
@Injectable({ providedIn: 'root' })
export class LegalAiUiState {
    readonly uploadOpen = signal(false);
    readonly processingDismissed = signal(false);

    openUpload(): void {
        this.uploadOpen.set(true);
    }

    closeUpload(): void {
        this.uploadOpen.set(false);
    }
}
