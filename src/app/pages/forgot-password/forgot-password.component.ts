import { Component, AfterViewInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_BASE } from '../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss'
})
export class ForgotPasswordComponent implements AfterViewInit {
  constructor(private http: HttpClient) {}

  ngAfterViewInit(): void {
    const form = document.getElementById('forgot-form') as HTMLFormElement;
    if (form) form.addEventListener('submit', (e) => { e.preventDefault(); this.submit(); });
  }

  private submit(): void {
    const emailEl   = document.getElementById('email')  as HTMLInputElement;
    const errEl     = document.getElementById('forgot-error');
    const successEl = document.getElementById('forgot-success');
    const btnEl     = document.getElementById('forgot-btn') as HTMLButtonElement;

    const email = emailEl?.value?.trim();
    if (!email) {
      if (errEl) { errEl.textContent = "Veuillez entrer votre adresse email."; errEl.style.display = 'block'; }
      return;
    }

    if (errEl) errEl.style.display = 'none';
    if (btnEl) { btnEl.disabled = true; btnEl.textContent = 'Envoi...'; }

    this.http.post(`${API_BASE}/auth/forgot-password`, { email }).subscribe({
      next: () => {
        if (successEl) successEl.style.display = 'block';
        if (btnEl) { btnEl.disabled = false; btnEl.textContent = 'Envoyer le lien'; }
      },
      error: () => {
        // API always returns 200 to prevent enumeration
        if (successEl) successEl.style.display = 'block';
        if (btnEl) { btnEl.disabled = false; btnEl.textContent = 'Envoyer le lien'; }
      }
    });
  }
}
