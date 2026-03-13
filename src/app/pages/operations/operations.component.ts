import { Component, AfterViewInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../shared/sidebar.component';
import { OperationService } from '../../core/services/operation.service';

interface Operation {
  id: number;
  vehiculeId: number;
  marque: string;
  matricule: string;
  client: string;
  dateAller: string;
  dateRetour: string;
  jours: number;
  prixJour: number;
  total: number;
  avance: number;
  paye: number;
  statut: string;
}

@Component({
  selector: 'app-operations',
  standalone: true,
  imports: [CommonModule, SidebarComponent],
  templateUrl: './operations.component.html',
  styleUrls: ['./operations.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class OperationsComponent implements AfterViewInit {

  pageSize = 15;
  currentPage = 1;
  editingIndex = -1;
  filterStatus: 'all' | 'paid' | 'unpaid' = 'all';
  searchText = '';
  dateFrom = '';
  dateTo = '';

  operations: Operation[] = [];

  constructor(private operationService: OperationService) {}

  private isoToFr(iso: string): string {
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  }

  private frToIso(fr: string): string {
    if (!fr) return '';
    const [d, m, y] = fr.split('/');
    return `${y}-${m}-${d}`;
  }

  private mapFromBackend(op: any): Operation {
    const total  = op.prixTTC || 0;
    const avance = Number(op.avance ?? 0);
    const paye   = op.statut === 'PAYE' ? total : avance;
    const jours  = op.jours || 0;
    const prixJour = op.prixJour
      ? Number(op.prixJour)
      : (jours > 0 ? Math.round(total / jours) : 0);
    return {
      id: op.id,
      vehiculeId: op.vehiculeId,
      marque: `${op.vehiculeMarque || ''} ${op.vehiculeModele || ''}`.trim(),
      matricule: op.matricule || '',
      client: op.client || '',
      dateAller: this.isoToFr(op.dateDepart),
      dateRetour: op.dateRetour ? this.isoToFr(op.dateRetour) : '',  // vide = location ouverte
      jours,
      prixJour,
      total,
      avance,
      paye,
      statut: op.statut || 'IMPAYE'
    };
  }

  private loadAll(): void {
    const tbody = document.getElementById('ops-tbody');
    if (tbody) tbody.innerHTML = `<tr><td colspan="12" class="loading-row">Chargement...</td></tr>`;
    this.operationService.getAll().subscribe({
      next: (data) => {
        this.operations = data.map(op => this.mapFromBackend(op));
        this.renderTable();
      },
      error: () => {
        if (tbody) tbody.innerHTML = `<tr><td colspan="12" class="loading-row">Erreur de chargement.</td></tr>`;
      }
    });
  }

  get filtered(): { op: Operation; idx: number }[] {
    return this.operations
      .map((op, idx) => ({ op, idx }))
      .filter(({ op }) => {
        if (this.filterStatus === 'paid' && (op.total - op.paye) > 0) return false;
        if (this.filterStatus === 'unpaid' && (op.total - op.paye) <= 0) return false;
        if (this.searchText) {
          const q = this.searchText.toLowerCase();
          const match = op.client.toLowerCase().includes(q) ||
                        op.marque.toLowerCase().includes(q) ||
                        op.matricule.toLowerCase().includes(q);
          if (!match) return false;
        }
        if (this.dateFrom || this.dateTo) {
          const parseDate = (d: string) => {
            const [dd, mm, yy] = d.split('/');
            return new Date(`${yy}-${mm}-${dd}`);
          };
          const allerDate = parseDate(op.dateAller);
          if (this.dateFrom && allerDate < new Date(this.dateFrom)) return false;
          if (this.dateTo && allerDate > new Date(this.dateTo)) return false;
        }
        return true;
      });
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filtered.length / this.pageSize));
  }

  get paginated(): { op: Operation; idx: number }[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filtered.slice(start, start + this.pageSize);
  }

  renderTable() {
    const tbody = document.getElementById('ops-tbody');
    if (!tbody) return;

    const items = this.paginated;
    if (items.length === 0) {
      tbody.innerHTML = `<tr><td colspan="12" class="loading-row">Aucun résultat trouvé</td></tr>`;
      const countEl = document.getElementById('ops-count');
      if (countEl) countEl.textContent = '0 opération';
      this.renderPagination();
      return;
    }
    const todayMidnight = new Date(); todayMidnight.setHours(0,0,0,0);
    tbody.innerHTML = items.map(({ op, idx }) => {
      const isOpen  = op.statut === 'EN_COURS';
      const reste   = isOpen ? 0 : (op.total - op.paye);
      const isPaid  = !isOpen && reste <= 0;
      const payeClass = isOpen ? 'badge-open' : (isPaid ? 'badge-paid' : 'badge-unpaid');
      const payeLabel = isOpen ? '⏳ En cours' : (isPaid ? '✓ Payé' : 'Partiel');
      // Days coloring (uniquement si date retour connue)
      let joursCell = '—';
      if (!isOpen && op.dateRetour) {
        const [dd, mm, yyyy] = op.dateRetour.split('/');
        const retourDate = new Date(`${yyyy}-${mm}-${dd}`); retourDate.setHours(0,0,0,0);
        const diffDays = Math.round((retourDate.getTime() - todayMidnight.getTime()) / 86_400_000);
        const joursClass = diffDays >= 0 ? 'jours-green' : 'jours-red';
        joursCell = `<span class="${joursClass}">${op.jours}j</span>`;
      } else if (isOpen) {
        joursCell = `<span class="jours-open">?</span>`;
      }
      return `
        <tr class="${isOpen ? 'row-open' : ''}">
          <td class="marque-cell">${op.marque}</td>
          <td><span class="plate">${op.matricule}</span></td>
          <td class="client-cell">${op.client}</td>
          <td class="date-cell">${op.dateAller}</td>
          <td class="date-cell">${isOpen ? '<span class="retour-ouvert">Retour ouvert</span>' : op.dateRetour}</td>
          <td class="num-cell">${joursCell}</td>
          <td class="num-cell">${op.prixJour.toLocaleString('fr-FR')} DH</td>
          <td class="total-cell">${isOpen ? '—' : op.total.toLocaleString('fr-FR') + ' DH'}</td>
          <td class="avance-cell">${op.avance > 0 ? op.avance.toLocaleString('fr-FR') + ' DH' : '—'}</td>
          <td><span class="${payeClass}">${payeLabel}</span></td>
          <td class="${isPaid ? 'reste-zero' : 'reste-cell'}">${isOpen ? '—' : (reste > 0 ? reste.toLocaleString('fr-FR') + ' DH' : '—')}</td>
          <td class="actions-cell">
            ${isOpen ? `<button class="btn-cloture" onclick="opsCloture(${idx})" title="Clôturer la location">
              <svg viewBox="0 0 24 24" fill="none" width="15" height="15"><path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/></svg>
              Clôturer
            </button>` : `<button class="btn-edit" onclick="opsEdit(${idx})" title="Modifier">
              <svg viewBox="0 0 24 24" fill="none" width="15" height="15"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>`}
            <button class="btn-del" onclick="opsDel(${idx})" title="Supprimer">
              <svg viewBox="0 0 24 24" fill="none" width="15" height="15"><polyline points="3 6 5 6 21 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M19 6l-1 14H6L5 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 11v6M14 11v6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M9 6V4h6v2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
          </td>
        </tr>
      `;
    }).join('');

    const countEl = document.getElementById('ops-count');
    if (countEl) countEl.textContent = `${this.filtered.length} opération${this.filtered.length > 1 ? 's' : ''}`;
    this.renderPagination();
  }

  renderPagination() {
    const container = document.getElementById('ops-pagination');
    if (!container) return;

    const prev = `<button class="page-btn" onclick="opsPage(${this.currentPage - 1})" ${this.currentPage === 1 ? 'disabled' : ''}>‹ Préc.</button>`;
    const next = `<button class="page-btn" onclick="opsPage(${this.currentPage + 1})" ${this.currentPage === this.totalPages ? 'disabled' : ''}>Suiv. ›</button>`;

    const pages = Array.from({ length: this.totalPages }, (_, i) => i + 1)
      .map(p => `<button class="page-btn ${p === this.currentPage ? 'active' : ''}" onclick="opsPage(${p})">${p}</button>`)
      .join('');

    const info = `<span class="page-info">Page ${this.currentPage} / ${this.totalPages} — ${this.filtered.length} opération${this.filtered.length > 1 ? 's' : ''}</span>`;

    container.innerHTML = prev + pages + next + info;
  }

  clotureOp(globalIdx: number) {
    const op = this.operations[globalIdx];
    if (!op) return;
    this.editingIndex = globalIdx;
    // Pré-remplir la date d'aujourd'hui
    const today = new Date().toISOString().split('T')[0];
    (document.getElementById('cl-dateRetour') as HTMLInputElement).value = today;
    // Afficher l'info
    const info = document.getElementById('cl-info');
    if (info) info.textContent = `${op.client} — ${op.marque} (${op.matricule}) — départ le ${op.dateAller} — ${op.prixJour.toLocaleString('fr-FR')} DH/j`;
    document.getElementById('ops-cloture-modal')?.classList.add('open');
  }

  saveCloture() {
    if (this.editingIndex < 0) return;
    const op = this.operations[this.editingIndex];
    if (!op) return;
    const dateRetour = (document.getElementById('cl-dateRetour') as HTMLInputElement).value;
    if (!dateRetour) { this.showToast('Veuillez saisir la date de retour.'); return; }

    this.operationService.cloture(op.id, dateRetour).subscribe({
      next: (updated) => {
        this.operations[this.editingIndex] = this.mapFromBackend(updated);
        this.closeClotureModal();
        this.renderTable();
        this.showToast('Location clôturée avec succès !');
      },
      error: (err) => this.showToast(err.error?.message || 'Erreur lors de la clôture.')
    });
  }

  closeClotureModal() {
    document.getElementById('ops-cloture-modal')?.classList.remove('open');
    this.editingIndex = -1;
  }

  openEditModal(globalIdx: number) {
    this.editingIndex = globalIdx;
    const op = this.operations[globalIdx];
    if (!op) return;

    (document.getElementById('ed-marque') as HTMLInputElement).value = op.marque;
    (document.getElementById('ed-matricule') as HTMLInputElement).value = op.matricule;
    (document.getElementById('ed-client') as HTMLInputElement).value = op.client;

    const toISO = (d: string) => { const [dd, mm, yy] = d.split('/'); return `${yy}-${mm}-${dd}`; };
    (document.getElementById('ed-aller') as HTMLInputElement).value = toISO(op.dateAller);
    (document.getElementById('ed-retour') as HTMLInputElement).value = toISO(op.dateRetour);
    (document.getElementById('ed-prix') as HTMLInputElement).value = op.prixJour.toString();
    (document.getElementById('ed-paye') as HTMLInputElement).value = op.avance.toString();
    (document.getElementById('ed-avance-complement') as HTMLInputElement).value = '0';

    document.getElementById('ops-modal')?.classList.add('open');
  }

  saveEdit() {
    if (this.editingIndex < 0) return;
    const op = this.operations[this.editingIndex];
    if (!op) return;

    const toFR = (iso: string) => { const [y, m, d] = iso.split('-'); return `${d}/${m}/${y}`; };
    const dateAllerISO  = (document.getElementById('ed-aller')    as HTMLInputElement).value;
    const dateRetourISO = (document.getElementById('ed-retour')   as HTMLInputElement).value;
    const prixJour      = parseFloat((document.getElementById('ed-prix')  as HTMLInputElement).value) || 0;
    const avanceActuelle = parseFloat((document.getElementById('ed-paye') as HTMLInputElement).value) || 0;
    const complement    = parseFloat((document.getElementById('ed-avance-complement') as HTMLInputElement).value) || 0;
    const paye          = avanceActuelle + complement;
    const client        = (document.getElementById('ed-client') as HTMLInputElement).value;

    const d1 = new Date(dateAllerISO), d2 = new Date(dateRetourISO);
    const jours   = Math.max(1, Math.ceil((d2.getTime() - d1.getTime()) / 86400000));
    const prixTTC  = jours * prixJour;
    const statut   = paye >= prixTTC ? 'PAYE' : 'IMPAYE';

    const body = { client, vehiculeId: op.vehiculeId, dateDepart: dateAllerISO, dateRetour: dateRetourISO, prixJour, avance: paye, statut };

    this.operationService.update(op.id, body).subscribe({
      next: () => {
        this.operations[this.editingIndex] = {
          ...op, client,
          dateAller: toFR(dateAllerISO),
          dateRetour: toFR(dateRetourISO),
          jours, prixJour, total: prixTTC, avance: paye, paye, statut
        };
        this.closeModal();
        this.renderTable();
        this.showToast('Opération modifiée avec succès');
      },
      error: () => this.showToast('Erreur lors de la modification.')
    });
  }

  deleteOp(globalIdx: number) {
    const op = this.operations[globalIdx];
    if (!op) return;
    if (!confirm('Supprimer cette opération ?')) return;
    this.operationService.delete(op.id).subscribe({
      next: () => {
        this.operations.splice(globalIdx, 1);
        if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;
        this.renderTable();
        this.showToast('Opération supprimée');
      },
      error: () => this.showToast('Erreur lors de la suppression.')
    });
  }

  closeModal() {
    document.getElementById('ops-modal')?.classList.remove('open');
    this.editingIndex = -1;
  }

  showToast(msg: string) {
    const t = document.getElementById('ops-toast');
    const tm = document.getElementById('ops-toast-msg');
    if (!t || !tm) return;
    tm.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
  }

  applyFilters() {
    this.currentPage = 1;
    this.renderTable();
    ['all', 'paid', 'unpaid'].forEach(s => {
      const el = document.getElementById(`flt-${s}`);
      if (el) el.classList.toggle('active', s === this.filterStatus);
    });
  }

  ngAfterViewInit() {
    (window as any)['opsEdit']    = (i: number) => this.openEditModal(i);
    (window as any)['opsDel']     = (i: number) => this.deleteOp(i);
    (window as any)['opsCloture'] = (i: number) => this.clotureOp(i);
    (window as any)['opsPage']    = (p: number) => { this.currentPage = p; this.renderTable(); };
    (window as any)['opsSave']    = () => this.saveEdit();
    (window as any)['opsClose']   = () => this.closeModal();
    (window as any)['opsSaveCloture']  = () => this.saveCloture();
    (window as any)['opsCloseCloture'] = () => this.closeClotureModal();
    (window as any)['opsFilter'] = (s: string) => { this.filterStatus = s as any; this.applyFilters(); };
    (window as any)['opsSearch'] = (v: string) => { this.searchText = v; this.applyFilters(); };
    (window as any)['opsDates'] = () => {
      this.dateFrom = (document.getElementById('flt-from') as HTMLInputElement).value;
      this.dateTo = (document.getElementById('flt-to') as HTMLInputElement).value;
      this.applyFilters();
    };
    (window as any)['opsReset'] = () => {
      this.filterStatus = 'all';
      this.searchText = '';
      this.dateFrom = '';
      this.dateTo = '';
      (document.getElementById('flt-search') as HTMLInputElement).value = '';
      (document.getElementById('flt-from') as HTMLInputElement).value = '';
      (document.getElementById('flt-to') as HTMLInputElement).value = '';
      this.applyFilters();
    };

    document.getElementById('ops-modal')?.addEventListener('click', (e) => {
      if ((e.target as Element).id === 'ops-modal') this.closeModal();
    });

    this.loadAll();
  }
}
