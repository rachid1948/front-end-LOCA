import { Component, AfterViewInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VignetteService } from '../../core/services/vignette.service';
import { VehiculeService } from '../../core/services/vehicule.service';

interface VignetteRecord {
  id: number;
  marque: string;
  modele: string;
  matricule: string;
  annee: number;
  dateExpiration: string;
  montant: number;
}

@Component({
  selector: 'app-vignette',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './vignette.component.html',
  styleUrl: './vignette.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class VignetteComponent implements AfterViewInit {

  records: VignetteRecord[] = [];
  filteredRecords: VignetteRecord[] = [];
  selectedYear: number = new Date().getFullYear();
  totalMontant: number = 0;
  vehicles: any[] = [];

  editRecord: VignetteRecord | null = null;
  isNewRecord = false;

  constructor(private vignetteService: VignetteService, private vehiculeService: VehiculeService) {}

  ngAfterViewInit(): void {
    this.bindGlobals();
    this.loadAll();
    this.vehiculeService.getAll().subscribe({ next: v => this.vehicles = v });
  }

  private isoToFr(iso: string): string {
    if (!iso) return '';
    const [y, m, d] = iso.split('T')[0].split('-');
    return `${d}/${m}/${y}`;
  }

  private frToIso(fr: string): string {
    if (!fr) return '';
    const [d, m, y] = fr.split('/');
    return `${y}-${m}-${d}`;
  }

  loadAll(): void {
    this.vignetteService.getAll().subscribe({
      next: (data: any[]) => {
        this.records = data.map(r => ({
          id: r.id,
          marque: r.marque ?? '',
          modele: r.modele ?? '',
          matricule: r.matricule ?? '',
          annee: r.annee ?? new Date().getFullYear(),
          dateExpiration: this.isoToFr(r.dateExpiration ?? ''),
          montant: Number(r.montant ?? 0)
        }));
        this.applyFilter();
      },
      error: () => { this.renderTable(); }
    });
  }

  applyFilter(): void {
    this.filteredRecords = this.records.filter(r => r.annee === this.selectedYear);
    this.totalMontant = this.filteredRecords.reduce((s, r) => s + r.montant, 0);
    this.renderTable();
    this.renderTotal();
  }

  private renderTotal(): void {
    const el = document.getElementById('vignette-total');
    if (el) el.textContent = this.totalMontant.toLocaleString('fr-MA') + ' DH';
    const cnt = document.getElementById('vignette-count');
    if (cnt) cnt.textContent = this.filteredRecords.length + ' véhicule(s)';
  }

  private renderTable(): void {
    const tbody = document.getElementById('vignette-tbody');
    if (!tbody) return;
    if (this.filteredRecords.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="empty-row">Aucune vignette pour ${this.selectedYear}</td></tr>`;
      return;
    }
    tbody.innerHTML = this.filteredRecords.map((r, i) => {
      const exp = this.parseDate(r.dateExpiration);
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((exp.getTime() - today.getTime()) / 86400000);
      let badge = '';
      if (diffDays < 0) badge = '<span class="badge badge-exp">Expirée</span>';
      else if (diffDays <= 30) badge = `<span class="badge badge-warn">${diffDays}j</span>`;
      else badge = '<span class="badge badge-ok">Valide</span>';

      return `<tr>
        <td>${i + 1}</td>
        <td>${r.marque} ${r.modele}</td>
        <td><span class="matricule-tag">${r.matricule}</span></td>
        <td>${r.dateExpiration} ${badge}</td>
        <td class="montant-cell">${r.montant.toLocaleString('fr-MA')} DH</td>
        <td class="actions-cell">
          <button class="btn-edit" onclick="vignetteEdit(${r.id})">
            <svg viewBox="0 0 24 24" fill="none"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            Modifier
          </button>
          <button class="btn-del-row" onclick="vignetteDelete(${r.id})">
            <svg viewBox="0 0 24 24" fill="none"><polyline points="3 6 5 6 21 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M10 11v6M14 11v6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            Supprimer
          </button>
        </td>
      </tr>`;
    }).join('');
  }

  private parseDate(fr: string): Date {
    const [d, m, y] = fr.split('/');
    return new Date(`${y}-${m}-${d}`);
  }

  private bindGlobals(): void {
    (window as any)['vignetteOpenNew'] = () => {
      this.editRecord = { id: 0, marque: '', modele: '', matricule: '', annee: this.selectedYear, dateExpiration: '', montant: 0 };
      this.isNewRecord = true;
      this.openModal();
    };

    (window as any)['vignetteEdit'] = (id: number) => {
      const r = this.records.find(x => x.id === id);
      if (!r) return;
      this.editRecord = { ...r };
      this.isNewRecord = false;
      this.openModal();
    };

    (window as any)['vignetteCloseModal'] = () => this.closeModal();

    (window as any)['vignetteSave'] = () => {
      const f = (id: string) => (document.getElementById(id) as HTMLInputElement)?.value ?? '';
      const vehiculeId = (document.getElementById('modal-vehicule') as HTMLSelectElement)?.value;
      const vehicule = this.vehicles.find(v => String(v.id) === vehiculeId);
      if (!vehicule) {
        this.showToast('Sélectionnez un véhicule.', 'error');
        return;
      }
      const body = {
        marque: vehicule.marque ?? '',
        modele: vehicule.modele ?? '',
        matricule: vehicule.matricule ?? '',
        annee: Number(f('modal-annee')) || this.selectedYear,
        dateExpiration: f('modal-date-exp'),
        montant: Number(f('modal-montant')) || 0
      };
      if (!body.dateExpiration) {
        this.showToast('La date d\'expiration est obligatoire.', 'error');
        return;
      }
      const obs = this.isNewRecord
        ? this.vignetteService.create(body)
        : this.vignetteService.update(this.editRecord!.id, body);

      obs.subscribe({
        next: () => { this.closeModal(); this.showToast('Enregistré avec succès.', 'success'); this.loadAll(); },
        error: () => { this.showToast('Erreur lors de l\'enregistrement.', 'error'); }
      });
    };

    (window as any)['vignetteDelete'] = (id: number) => {
      if (!confirm('Supprimer cette vignette ?')) return;
      this.vignetteService.delete(id).subscribe({
        next: () => { this.showToast('Vignette supprimée.', 'success'); this.loadAll(); },
        error: () => { this.showToast('Erreur lors de la suppression.', 'error'); }
      });
    };
  }

  private openModal(): void {
    const modal = document.getElementById('vignette-modal');
    if (!modal || !this.editRecord) return;
    modal.style.display = 'flex';

    const sel = document.getElementById('modal-vehicule') as HTMLSelectElement;
    if (sel) {
      sel.innerHTML = '<option value="">-- Sélectionner un véhicule --</option>' +
        this.vehicles.map(v =>
          `<option value="${v.id}">${v.marque} ${v.modele} &mdash; ${v.matricule}</option>`
        ).join('');
      if (!this.isNewRecord && this.editRecord) {
        const match = this.vehicles.find(v => v.matricule === this.editRecord!.matricule);
        if (match) sel.value = String(match.id);
      }
    }

    const setValue = (id: string, val: string) => {
      const el = document.getElementById(id) as HTMLInputElement;
      if (el) el.value = val;
    };
    setValue('modal-annee', String(this.editRecord.annee));
    setValue('modal-date-exp', this.isNewRecord ? '' : this.frToIso(this.editRecord.dateExpiration));
    setValue('modal-montant', String(this.editRecord.montant));

    const title = document.getElementById('modal-title');
    if (title) title.textContent = this.isNewRecord ? 'Nouvelle vignette' : 'Modifier la vignette';
    const delBtn = document.getElementById('modal-delete-btn');
    if (delBtn) delBtn.style.display = this.isNewRecord ? 'none' : 'inline-flex';
    if (!this.isNewRecord && delBtn) {
      (delBtn as HTMLButtonElement).onclick = () => (window as any)['vignetteDelete'](this.editRecord!.id);
    }
  }

  private closeModal(): void {
    const modal = document.getElementById('vignette-modal');
    if (modal) modal.style.display = 'none';
    this.editRecord = null;
  }

  private showToast(msg: string, type: string): void {
    const t = document.createElement('div');
    t.className = `toast toast-${type}`;
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.classList.add('show'), 10);
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 3000);
  }

  get years(): number[] {
    const result: number[] = [];
    for (let y = 2020; y <= 2050; y++) result.push(y);
    return result;
  }
}
