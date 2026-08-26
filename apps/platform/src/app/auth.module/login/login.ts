import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { MessageModule } from 'primeng/message';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';

import { environment } from '../../../environments/environment';
import { APP_ROUTES } from '../../app.route-paths';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '@nfinyx/services';

@Component({
  selector: 'app-login',
  imports: [MessageModule, CheckboxModule, RouterModule, ButtonModule, ReactiveFormsModule, TranslateModule, InputTextModule],
  templateUrl: './login.html',
  styles: ``
})
export class Login  implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);
    private readonly translate = inject(TranslateService);
    private readonly auth = inject(AuthService);

    readonly showPassword = signal(false);
    readonly errorMessage = signal<string | null>(null);
    readonly submitting = signal(false);

    readonly forgotPasswordLink = APP_ROUTES.forgotPassword;

    readonly form = this.fb.nonNullable.group({
        email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
        password: ['', [Validators.required, Validators.maxLength(128)]],
        rememberMe: [false],
    });

    ngOnInit(): void {
        const error =
            this.route.snapshot.queryParamMap.get('error') ||
            new URLSearchParams(window.location.search).get('error');
        if (error === 'user_not_provisioned') {
            this.errorMessage.set(this.translate.instant('alerts.oidcUserNotProvisioned'));
        } else if (error) {
            this.errorMessage.set(this.translate.instant('alerts.loginFailed'));
        }
        // Clean IdP logout query from the address bar once consumed.
        if (window.location.search.includes('error=')) {
            const hash = window.location.hash || `#${APP_ROUTES.login}`;
            window.history.replaceState({}, '', `${window.location.pathname}${hash}`);
        }
    }

    toggleShowPassword(): void {
        this.showPassword.update(v => !v);
    }

    continueWithSso(): void {
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '';
        const base = environment.baseURL.replace(/\/$/, '');
        const params = returnUrl
            ? `?returnUrl=${encodeURIComponent(returnUrl)}`
            : '';
        window.location.href = `${base}/auth/oidc/login${params}`;
    }

    async submit(): Promise<void> {
        this.errorMessage.set(null);
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }
        this.submitting.set(true);
        const { email, password } = this.form.getRawValue();
        const result = await this.auth.login(email.trim(), password);
        if (!result.ok) {
            this.errorMessage.set(this.translateError(result.reason));
            this.submitting.set(false);
            return;
        }
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || APP_ROUTES.dashboard;
        await this.router.navigateByUrl(returnUrl, { replaceUrl: true });
        this.submitting.set(false);
    }

    private translateError(reason: string): string {
        if (reason.startsWith('alerts.') || reason.startsWith('form.')) {
            return this.translate.instant(reason);
        }
        return reason;
    }
}
