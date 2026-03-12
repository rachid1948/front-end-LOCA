import { Component, AfterViewInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService, API_BASE } from '../../core/services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../shared/sidebar.component';

interface UserResponse {
  id: number;
  username: string;
  email: string;
  role: string;
  enabled: boolean;
  createdBy: string;
  createdAt: string;
  verificationLink?: string;
}

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, SidebarComponent],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss'
})
export class UsersComponent implements AfterViewInit {
  users: UserResponse[] = [];
  isAdmin  = false;
  isGerant = false;

  constructor(private http: HttpClient, private auth: AuthService, private router: Router) {}

  ngAfterViewInit(): void {
    this.isAdmin  = this.auth.isAdmin();
    this.isGerant = this.auth.isGerant();

    // Expose functions to HTML
    (window as any).usersLoad   = () => this.loadUsers();
    (window as any).usersCreate = () => this.createUser();
    (window as any).usersDelete = (id: number) => this.deleteUser(id);
    (window as any).usersOpenModal = () => {
      const modal = document.getElementById('create-modal');
      if (modal) modal.style.display = 'flex';
    };
    (window as any).usersCloseModal = () => {
      const modal = document.getElementById('create-modal');
      if (modal) modal.style.display = 'none';
      // reset form
      ['new-username','new-email'].forEach(id => { const el = document.getElementById(id) as HTMLInputElement; if(el) el.value=''; });
      const sel = document.getElementById('new-role') as HTMLSelectElement; if(sel) sel.selectedIndex=0;
      const err = document.getElementById('create-error'); if(err) err.style.display='none';
    };
    (window as any).usersCloseLinkModal = () => {
      const modal = document.getElementById('link-modal');
      if (modal) modal.style.display = 'none';
    };
    (window as any).usersCopyLink = () => {
      const text = document.getElementById('activation-link-text')?.textContent ?? '';
      navigator.clipboard.writeText(text).then(() => {
        const btn = document.querySelector('.btn-copy') as HTMLButtonElement;
        if (btn) { btn.textContent = '✓ Copié !'; setTimeout(() => btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" width="16" height="16"><rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" stroke-width="1.5"/></svg> Copier', 2000); }
      });
    };

    this.loadUsers();
  }

  private headers(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.auth.getToken() ?? ''}` });
  }

  loadUsers(): void {
    this.http.get<UserResponse[]>(`${API_BASE}/users`, { headers: this.headers() }).subscribe({
      next: (data) => {
        this.users = data;
        this.renderTable(data);
      },
      error: () => this.showError('Erreur lors du chargement des utilisateurs.')
    });
  }

  createUser(): void {
    const username = (document.getElementById('new-username') as HTMLInputElement)?.value?.trim();
    const email    = (document.getElementById('new-email')    as HTMLInputElement)?.value?.trim();
    const role     = (document.getElementById('new-role')     as HTMLSelectElement)?.value;
    const errEl    = document.getElementById('create-error');
    const btnEl    = document.getElementById('create-btn') as HTMLButtonElement;

    if (!username || !email || !role) {
      if (errEl) { errEl.textContent = 'Tous les champs sont obligatoires.'; errEl.style.display = 'block'; }
      return;
    }

    if (btnEl) { btnEl.disabled = true; btnEl.textContent = 'Création...'; }
    if (errEl) errEl.style.display = 'none';

    this.http.post<UserResponse>(`${API_BASE}/users`, { username, email, role }, { headers: this.headers() }).subscribe({
      next: (res) => {
        (window as any).usersCloseModal();
        this.loadUsers();
        if (btnEl) { btnEl.disabled = false; btnEl.textContent = 'Créer le compte'; }
        // Show activation link modal
        if (res.verificationLink) {
          const linkEl = document.getElementById('activation-link-text');
          if (linkEl) linkEl.textContent = res.verificationLink;
          const linkModal = document.getElementById('link-modal');
          if (linkModal) linkModal.style.display = 'flex';
        } else {
          this.showToast(`Compte ${username} créé. Un email d'activation a été envoyé.`);
        }
      },
      error: (err) => {
        const msg = err.error?.message ?? 'Erreur lors de la création.';
        if (errEl) { errEl.textContent = msg; errEl.style.display = 'block'; }
        if (btnEl) { btnEl.disabled = false; btnEl.textContent = 'Créer le compte'; }
      }
    });
  }

  deleteUser(id: number): void {
    if (!confirm('Supprimer cet utilisateur ?')) return;
    this.http.delete(`${API_BASE}/users/${id}`, { headers: this.headers() }).subscribe({
      next: () => this.loadUsers(),
      error: (err) => this.showError(err.error?.message ?? 'Erreur lors de la suppression.')
    });
  }

  private renderTable(users: UserResponse[]): void {
    const tbody = document.getElementById('users-tbody');
    if (!tbody) return;
    if (users.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:30px;color:#888">Aucun utilisateur</td></tr>';
      return;
    }
    tbody.innerHTML = users.map(u => `
      <tr>
        <td>${u.username}</td>
        <td>${u.email}</td>
        <td><span class="role-badge role-${u.role.toLowerCase()}">${u.role}</span></td>
        <td><span class="status-badge ${u.enabled ? 'enabled' : 'disabled'}">${u.enabled ? 'Actif' : 'En attente'}</span></td>
        <td>${u.createdBy ?? '-'}</td>
        <td>
          ${this.isAdmin && u.role !== 'ADMINISTRATEUR'
            ? `<button class="btn-del" onclick="usersDelete(${u.id})" title="Supprimer">
                <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><polyline points="3 6 5 6 21 6" stroke="currentColor" stroke-width="1.5"/><path d="M19 6l-1 14H6L5 6" stroke="currentColor" stroke-width="1.5"/><path d="M10 11v6M14 11v6" stroke="currentColor" stroke-width="1.5"/></svg>
              </button>`
            : ''}
        </td>
      </tr>`).join('');
  }

  private showError(msg: string): void {
    const el = document.getElementById('page-error');
    if (el) { el.textContent = msg; el.style.display = 'block'; }
  }

  private showToast(msg: string): void {
    const el = document.getElementById('toast');
    if (el) { el.textContent = msg; el.style.display = 'block'; setTimeout(() => el.style.display = 'none', 4000); }
  }
}
