import { Component, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements AfterViewInit {
  constructor(private auth: AuthService, private router: Router) {}

  ngAfterViewInit(): void {
    // Password visibility toggle
    const toggleBtn = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password') as HTMLInputElement;
    if (toggleBtn && passwordInput) {
      toggleBtn.addEventListener('click', () => {
        passwordInput.type = passwordInput.type === 'password' ? 'text' : 'password';
      });
    }

    // Form submit
    const form = document.querySelector('.login-card form') as HTMLFormElement;
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.doLogin();
      });
    }

    // If already logged in, redirect
    if (this.auth.isLoggedIn()) {
      this.router.navigate(['/dashboard']);
    }
  }

  private doLogin(): void {
    const usernameEl = document.getElementById('username') as HTMLInputElement;
    const passwordEl = document.getElementById('password') as HTMLInputElement;
    const errorEl    = document.getElementById('login-error');
    const btnEl      = document.querySelector('.btn-login') as HTMLButtonElement;

    const username = usernameEl?.value?.trim();
    const password = passwordEl?.value?.trim();

    if (!username || !password) {
      if (errorEl) { errorEl.textContent = 'Veuillez remplir tous les champs.'; errorEl.style.display = 'block'; }
      return;
    }

    if (btnEl) { btnEl.disabled = true; btnEl.querySelector('.btn-text')!.textContent = 'Connexion...'; }
    if (errorEl) errorEl.style.display = 'none';

    this.auth.login(username, password).subscribe({
      next: (res) => {
        // Apply body role class immediately so CSS RBAC works without page reload
        const role = res.role as string;
        document.body.classList.remove('role-ADMINISTRATEUR', 'role-GERANT', 'role-AGENT');
        if (role) document.body.classList.add(`role-${role}`);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        const msg = err.status === 401 || err.status === 403
          ? 'Identifiants incorrects. Vérifiez votre nom d\'utilisateur et mot de passe.'
          : 'Erreur de connexion. Vérifiez que le serveur est démarré.';
        if (errorEl) { errorEl.textContent = msg; errorEl.style.display = 'block'; }
        if (btnEl) { btnEl.disabled = false; btnEl.querySelector('.btn-text')!.textContent = 'Se connecter'; }
      }
    });
  }
}
