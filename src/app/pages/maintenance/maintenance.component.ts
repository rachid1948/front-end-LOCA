import { Component, AfterViewInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../shared/sidebar.component';
import { MaintenanceService } from '../../core/services/maintenance.service';
import { VehiculeService } from '../../core/services/vehicule.service';

type TypeMaintenance = 'Vidange' | 'Tôlerie' | 'Mécanique' | 'Pneumatique' | 'Électrique';

interface MaintenanceRecord {
  id: number;
  vehiculeId: number;
  marque: string;
  matricule: string;
  type: TypeMaintenance;
  description: string;
  date: string;
  montant: number;
  kilometrage: number;
}

@Component({
  selector: 'app-maintenance',
  standalone: true,
  imports: [CommonModule, SidebarComponent],
  templateUrl: './maintenance.component.html',
  styleUrl: './maintenance.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class MaintenanceComponent implements AfterViewInit {

  filterMode: 'all' | 'type' | 'vehicule' = 'all';
  filterType: TypeMaintenance | '' = '';
  searchVehicule = '';
  editingId = -1;
  nextId = 22;

  types: TypeMaintenance[] = ['Vidange', 'Tôlerie', 'Mécanique', 'Pneumatique', 'Électrique'];

  records: MaintenanceRecord[] = [];

  private readonly ENUM_TO_TYPE: Record<string, TypeMaintenance> = {
    'VIDANGE': 'Vidange', 'TOLERIE': 'Tôlerie', 'MECANIQUE': 'Mécanique',
    'PNEUMATIQUE': 'Pneumatique', 'ELECTRIQUE': 'Électrique', 'VISITE_TECHNIQUE': 'Vidange'
  };
  private readonly TYPE_TO_ENUM: Record<string, string> = {
    'Vidange': 'VIDANGE', 'Tôlerie': 'TOLERIE', 'Mécanique': 'MECANIQUE',
    'Pneumatique': 'PNEUMATIQUE', 'Électrique': 'ELECTRIQUE'
  };

  constructor(private maintenanceService: MaintenanceService, private vehiculeService: VehiculeService) {}

  private isoToFr(iso: string): string {
    if (!iso) return '';
    const [y, m, d] = iso.split('T')[0].split('-');
    return `${d}/${m}/${y}`;
  }

  private mapFromBackend(m: any): MaintenanceRecord {
    return {
      id: m.id,
      vehiculeId: m.vehiculeId,
      marque: `${m.vehiculeMarque ?? ''} ${m.vehiculeModele ?? ''}`.trim(),
      matricule: m.matricule ?? '',
      type: this.ENUM_TO_TYPE[m.type] ?? 'Vidange',
      description: m.description ?? '',
      date: this.isoToFr(m.date),
      montant: m.cout ?? 0,
      kilometrage: m.kilometrage ?? 0,
    };
  }

  loadAll() {
    this.maintenanceService.getAll().subscribe({
      next: (data: any[]) => {
        this.records = data.map(m => this.mapFromBackend(m));
        this.renderAll();
      },
      error: () => this.renderAll()
    });
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────
  fmt(n: number): string { return n.toLocaleString('fr-FR') + ' DH'; }

  typeColor(t: TypeMaintenance): string {
    const map: Record<TypeMaintenance, string> = {
      'Vidange':     'badge-vidange',
      'Tôlerie':     'badge-tolerie',
      'Mécanique':   'badge-meca',
      'Pneumatique': 'badge-pneu',
      'Électrique':  'badge-elec',
    };
    return map[t] ?? '';
  }

  // ─── Filtered data ────────────────────────────────────────────────────────────
  get filtered(): MaintenanceRecord[] {
    return this.records.filter(r => {
      if (this.filterMode === 'type' && this.filterType) return r.type === this.filterType;
      if (this.filterMode === 'vehicule' && this.searchVehicule) {
        const q = this.searchVehicule.toLowerCase();
        return r.marque.toLowerCase().includes(q) || r.matricule.toLowerCase().includes(q);
      }
      return true;
    }).sort((a, b) => {
      const parseD = (d: string) => { const [dd, mm, yy] = d.split('/'); return new Date(`${yy}-${mm}-${dd}`).getTime(); };
      return parseD(b.date) - parseD(a.date);
    });
  }

  get totalMontant(): number { return this.filtered.reduce((s, r) => s + r.montant, 0); }

  // ─── Group summaries (for cards) ─────────────────────────────────────────────
  get groupedByType(): { type: string; count: number; montant: number }[] {
    const map = new Map<string, { count: number; montant: number }>();
    this.filtered.forEach(r => {
      const cur = map.get(r.type) ?? { count: 0, montant: 0 };
      map.set(r.type, { count: cur.count + 1, montant: cur.montant + r.montant });
    });
    return Array.from(map.entries()).map(([type, v]) => ({ type, ...v }))
      .sort((a, b) => b.montant - a.montant);
  }

  get groupedByVehicule(): { key: string; marque: string; matricule: string; count: number; montant: number }[] {
    const map = new Map<string, { marque: string; matricule: string; count: number; montant: number }>();
    this.filtered.forEach(r => {
      const key = r.matricule;
      const cur = map.get(key) ?? { marque: r.marque, matricule: r.matricule, count: 0, montant: 0 };
      map.set(key, { ...cur, count: cur.count + 1, montant: cur.montant + r.montant });
    });
    return Array.from(map.entries()).map(([key, v]) => ({ key, ...v }))
      .sort((a, b) => b.montant - a.montant);
  }

  // ─── Render ───────────────────────────────────────────────────────────────────
  renderAll() { this.renderCards(); this.renderTable(); }

  renderCards() {
    const set = (id: string, v: string) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('mnt-total',  this.fmt(this.totalMontant));
    set('mnt-count',  this.filtered.length + ' interv.');
    set('mnt-badge-count',  this.filtered.length + ' intervention' + (this.filtered.length > 1 ? 's' : ''));
    set('mnt-badge-count2', this.filtered.length + ' intervention' + (this.filtered.length > 1 ? 's' : ''));
    set('mnt-total2', this.fmt(this.totalMontant));

    const sumEl = document.getElementById('mnt-summary');
    if (!sumEl) return;

    if (this.filterMode === 'type') {
      sumEl.innerHTML = this.groupedByType.map(g => `
        <div class="sum-row">
          <span class="sum-row-type"><span class="${this.typeColor(g.type as TypeMaintenance)}">${g.type}</span></span>
          <span class="sum-row-count">${g.count} interv.</span>
          <span class="sum-row-amt">${this.fmt(g.montant)}</span>
        </div>`).join('');
    } else if (this.filterMode === 'vehicule') {
      sumEl.innerHTML = this.groupedByVehicule.map(g => `
        <div class="sum-row">
          <span class="sum-row-car"><strong>${g.marque}</strong> <span class="plate-sm">${g.matricule}</span></span>
          <span class="sum-row-count">${g.count} interv.</span>
          <span class="sum-row-amt">${this.fmt(g.montant)}</span>
        </div>`).join('');
    } else {
      sumEl.innerHTML = this.groupedByType.map(g => `
        <div class="sum-row">
          <span class="sum-row-type"><span class="${this.typeColor(g.type as TypeMaintenance)}">${g.type}</span></span>
          <span class="sum-row-count">${g.count} interv.</span>
          <span class="sum-row-amt">${this.fmt(g.montant)}</span>
        </div>`).join('');
    }
  }

  renderTable() {
    const tbody = document.getElementById('mnt-tbody');
    if (!tbody) return;
    if (this.filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="empty-row">Aucun résultat pour ce filtre</td></tr>`;
      return;
    }
    tbody.innerHTML = this.filtered.map(r => `
      <tr>
        <td class="marque-cell">${r.marque}</td>
        <td><span class="plate">${r.matricule}</span></td>
        <td><span class="${this.typeColor(r.type)}">${r.type}</span></td>
        <td class="desc-cell">${r.description}</td>
        <td class="date-cell">${r.date}</td>
        <td class="montant-cell">${this.fmt(r.montant)}</td>
        <td class="actions-cell">
          <button class="btn-edit" onclick="mntEdit(${r.id})">
            <svg viewBox="0 0 24 24" fill="none" width="13" height="13"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            Modifier
          </button>
          <button class="btn-del" onclick="mntDel(${r.id})">
            <svg viewBox="0 0 24 24" fill="none" width="13" height="13"><polyline points="3 6 5 6 21 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M19 6l-1 14H6L5 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 11v6M14 11v6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M9 6V4h6v2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            Supprimer
          </button>
        </td>
      </tr>`).join('');
  }

  // ─── Filter logic ─────────────────────────────────────────────────────────────
  setMode(mode: string) {
    this.filterMode = mode as any;
    this.filterType = '';
    this.searchVehicule = '';
    const inp = document.getElementById('mnt-search') as HTMLInputElement;
    if (inp) inp.value = '';

    ['all', 'type', 'vehicule'].forEach(m => {
      document.getElementById(`mnt-mode-${m}`)?.classList.toggle('active', m === mode);
    });

    const typePanel   = document.getElementById('mnt-type-panel');
    const searchPanel = document.getElementById('mnt-search-panel');
    if (typePanel)   typePanel.style.display   = mode === 'type'     ? 'flex' : 'none';
    if (searchPanel) searchPanel.style.display = mode === 'vehicule' ? 'flex' : 'none';

    this.renderAll();
  }

  selectType(t: string) {
    this.filterType = t as TypeMaintenance;
    document.querySelectorAll('.type-chip').forEach(el =>
      el.classList.toggle('active', el.getAttribute('data-type') === t)
    );
    this.renderAll();
  }

  applySearch(v: string) { this.searchVehicule = v; this.renderAll(); }

  resetFilters() {
    const inp = document.getElementById('mnt-search') as HTMLInputElement;
    if (inp) inp.value = '';
    this.setMode('all');
  }

  // ─── Add Modal ────────────────────────────────────────────────────────────────
  openAddModal() {
    const today = new Date().toISOString().split('T')[0];
    (document.getElementById('add-date') as HTMLInputElement).value = today;
    (document.getElementById('add-montant') as HTMLInputElement).value = '';
    (document.getElementById('add-desc') as HTMLInputElement).value = '';
    (document.getElementById('add-km') as HTMLInputElement).value = '';
    (document.getElementById('add-type') as HTMLSelectElement).value = 'VIDANGE';
    const errEl = document.getElementById('add-error');
    if (errEl) errEl.style.display = 'none';

    // Charger la liste des véhicules
    const select = document.getElementById('add-vehiculeId') as HTMLSelectElement;
    select.innerHTML = '<option value="" disabled selected>Chargement...</option>';
    this.vehiculeService.getAll().subscribe({
      next: (vehicules) => {
        select.innerHTML = '<option value="" disabled selected>Sélectionner un véhicule</option>' +
          vehicules.map(v => `<option value="${v.id}">${v.marque} ${v.modele} — ${v.matricule}</option>`).join('');
      },
      error: () => { select.innerHTML = '<option value="" disabled>Erreur de chargement</option>'; }
    });

    document.getElementById('mnt-add-modal')?.classList.add('open');
  }

  closeAddModal() {
    document.getElementById('mnt-add-modal')?.classList.remove('open');
  }

  saveAdd() {
    const vehiculeId = parseInt((document.getElementById('add-vehiculeId') as HTMLSelectElement).value, 10);
    const type       = (document.getElementById('add-type')     as HTMLSelectElement).value;
    const date       = (document.getElementById('add-date')     as HTMLInputElement).value;
    const montant    = parseFloat((document.getElementById('add-montant') as HTMLInputElement).value);
    const desc       = (document.getElementById('add-desc')     as HTMLInputElement).value.trim();
    const km         = parseInt((document.getElementById('add-km') as HTMLInputElement).value, 10) || 0;

    const errEl = document.getElementById('add-error');
    if (!vehiculeId || !type || !date || isNaN(montant)) {
      if (errEl) { errEl.textContent = 'Veuillez remplir tous les champs obligatoires.'; errEl.style.display = 'block'; }
      return;
    }

    const body = { vehiculeId, type, description: desc, cout: montant, date, kilometrage: km };
    const btn = document.querySelector('#mnt-add-modal .modal-btn-save') as HTMLButtonElement;
    if (btn) btn.disabled = true;

    this.maintenanceService.create(body).subscribe({
      next: () => {
        this.closeAddModal();
        this.showToast('Intervention ajoutée avec succès');
        this.loadAll();
      },
      error: (err) => {
        const msg = err.error?.message || 'Erreur lors de l\'enregistrement.';
        if (errEl) { errEl.textContent = msg; errEl.style.display = 'block'; }
        if (btn) btn.disabled = false;
      }
    });
  }

  // ─── Edit / Delete ─────────────────────────────────────────────────────────────
  openEditModal(id: number) {
    const r = this.records.find(x => x.id === id);
    if (!r) return;
    this.editingId = id;
    const toISO = (d: string) => { const [dd, mm, yy] = d.split('/'); return `${yy}-${mm}-${dd}`; };
    (document.getElementById('ed-marque')   as HTMLInputElement).value   = r.marque;
    (document.getElementById('ed-matricule') as HTMLInputElement).value  = r.matricule;
    (document.getElementById('ed-type')     as HTMLSelectElement).value  = r.type;
    (document.getElementById('ed-desc')     as HTMLInputElement).value   = r.description;
    (document.getElementById('ed-date')     as HTMLInputElement).value   = toISO(r.date);
    (document.getElementById('ed-montant')  as HTMLInputElement).value   = r.montant.toString();
    document.getElementById('mnt-modal')?.classList.add('open');
  }

  saveEdit() {
    const r = this.records.find(x => x.id === this.editingId);
    if (!r) return;
    const typeDisplay = (document.getElementById('ed-type') as HTMLSelectElement).value as TypeMaintenance;
    const dateIso     = (document.getElementById('ed-date') as HTMLInputElement).value;
    const montant     = parseFloat((document.getElementById('ed-montant') as HTMLInputElement).value) || 0;
    const description = (document.getElementById('ed-desc') as HTMLInputElement).value;
    const body = {
      vehiculeId:  r.vehiculeId,
      type:        this.TYPE_TO_ENUM[typeDisplay] ?? 'VIDANGE',
      description,
      cout:        montant,
      date:        dateIso,
      kilometrage: r.kilometrage ?? 0
    };
    this.maintenanceService.update(this.editingId, body).subscribe({
      next: () => { this.closeModal(); this.showToast('Intervention modifiée'); this.loadAll(); },
      error: () => this.showToast('Erreur lors de la modification')
    });
  }

  deleteRecord(id: number) {
    if (!confirm('Supprimer cette intervention ?')) return;
    this.maintenanceService.delete(id).subscribe({
      next: () => { this.showToast('Intervention supprimée'); this.loadAll(); },
      error: () => this.showToast('Erreur lors de la suppression')
    });
  }

  closeModal() {
    document.getElementById('mnt-modal')?.classList.remove('open');
    this.editingId = -1;
  }

  showToast(msg: string) {
    const t = document.getElementById('mnt-toast');
    const tm = document.getElementById('mnt-toast-msg');
    if (!t || !tm) return;
    tm.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
  }

  ngAfterViewInit() {
    (window as any)['mntEdit']    = (id: number) => this.openEditModal(id);
    (window as any)['mntDel']     = (id: number) => this.deleteRecord(id);
    (window as any)['mntSave']    = () => this.saveEdit();
    (window as any)['mntClose']   = () => this.closeModal();
    (window as any)['mntMode']    = (m: string) => this.setMode(m);
    (window as any)['mntType']    = (t: string) => this.selectType(t);
    (window as any)['mntSearch']  = (v: string) => this.applySearch(v);
    (window as any)['mntReset']   = () => this.resetFilters();
    (window as any)['mntAddOpen'] = () => this.openAddModal();
    (window as any)['mntAddClose']= () => this.closeAddModal();
    (window as any)['mntAddSave'] = () => this.saveAdd();

    document.getElementById('mnt-modal')?.addEventListener('click', e => {
      if ((e.target as Element).id === 'mnt-modal') this.closeModal();
    });
    document.getElementById('mnt-add-modal')?.addEventListener('click', e => {
      if ((e.target as Element).id === 'mnt-add-modal') this.closeAddModal();
    });

    this.loadAll();
  }
}
