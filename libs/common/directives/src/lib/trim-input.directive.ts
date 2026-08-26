import { Directive, HostListener, inject } from '@angular/core';
import { NgControl } from '@angular/forms';

/**
 * Trims leading/trailing whitespace from a free-text input on blur.
 * Works with both `formControlName`/`[formControl]` (updates the control's
 * value directly) and plain `[(ngModel)]` (falls back to mutating the DOM
 * value so the next `input`/`ngModelChange` cycle picks it up).
 */
@Directive({
    selector: 'input[libTrimInput], textarea[libTrimInput]',
    standalone: true,
})
export class TrimInputDirective {
    private readonly ngControl = inject(NgControl, { optional: true, self: true });

    @HostListener('blur', ['$event'])
    onBlur(event: Event): void {
        const target = event.target as HTMLInputElement | HTMLTextAreaElement;
        const trimmed = (target.value ?? '').trim();
        if (trimmed === target.value) {
            return;
        }

        if (this.ngControl?.control) {
            this.ngControl.control.setValue(trimmed);
        } else {
            target.value = trimmed;
            target.dispatchEvent(new Event('input'));
        }
    }
}
