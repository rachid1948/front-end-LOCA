import { Component, AfterViewInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { API_BASE } from '../../core/services/auth.service';

@Component({
  selector: 'app-verify-account',
  standalone: true,
  imports: [],
  templateUrl: './verify-account.component.html',
  styleUrl: './verify-account.component.scss'
})
export class VerifyAccountComponent implements AfterViewInit {
  constructor(private http: HttpClient, private router: Router) {}

  ngAfterViewInit(): void {
    const params = new URLSearchParams(window.location.search);
    const token  = params.get('token') ?? '';

    if (!token) {
      const errEl = document.getElementById('verify-error');
      if (errEl) { errEl.textContent = 'Token manquant. Vérifiez le lien dans votre email.'; errEl.style.display = 'block'; }
      return;
    }

    const form = document.getElementById('verify-form') as HTMLFormElement;
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.submit(token);
      });
    }
  }

  private submit(token: string): void {
    const passwordEl  = document.getElementById('password')  as HTMLInputElement;
    const confirmEl   = document.getElementById('confirm')   as HTMLInputElement;
    const errEl       = document.getElementById('verify-error');
    const btnEl       = document.getElementById('verify-btn') as HTMLButtonElement;

    const password = passwordEl?.value?.trim();
    const confirm  = confirmEl?.value?.trim();

    if (!password || password.length < 8) {
      if (errEl) { errEl.textContent = 'Le mot de passe doit avoir au moins 8 caractères.'; errEl.style.display = 'block'; }
      return;
    }
    if (password !== confirm) {
      if (errEl) { errEl.textContent = 'Les mots de passe ne correspondent pas.'; errEl.style.display = 'block'; }
      return;
    }

    if (errEl) errEl.style.display = 'none';
    if (btnEl) { btnEl.disabled = true; btnEl.textContent = 'Activation...'; }

    this.http.post(`${API_BASE}/auth/verify-account`, { token, password }).subscribe({
      next: () => {
        const successEl = document.getElementById('verify-success');
        if (successEl) successEl.style.display = 'block';
        setTimeout(() => this.router.navigate(['/login']), 2500);
      },
      error: (err) => {
        const msg = err.error?.message ?? 'Token invalide ou expiré.';
        if (errEl) { errEl.textContent = msg; errEl.style.display = 'block'; }
        if (btnEl) { btnEl.disabled = false; btnEl.textContent = 'Activer mon compte'; }
      }
    });
  }
}
