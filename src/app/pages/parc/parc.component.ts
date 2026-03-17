import { Component, AfterViewInit, ViewEncapsulation } from '@angular/core';
import { SidebarComponent } from '../../shared/sidebar.component';
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
  imports: [SidebarComponent],
  templateUrl: './parc.component.html',
  styleUrl: './parc.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class ParcComponent implements AfterViewInit {
  voitures: any[] = [];
  private editingId: number | null = null;

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
    if (!confirm('Supprimer ce véhicule ? Cette action est irréversible.')) return;
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
  openEditModal(id: number): void {
    const v = this.voitures.find(x => x.id === id);
    if (!v) return;
    this.editingId = id;
    (document.getElementById('pe-marque') as HTMLInputElement).value = v.marque || '';
    (document.getElementById('pe-modele') as HTMLInputElement).value = v.modele || '';
    (document.getElementById('pe-matriculeWW') as HTMLInputElement).value = v.matriculeWW || '';
    (document.getElementById('pe-matricule') as HTMLInputElement).value = v.matricule || '';
    (document.getElementById('pe-dateCirculation') as HTMLInputElement).value = v.dateCirculation ? v.dateCirculation.toString().substring(0, 10) : '';
    (document.getElementById('pe-statut') as HTMLSelectElement).value = v.statut || 'DISPONIBLE';
    document.getElementById('parc-edit-modal')?.classList.add('open');
  }

  closeEditModal(): void {
    document.getElementById('parc-edit-modal')?.classList.remove('open');
    this.editingId = null;
  }

  saveEdit(): void {
    if (!this.editingId) return;
    const get = (id: string) => (document.getElementById(id) as HTMLInputElement | HTMLSelectElement).value.trim();
    const matriculeWW = get('pe-matriculeWW').toUpperCase();
    const matricule   = get('pe-matricule').toUpperCase();
    if (!matriculeWW) { alert('Le matricule WW est obligatoire.'); return; }
    const orig = this.voitures.find(v => v.id === this.editingId);
    const body: any = {
      marque: get('pe-marque') || 'Autre',
      modele: get('pe-modele'),
      matriculeWW,
      statut: get('pe-statut'),
      couleur: orig?.couleur || 'Non spécifié',
      dateCirculation: get('pe-dateCirculation') || orig?.dateCirculation || null,
      carburant: orig?.carburant || 'Essence',
    };
    if (matricule) body.matricule = matricule;
    this.vehiculeService.update(this.editingId, body).subscribe({
      next: (updated) => {
        const idx = this.voitures.findIndex(v => v.id === this.editingId);
        if (idx >= 0) this.voitures[idx] = updated;
        this.closeEditModal();
        const active = (document.querySelector('.filter-btn.active') as HTMLElement)?.dataset['filter'] || 'all';
        const search = (document.getElementById('parc-search') as HTMLInputElement)?.value.trim().toLowerCase() || '';
        this.renderCards(active, search);
      },
      error: (err) => alert(err.error?.message || 'Erreur lors de la modification.')
    });
  }
  ngAfterViewInit(): void {
    this.loadVehicules();

    (window as any)['deleteVehicule']    = (id: number) => this.deleteVehicule(id);
    (window as any)['parcEditVehicule']  = (id: number) => this.openEditModal(id);
    (window as any)['parcCloseEdit']     = () => this.closeEditModal();
    (window as any)['parcSaveEdit']      = () => this.saveEdit();

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

    document.getElementById('parc-edit-modal')?.addEventListener('click', (e) => {
      if ((e.target as Element).id === 'parc-edit-modal') this.closeEditModal();
    });
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
      (v.matricule || '').toLowerCase().includes(search) ||
      (v.matriculeWW || '').toLowerCase().includes(search)
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
            ${v.matricule
              ? `<div class="car-plate-tag">${v.matricule}</div>`
              : `<div class="car-plate-tag" style="color:#ff8c42;border-color:rgba(255,140,66,.3);background:rgba(255,140,66,.07);">${v.matriculeWW || '—'} <span class="badge-ww">WW</span></div>`
            }
            ${v.dateCirculation ? `<div class="car-annee"><svg viewBox="0 0 24 24" fill="none" width="11" height="11"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg> Mise en circulation : ${new Date(v.dateCirculation).toLocaleDateString('fr-FR')}</div>` : ''}
            <span class="badge ${sc}">${sl}</span>
          </div>
          <div class="car-actions">
            <button class="btn-edit-car" onclick="parcEditVehicule(${v.id})" title="Modifier">
              <svg viewBox="0 0 24 24" fill="none" width="13" height="13"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="1.5"/></svg>
              Modifier
            </button>
            <button class="btn-delete-car" onclick="deleteVehicule(${v.id})" title="Supprimer">
              <svg viewBox="0 0 24 24" fill="none" width="13" height="13"><polyline points="3 6 5 6 21 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M19 6l-1 14H6L5 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M10 11v6M14 11v6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M9 6V4h6v2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
              Supprimer
            </button>
          </div>
        </div>`;
    }).join('');
  }
}
