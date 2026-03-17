import { Component, AfterViewInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../shared/sidebar.component';
import { VisiteTechniqueService } from '../../core/services/visite-technique.service';
import { VehiculeService } from '../../core/services/vehicule.service';

interface VisiteEntry {
  id: number;
  marque: string;
  modele: string;
  matricule: string;
  dateVisite: string;
  dateVisiteIso: string;
  dateVisiteObj: Date;
  dateProchaine: string;
  dateProchaineIso: string;
  dateProchaineObj: Date;
  montant: number;
}

@Component({
  selector: 'app-visite-technique',
  standalone: true,
  imports: [CommonModule, SidebarComponent],
  templateUrl: './visite-technique.component.html',
  styleUrls: ['./visite-technique.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class VisiteTechniqueComponent implements AfterViewInit {

  today = new Date();
  today00 = new Date(this.today.getFullYear(), this.today.getMonth(), this.today.getDate());

  entries: VisiteEntry[] = [];
  filteredEntries: VisiteEntry[] = [];
  vehicles: any[] = [];
  currentIndex = -1;
  totalMontant = 0;

  constructor(
    private vtService: VisiteTechniqueService,
    private vehiculeService: VehiculeService
  ) {}

  private isoToFr(iso: string): string {
    if (!iso) return '';
    const [y, m, d] = iso.split('T')[0].split('-');
    return `${d}/${m}/${y}`;
  }

  private parseDate(iso: string): Date {
    const [y, m, d] = iso.split('T')[0].split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  isUrgent(d: Date): boolean {
    const diff = Math.ceil((d.getTime() - this.today00.getTime()) / 86400000);
    return diff >= 0 && diff < 10;
  }

  daysUntil(d: Date): number {
    return Math.ceil((d.getTime() - this.today00.getTime()) / 86400000);
  }

  loadAll() {
    this.vtService.getAll().subscribe({
      next: (data: any[]) => {
        this.entries = data.map(r => {
          const dpIso = (r.dateProchaineVisite ?? '').split('T')[0];
          const dvIso = r.dateVisite ? String(r.dateVisite).split('T')[0] : '';
          return {
            id: r.id,
            marque: r.marque ?? '',
            modele: r.modele ?? '',
            matricule: r.matricule ?? '',
            dateVisite: dvIso ? this.isoToFr(dvIso) : '',
            dateVisiteIso: dvIso,
            dateVisiteObj: dvIso ? this.parseDate(dvIso) : new Date(0),
            dateProchaine: this.isoToFr(dpIso),
            dateProchaineIso: dpIso,
            dateProchaineObj: this.parseDate(dpIso),
            montant: Number(r.montant ?? 0),
          };
        });
        this.entries.sort((a, b) => a.dateProchaineObj.getTime() - b.dateProchaineObj.getTime());
        this.renderNotifications();
        this.updateCountBadge();
        this.applyFilters();
      },
      error: () => { this.filteredEntries = []; this.renderTable(); }
    });
  }

  loadVehicules() {
    this.vehiculeService.getAll().subscribe({
      next: (data: any[]) => {
        this.vehicles = data;
        this.populateSelects();
      }
    });
  }

  applyFilters() {
    const monthEl = document.getElementById('filter-month') as HTMLInputElement;
    const vehiculeEl = document.getElementById('filter-vehicule') as HTMLSelectElement;
    const month = monthEl?.value ?? '';
    const vehicule = vehiculeEl?.value ?? '';

    let filtered = [...this.entries];
    if (month) {
      filtered = filtered.filter(v => v.dateVisiteIso.startsWith(month));
    }
    if (vehicule) {
      filtered = filtered.filter(v => v.matricule === vehicule);
    }

    this.filteredEntries = filtered.sort((a, b) =>
      a.dateProchaineObj.getTime() - b.dateProchaineObj.getTime()
    );

    this.totalMontant = this.filteredEntries.reduce((sum, v) => sum + v.montant, 0);
    this.populateVehiculeFilter(vehicule);
    this.renderTotal();
    this.renderTable();
  }

  resetFilters() {
    const monthEl = document.getElementById('filter-month') as HTMLInputElement;
    const vehiculeEl = document.getElementById('filter-vehicule') as HTMLSelectElement;
    if (monthEl) monthEl.value = '';
    if (vehiculeEl) vehiculeEl.value = '';
    this.applyFilters();
  }

  populateVehiculeFilter(selectedValue?: string) {
    const sel = document.getElementById('filter-vehicule') as HTMLSelectElement;
    if (!sel) return;
    const seen = new Set<string>();
    const opts = this.entries
      .filter(v => v.matricule && !seen.has(v.matricule) && !!seen.add(v.matricule))
      .map(v => `<option value="${v.matricule}"${v.matricule === selectedValue ? ' selected' : ''}>` +
        `${v.marque} ${v.modele} — ${v.matricule}</option>`)
      .join('');
    sel.innerHTML = '<option value="">— Tous les véhicules —</option>' + opts;
  }

  renderTotal() {
    const el = document.getElementById('vt-total');
    if (!el) return;
    const n = this.filteredEntries.length;
    const total = this.totalMontant.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    el.innerHTML = `
      <div class="total-icon">
        <svg viewBox="0 0 24 24" fill="none" width="22" height="22"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
      </div>
      <div class="total-body">
        <span class="total-label">Total des dépenses</span>
        <span class="total-amount">${total} <span class="total-currency">DH</span></span>
      </div>
      <span class="total-count">${n} visite${n !== 1 ? 's' : ''}</span>
    `;
  }

  updateCountBadge() {
    const el = document.getElementById('vt-count-badge');
    if (el) el.textContent = `${this.entries.length} visite(s)`;
  }

  renderNotifications() {
    const urgent = this.entries.filter(v => this.isUrgent(v.dateProchaineObj));
    const badge = document.getElementById('vt-notif-badge');
    if (badge) badge.textContent = urgent.length.toString();
    const box = document.getElementById('vt-notif-container');
    if (!box) return;
    if (urgent.length === 0) {
      box.innerHTML = '<p class="no-notif">Aucune visite technique imminente (moins de 10 jours).</p>';
    } else {
      box.innerHTML = urgent.map(v => {
        const days = this.daysUntil(v.dateProchaineObj);
        const jourSemaine = v.dateProchaineObj.toLocaleDateString('fr-FR', { weekday: 'long' });
        const jourSemaineCap = jourSemaine.charAt(0).toUpperCase() + jourSemaine.slice(1);
        const moisAnnee = v.dateProchaineObj.toLocaleDateString('fr-FR', { month: '2-digit', year: 'numeric' });
        const dateLabel = `${jourSemaineCap} ${moisAnnee}`;
        return `
          <div class="notif-item">
            <div class="notif-alert-icon">
              <svg viewBox="0 0 24 24" fill="none"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="currentColor" stroke-width="1.5"/><line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="12" cy="17" r="0.5" fill="currentColor" stroke="currentColor" stroke-width="1"/></svg>
            </div>
            <div class="notif-body">
              <span class="notif-name">${v.marque} ${v.modele}${v.matricule ? ' — ' + v.matricule : ''}</span>
              <span class="notif-detail">${v.montant.toLocaleString('fr-FR')} DH</span>
            </div>
            <span class="notif-date-label">${dateLabel}</span>
            <span class="notif-days">${days}J</span>
          </div>
        `;
      }).join('');
    }
  }

  renderTable() {
    const tbody = document.getElementById('vt-tbody');
    if (!tbody) return;
    if (this.filteredEntries.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="loading-row">Aucune visite technique enregistrée.</td></tr>';
      return;
    }
    tbody.innerHTML = this.filteredEntries.map(v => {
      const urgent = this.isUrgent(v.dateProchaineObj);
      const days = this.daysUntil(v.dateProchaineObj);
      const statusHtml = urgent
        ? `<span class="badge-urgent">${days}J</span>`
        : `<span class="badge-ok">${days}J</span>`;
      const realIdx = this.entries.indexOf(v);
      return `
        <tr class="${urgent ? 'row-urgent' : ''}">
          <td class="nom-cell">${v.marque}</td>
          <td class="nom-cell">${v.modele}</td>
          <td>${v.matricule ? '<span class="plate">' + v.matricule + '</span>' : '—'}</td>
          <td class="date-cell">${v.dateVisite || '<span class="text-muted">—</span>'}</td>
          <td class="date-cell">${v.dateProchaine}</td>
          <td class="montant-cell">${v.montant.toLocaleString('fr-FR')} DH</td>
          <td>${statusHtml}</td>
          <td class="actions-cell">
            <button class="btn-edit" onclick="openVTModal(${realIdx})">
              <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
              Modifier
            </button>
            <button class="btn-delete" onclick="deleteVT(${v.id})">
              <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><polyline points="3 6 5 6 21 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M19 6l-1 14H6L5 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M10 11v6M14 11v6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M9 6V4h6v2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
              Supprimer
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  showToast(msg: string) {
    const toast = document.getElementById('vt-toast');
    const msgEl = document.getElementById('vt-toast-msg');
    if (!toast) return;
    if (msgEl) msgEl.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
  }

  openAddModal() {
    const today = this.today.toISOString().split('T')[0];
    const addSel = document.getElementById('add-vehiculeId') as HTMLSelectElement;
    if (addSel) addSel.value = '';
    (document.getElementById('add-date-visite') as HTMLInputElement).value = today;
    (document.getElementById('add-date') as HTMLInputElement).value = '';
    (document.getElementById('add-montant') as HTMLInputElement).value = '';
    const err = document.getElementById('add-error');
    if (err) { err.style.display = 'none'; err.textContent = ''; }
    document.getElementById('vt-add-modal')?.classList.add('open');
  }

  closeAddModal() {
    document.getElementById('vt-add-modal')?.classList.remove('open');
  }

  saveAddModal() {
    const addSel = document.getElementById('add-vehiculeId') as HTMLSelectElement;
    const vehiculeId = addSel?.value;
    const selectedOpt = addSel?.selectedOptions[0];
    const marque    = selectedOpt?.dataset['marque'] ?? '';
    const modele    = selectedOpt?.dataset['modele'] ?? '';
    const matricule = selectedOpt?.dataset['matricule'] ?? '';
    const dateVisite = (document.getElementById('add-date-visite') as HTMLInputElement).value;
    const dateProch  = (document.getElementById('add-date') as HTMLInputElement).value;
    const montant    = parseFloat((document.getElementById('add-montant') as HTMLInputElement).value);
    const err = document.getElementById('add-error');

    if (!vehiculeId || !dateVisite || !dateProch || isNaN(montant) || montant < 0) {
      if (err) { err.textContent = 'Veuillez remplir tous les champs obligatoires.'; err.style.display = 'block'; }
      return;
    }

    this.vtService.create({ marque, modele, matricule, dateVisite, dateProchaineVisite: dateProch, montant }).subscribe({
      next: () => {
        this.closeAddModal();
        this.loadAll();
        this.showToast('Visite technique ajout\u00e9e avec succ\u00e8s');
      },
      error: () => {
        if (err) { err.textContent = "Erreur lors de l'enregistrement."; err.style.display = 'block'; }
      }
    });
  }

  populateSelects(selectedMarque?: string, selectedModele?: string) {
    const opts = this.vehicles.map(v =>
      `<option value="${v.id}" data-marque="${v.marque}" data-modele="${v.modele}" data-matricule="${v.matricule ?? ''}">${v.marque} ${v.modele}${v.matricule ? ' — ' + v.matricule : ''}</option>`
    ).join('');
    const addSel = document.getElementById('add-vehiculeId') as HTMLSelectElement;
    const editSel = document.getElementById('edit-vehiculeId') as HTMLSelectElement;
    const placeholder = '<option value="">-- S\u00e9lectionner un v\u00e9hicule --</option>';
    if (addSel) addSel.innerHTML = placeholder + opts;
    if (editSel) editSel.innerHTML = placeholder + opts;
    if (editSel && selectedMarque && selectedModele) {
      const match = this.vehicles.find(v => v.marque === selectedMarque && v.modele === selectedModele);
      if (match) editSel.value = String(match.id);
    }
  }

  openModal(index: number) {
    this.currentIndex = index;
    const v = this.entries[index];
    const modal = document.getElementById('vt-modal');
    if (!modal) return;
    this.populateSelects(v.marque, v.modele);
    (document.getElementById('edit-date-visite') as HTMLInputElement).value = v.dateVisiteIso;
    (document.getElementById('vt-modal-date') as HTMLInputElement).value = v.dateProchaineIso;
    (document.getElementById('vt-modal-montant') as HTMLInputElement).value = String(v.montant);
    modal.classList.add('open');
  }

  closeModal() {
    document.getElementById('vt-modal')?.classList.remove('open');
    this.currentIndex = -1;
  }

  saveModal() {
    if (this.currentIndex < 0) return;
    const editSel = document.getElementById('edit-vehiculeId') as HTMLSelectElement;
    const vehiculeId = editSel?.value;
    const selectedOpt = editSel?.selectedOptions[0];
    const marque    = selectedOpt?.dataset['marque'] ?? '';
    const modele    = selectedOpt?.dataset['modele'] ?? '';
    const matricule = selectedOpt?.dataset['matricule'] ?? '';
    const dateVisite = (document.getElementById('edit-date-visite') as HTMLInputElement).value;
    const dateProch  = (document.getElementById('vt-modal-date') as HTMLInputElement).value;
    const montant    = parseFloat((document.getElementById('vt-modal-montant') as HTMLInputElement).value);
    if (!vehiculeId || !dateProch || isNaN(montant)) return;

    const v = this.entries[this.currentIndex];
    this.vtService.update(v.id, { marque, modele, matricule, dateVisite: dateVisite || null, dateProchaineVisite: dateProch, montant }).subscribe({
      next: () => {
        this.closeModal();
        this.loadAll();
        this.showToast('Visite technique mise \u00e0 jour avec succ\u00e8s');
      },
      error: () => this.closeModal()
    });
  }

  deleteEntry(id: number) {
    if (!confirm('Supprimer cette visite technique ?')) return;
    this.vtService.delete(id).subscribe({
      next: () => {
        this.loadAll();
        this.showToast('Visite technique supprim\u00e9e');
      }
    });
  }

  ngAfterViewInit() {
    (window as any)['vtAddOpen']     = () => this.openAddModal();
    (window as any)['vtAddClose']    = () => this.closeAddModal();
    (window as any)['vtAddSave']     = () => this.saveAddModal();
    (window as any)['openVTModal']   = (i: number) => this.openModal(i);
    (window as any)['closeVTModal']  = () => this.closeModal();
    (window as any)['saveVTModal']   = () => this.saveModal();
    (window as any)['deleteVT']      = (id: number) => this.deleteEntry(id);
    (window as any)['vtApplyFilter'] = () => this.applyFilters();
    (window as any)['vtResetFilter'] = () => this.resetFilters();

    document.getElementById('vt-add-modal')?.addEventListener('click', (e) => {
      if ((e.target as Element).id === 'vt-add-modal') this.closeAddModal();
    });
    document.getElementById('vt-modal')?.addEventListener('click', (e) => {
      if ((e.target as Element).id === 'vt-modal') this.closeModal();
    });

    setTimeout(() => this.loadAll(), 0);
    this.loadVehicules();
  }
}
