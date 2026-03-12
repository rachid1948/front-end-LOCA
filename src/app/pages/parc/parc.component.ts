import { Component, AfterViewInit, ViewEncapsulation } from '@angular/core';
import { VehiculeService } from '../../core/services/vehicule.service';

const BRAND_COLORS: Record<string, string> = {
  'mercedes': '#C0C0C0', 'bmw': '#1a1a2e', 'audi': '#2d2d2d', 'tesla': '#cc0000',
  'renault': '#ffcc00', 'dacia': '#5a8a5a', 'peugeot': '#003087', 'toyota': '#cc0000',
  'volkswagen': '#1a4a8a', 'ford': '#003087', 'hyundai': '#4a4a8a', 'kia': '#8a2a2a',
  'citroën': '#8a1a1a', 'seat': '#1a6a1a', 'opel': '#4a1a6a', 'nissan': '#2a4a6a',
  'fiat': '#6a2a1a', 'default': '#ffc107'
};

function getBrandColor(marque: string): string {
  const k = (marque || '').toLowerCase().split(' ')[0];
  return BRAND_COLORS[k] || BRAND_COLORS['default'];
}

function getBrandBadge(marque: string): string {
  return (marque || '?').substring(0, 3).toUpperCase();
}

@Component({
  selector: 'app-parc',
  standalone: true,
  imports: [],
  templateUrl: './parc.component.html',
  styleUrl: './parc.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class ParcComponent implements AfterViewInit {
  voitures: any[] = [];

  constructor(private vehiculeService: VehiculeService) {}

  statutClass(v: any): string {
    const s = (v.statut || '').toUpperCase();
    if (s === 'DISPONIBLE') return 'available';
    if (s === 'MAINTENANCE') return 'maintenance';
    return 'rented';
  }

  statutLabel(v: any): string {
    const s = (v.statut || '').toUpperCase();
    if (s === 'DISPONIBLE') return 'Disponible';
    if (s === 'MAINTENANCE') return 'Maintenance';
    return 'Louée';
  }

  deleteVehicule(id: number): void {
    if (!confirm('Supprimer ce v\u00e9hicule ? Cette action est irr\u00e9versible.')) return;
    this.vehiculeService.delete(id).subscribe({
      next: () => {
        this.voitures = this.voitures.filter(v => v.id !== id);
        const active = (document.querySelector('.filter-btn.active') as HTMLElement)?.dataset['filter'] || 'all';
        const search = (document.getElementById('parc-search') as HTMLInputElement)?.value.trim().toLowerCase() || '';
        this.renderCards(active, search);
      },
      error: () => alert('Erreur lors de la suppression du v\u00e9hicule.')
    });
  }

  ngAfterViewInit(): void {
    this.loadVehicules();

    (window as any)['deleteVehicule'] = (id: number) => this.deleteVehicule(id);

    (window as any)['filterParc'] = (filter: string) => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      const btn = document.getElementById(`fp-${filter}`);
      if (btn) btn.classList.add('active');
      this.renderCards(filter);
    };

    const searchInput = document.getElementById('parc-search') as HTMLInputElement;
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        this.renderCards(
          (document.querySelector('.filter-btn.active') as HTMLElement)?.dataset['filter'] || 'all',
          searchInput.value.trim().toLowerCase()
        );
      });
    }
  }

  private loadVehicules(): void {
    const grid = document.getElementById('parc-grid');
    if (grid) grid.innerHTML = `<div class="parc-empty">Chargement...</div>`;

    this.vehiculeService.getAll().subscribe({
      next: (data) => {
        this.voitures = data;
        this.renderCards('all');
      },
      error: () => {
        if (grid) grid.innerHTML = `<div class="parc-empty">Erreur de chargement du parc.</div>`;
      }
    });
  }

  renderCards(filter: string, search: string = ''): void {
    const grid = document.getElementById('parc-grid');
    if (!grid) return;

    let list = [...this.voitures];
    if (filter !== 'all') list = list.filter(v => this.statutClass(v) === filter);
    if (search) list = list.filter(v =>
      (v.marque + ' ' + v.modele).toLowerCase().includes(search) ||
      (v.matricule || '').toLowerCase().includes(search)
    );

    if (list.length === 0) {
      grid.innerHTML = `<div class="parc-empty">Aucun véhicule trouvé.</div>`;
      return;
    }

    grid.innerHTML = list.map(v => {
      const sc    = this.statutClass(v);
      const sl    = this.statutLabel(v);
      const nom   = `${v.marque} ${v.modele}`;
      const color = getBrandColor(v.marque);
      const badge = getBrandBadge(v.marque);
      return `
        <div class="car-card">
          <div class="car-photo" style="background: linear-gradient(135deg, ${color}33, ${color}11);">
            <div class="car-brand-badge" style="background:${color}22; border-color:${color}55; color:${color};">${badge}</div>
            <svg class="car-svg" viewBox="0 0 80 36" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 26h64M12 26V18l8-10h20l10 10h10v8" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <rect x="20" y="8" width="18" height="9" rx="2" fill="${color}33" stroke="${color}" stroke-width="1.5"/>
              <rect x="40" y="8" width="8" height="9" rx="1" fill="${color}33" stroke="${color}" stroke-width="1.5"/>
              <circle cx="20" cy="27" r="5" fill="#080f20" stroke="${color}" stroke-width="2"/>
              <circle cx="60" cy="27" r="5" fill="#080f20" stroke="${color}" stroke-width="2"/>
              <circle cx="20" cy="27" r="2" fill="${color}"/>
              <circle cx="60" cy="27" r="2" fill="${color}"/>
            </svg>
          </div>
          <div class="car-info">
            <div class="car-name">${nom}</div>
            <div class="car-plate-tag">${v.matricule}</div>
            <span class="badge ${sc}">${sl}</span>
          </div>
          <div class="car-actions">
            <button class="btn-delete-car" onclick="deleteVehicule(${v.id})" title="Supprimer">
              <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><polyline points="3 6 5 6 21 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M19 6l-1 14H6L5 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M10 11v6M14 11v6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M9 6V4h6v2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
              Supprimer
            </button>
          </div>
        </div>`;
    }).join('');
  }
}
