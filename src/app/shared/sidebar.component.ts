import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterModule, CommonModule],
  styleUrl: './sidebar.component.scss',
  template: `
    <aside class="sidebar">
      <div class="sidebar-brand">
        <h1>LOCA<span>DRIVE</span></h1>
        <p>Administration</p>
      </div>
      <nav class="sidebar-nav">
        <!-- ...existing menu items... -->
        <a routerLink="/dashboard" routerLinkActive="active" class="nav-item" [routerLinkActiveOptions]="{ exact: true }">
          <svg viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" stroke-width="1.5"/><rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" stroke-width="1.5"/><rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" stroke-width="1.5"/><rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" stroke-width="1.5"/></svg>
          Tableau de bord
        </a>
        <a routerLink="/operations" routerLinkActive="active" class="nav-item">
          <svg viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          Les Opérations
        </a>
        <a routerLink="/maintenance" routerLinkActive="active" class="nav-item">
          <svg viewBox="0 0 24 24" fill="none"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.77 3.77z" stroke="currentColor" stroke-width="1.5"/></svg>
          Maintenance
        </a>
        <a routerLink="/statistiques" routerLinkActive="active" class="nav-item stat-nav-link">
          <svg viewBox="0 0 24 24" fill="none"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Statistiques
        </a>
        <a routerLink="/chiffre-affaire" routerLinkActive="active" class="nav-item">
          <svg viewBox="0 0 24 24" fill="none"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          Chiffre d'affaire
        </a>
        <a routerLink="/factures" routerLinkActive="active" class="nav-item">
          <svg viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" stroke-width="1.5"/><polyline points="14 2 14 8 20 8" stroke="currentColor" stroke-width="1.5"/><line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          Factures
        </a>
        <a routerLink="/disponibilite" routerLinkActive="active" class="nav-item">
          <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/><path d="M8 12l2.5 2.5L16 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Disponibilité
        </a>
        <a routerLink="/parc" routerLinkActive="active" class="nav-item">
          <svg viewBox="0 0 24 24" fill="none"><path d="M3 17h18M5 17V9l2-4h10l2 4v8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="7.5" cy="17" r="1.5" stroke="currentColor" stroke-width="1.5"/><circle cx="16.5" cy="17" r="1.5" stroke="currentColor" stroke-width="1.5"/></svg>
          Parc
        </a>
        <a routerLink="/assurance-hub" routerLinkActive="active" class="nav-item">
          <svg viewBox="0 0 24 24" fill="none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Assurance / Vignette
        </a>
        <a routerLink="/users" routerLinkActive="active" class="nav-item users-nav-link">
          <svg viewBox="0 0 24 24" fill="none"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" stroke-width="1.5"/><circle cx="9" cy="7" r="4" stroke="currentColor" stroke-width="1.5"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" stroke-width="1.5"/></svg>
          Gestion des comptes
        </a>
      </nav>
      <div class="sidebar-footer">
        <div class="user-avatar" [ngClass]="roleClass">{{ initial }}</div>
        <div class="user-details">
          <span class="user-name">{{ roleLabel }}</span>
          <span class="user-status" style="color: #00ff88;">En ligne</span>
        </div>
        <button class="logout-btn" (click)="logout()" title="Déconnexion">
          <!-- Fluent/Material futuristic logout icon -->
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <path d="M16 17l5-5-5-5" stroke="#00f5ff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M21 12H9" stroke="#7b2fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
            <rect x="3" y="4" width="6" height="16" rx="2" stroke="#00f5ff" stroke-width="2.2"/>
          </svg>
        </button>
      </div>
    </aside>
  `
})
export class SidebarComponent {
  private auth = inject(AuthService);

  get user() {
    return this.auth.getUser();
  }
  get initial() {
    return this.user?.username?.charAt(0)?.toUpperCase() || '?';
  }
  get roleLabel() {
    if (!this.user) return '';
    let role = this.user.role?.toLowerCase();
    switch (role) {
      case 'administrateur': return 'Admin';
      case 'gerant': return 'Gérant';
      case 'agent': return 'Agent';
      default: return this.user.role;
    }
  }
  get roleClass() {
    if (!this.user) return '';
    switch (this.user.role?.toLowerCase()) {
      case 'administrateur': return 'avatar-admin';
      case 'gerant': return 'avatar-gerant';
      case 'agent': return 'avatar-agent';
      default: return '';
    }
  }
  logout() {
    this.auth.logout();
    window.location.href = '/login';
  }
}
