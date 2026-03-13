import { Component, AfterViewInit, ViewEncapsulation } from '@angular/core';
import { forkJoin } from 'rxjs';
import { VehiculeService } from '../../core/services/vehicule.service';
import { OperationService } from '../../core/services/operation.service';

import { SidebarComponent } from '../../shared/sidebar.component';
@Component({
  selector: 'app-disponibilite',
  standalone: true,
  imports: [SidebarComponent],
  templateUrl: './disponibilite.component.html',
  styleUrl: './disponibilite.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class DisponibiliteComponent implements AfterViewInit {

  voitures: any[] = [];

  today = new Date();
  today_str = this.today.toISOString().split('T')[0];

  constructor(private vehiculeService: VehiculeService, private operationService: OperationService) {}

  loadAll() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    forkJoin({
      vehicules: this.vehiculeService.getAll(),
      operations: this.operationService.getAll()
    }).subscribe({
      next: ({ vehicules, operations }) => {
        this.voitures = vehicules.map(v => {
          // Opération active aujourd'hui pour ce véhicule
          const activeOp = operations.find(op => {
            if (op.vehiculeId !== v.id) return false;
            const depart = new Date(op.dateDepart);
            const retour = new Date(op.dateRetour);
            depart.setHours(0, 0, 0, 0);
            retour.setHours(0, 0, 0, 0);
            return depart <= today && retour > today;
          });

          return {
            id: v.id,
            nom: `${v.marque ?? ''} ${v.modele ?? ''}`.trim(),
            immat: v.matricule ?? '',
            statut: v.statut === 'MAINTENANCE' ? 'maintenance'
                  : activeOp                   ? 'louee'
                  : 'disponible',
            retourLe: activeOp ? new Date(activeOp.dateRetour) : null as Date | null,
          };
        });
        this.renderAll();
        this.renderNotifications();
      },
      error: () => { this.renderAll(); this.renderNotifications(); }
    });
  }

  ngAfterViewInit(): void {
    (window as any)['filterFleet'] = (filter: string) => {
      this.setActiveFilter(filter);
      this.renderAll(filter);
    };

    const searchInput = document.getElementById('searchDate') as HTMLInputElement;
    if (searchInput) {
      searchInput.addEventListener('change', () => this.renderSearch(searchInput.value));
    }

    this.loadAll();
  }

  joursRestants(date: Date | null): number {
    if (!date) return 999;
    const diff = date.getTime() - this.today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  formatDate(date: Date | null): string {
    if (!date) return '—';
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  statutLabel(v: any): string {
    if (v.statut === 'disponible') return 'Disponible';
    if (v.statut === 'maintenance') return 'Maintenance';
    if (!v.retourLe) return 'Retour ouvert';
    const jours = this.joursRestants(v.retourLe);
    return `Retour dans ${jours}j`;
  }

  statutClass(v: any): string {
    if (v.statut === 'disponible') return 'available';
    if (v.statut === 'maintenance') return 'maintenance';
    const jours = this.joursRestants(v.retourLe);
    return jours <= 2 ? 'soon' : 'rented';
  }

  carRow(v: any): string {
    const sc = this.statutClass(v);
    const sl = this.statutLabel(v);
    const retour = this.formatDate(v.retourLe);
    return `
      <tr>
        <td>
          <div class="car-cell">
            <div class="car-dot ${sc}"></div>
            <div>
              <span class="car-name">${v.nom}</span>
              <span class="car-plate">${v.immat}</span>
            </div>
          </div>
        </td>
        <td>${retour}</td>
        <td><span class="badge ${sc}">${sl}</span></td>
      </tr>`;
  }

  renderAll(filter: string = 'all'): void {
    const tbody = document.getElementById('tbody-all');
    if (!tbody) return;

    let list = [...this.voitures];

    // Appliquer le filtre
    if (filter !== 'all') {
      // Le filtre 'rented' inclut aussi 'soon' (retour ≤ 7 jours)
      if (filter === 'rented') {
        list = list.filter(v => this.statutClass(v) === 'rented' || this.statutClass(v) === 'soon');
      } else {
        list = list.filter(v => this.statutClass(v) === filter);
      }
    }

    // Tri : disponibles en premier, puis par date de retour croissante
    list.sort((a, b) => {
      const aDispo = a.statut === 'disponible';
      const bDispo = b.statut === 'disponible';
      if (aDispo && !bDispo) return -1;
      if (!aDispo && bDispo) return 1;
      if (!a.retourLe && !b.retourLe) return 0;
      if (!a.retourLe) return 1;
      if (!b.retourLe) return -1;
      return a.retourLe.getTime() - b.retourLe.getTime();
    });

    tbody.innerHTML = list.length
      ? list.map(v => this.carRow(v)).join('')
      : `<tr><td colspan="3" style="text-align:center;padding:24px;color:rgba(0,245,255,0.4)">Aucun véhicule dans cette catégorie.</td></tr>`;
  }

  setActiveFilter(filter: string): void {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    const btn = document.getElementById(`filter-${filter === 'all' ? 'all' : filter}`);
    if (btn) btn.classList.add('active');
  }

  renderSearch(dateStr: string): void {
    const container = document.getElementById('search-results');
    const empty     = document.getElementById('search-empty');
    if (!container || !empty) return;

    if (!dateStr) {
      container.innerHTML = '';
      empty.style.display = 'flex';
      return;
    }

    // Utiliser l'API : disponibles pour une journée = [dateStr, lendemain[
    const dateFin = new Date(dateStr);
    dateFin.setDate(dateFin.getDate() + 1);
    const dateRetour = dateFin.toISOString().split('T')[0];

    this.vehiculeService.getDisponibles(dateStr, dateRetour).subscribe({
      next: (dispo) => {
        if (dispo.length === 0) {
          container.innerHTML = '';
          empty.style.display = 'flex';
        } else {
          empty.style.display = 'none';
          container.innerHTML = dispo.map(v => `
            <div class="car-pill">
              <div class="car-dot available"></div>
              <div>
                <span class="car-name">${v.marque ?? ''} ${v.modele ?? ''}</span>
                <span class="car-plate">${v.matricule ?? ''}</span>
              </div>
            </div>`).join('');
        }
      },
      error: () => {
        empty.style.display = 'flex';
        container.innerHTML = '';
      }
    });
  }

  renderNotifications(): void {
    const container = document.getElementById('notif-container');
    if (!container) return;

    const bientot = this.voitures
      .filter(v => {
        if (v.statut === 'disponible' || !v.retourLe) return false;
        return this.joursRestants(v.retourLe) <= 7 && this.joursRestants(v.retourLe) >= 0;
      })
      .sort((a, b) => a.retourLe!.getTime() - b.retourLe!.getTime());

    const badge = document.getElementById('notif-badge');
    if (badge) badge.textContent = bientot.length.toString();

    if (bientot.length === 0) {
      container.innerHTML = `<div class="notif-empty">Aucune voiture ne rentre dans les 7 prochains jours.</div>`;
      return;
    }

    container.innerHTML = bientot.map(v => {
      const jours = this.joursRestants(v.retourLe);
      const msg = jours === 0 ? "Disponible aujourd'hui !" : jours === 1 ? 'Disponible demain' : `Disponible dans ${jours} jours`;
      return `
        <div class="notif-card">
          <div class="notif-icon">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </div>
          <div class="notif-info">
            <span class="notif-car">${v.nom} — ${v.immat}</span>
            <span class="notif-msg">${msg}</span>
          </div>
          <span class="notif-days">${jours}j</span>
        </div>`;
    }).join('');
  }
}
