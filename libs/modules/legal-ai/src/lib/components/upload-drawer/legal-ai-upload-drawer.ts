import { Component, inject, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { ProgressBarModule } from 'primeng/progressbar';
import { LegalAiI18n } from '../../services/legal-ai-i18n.service';
import { LegalAiUiState } from '../../state/legal-ai-ui.state';
import { LegalAiUploadService } from '../../state/legal-ai-upload.service';

@Component({
    selector: 'lib-legal-ai-upload-drawer',
    standalone: true,
    imports: [TranslateModule, ButtonModule, DrawerModule, ProgressBarModule],
    templateUrl: './legal-ai-upload-drawer.html',
})
export class LegalAiUploadDrawer {
    protected readonly ui = inject(LegalAiUiState);
    protected readonly upload = inject(LegalAiUploadService);
    protected readonly i18n = inject(LegalAiI18n);
    protected readonly dropping = signal(false);

    protected size(bytes: number): string {
        const mb = bytes / 1_048_576;
        return new Intl.NumberFormat(this.i18n.lang === 'ar' ? 'ar-AE' : 'en-GB', {
            style: 'unit',
            unit: mb >= 1 ? 'megabyte' : 'kilobyte',
            maximumFractionDigits: 1,
        }).format(mb >= 1 ? mb : bytes / 1024);
    }

    protected close(): void {
        if (this.upload.busy()) return;
        this.ui.closeUpload();
        this.upload.clear();
    }

    protected onPick(event: Event): void {
        const input = event.target as HTMLInputElement;
        this.upload.pick(input.files?.[0]);
        input.value = '';
    }

    protected onDrag(event: DragEvent, active: boolean): void {
        event.preventDefault();
        this.dropping.set(active);
    }

    protected onDrop(event: DragEvent): void {
        event.preventDefault();
        this.dropping.set(false);
        this.upload.pick(event.dataTransfer?.files?.[0]);
    }
}
