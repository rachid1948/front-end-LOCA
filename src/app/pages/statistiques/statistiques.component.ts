import { Component, AfterViewInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../shared/sidebar.component';
import { OperationService } from '../../core/services/operation.service';
import { MaintenanceService } from '../../core/services/maintenance.service';
import { VisiteTechniqueService } from '../../core/services/visite-technique.service';
import { AssuranceService } from '../../core/services/assurance.service';
import { VignetteService } from '../../core/services/vignette.service';

interface Operation {
  marque: string; matricule: string; client: string;
  dateAller: string; dateRetour: string; jours: number;
  prixJour: number; total: number; paye: number;
}

interface MaintenanceRecord {
  id: number; marque: string; matricule: string;
  type: string; description: string; date: string; montant: number;
}

interface VtRecord {
  id: number; marque: string; matricule: string;
  dateVisite: string; montant: number;
}

interface AssuranceRecord { id: number; annee: number; dateDebut: string; montant: number; matricule: string; }
interface VignetteRecord  { id: number; annee: number; dateExpiration: string; montant: number; matricule: string; }

@Component({
  selector: 'app-statistiques',
  standalone: true,
  imports: [CommonModule, SidebarComponent],
  templateUrl: './statistiques.component.html',
  styleUrl: './statistiques.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class StatistiquesComponent implements AfterViewInit {

  filterMode: 'all' | 'month' | 'range' = 'all';
  filterMonth     = '';   // YYYY-MM
  filterMatricule = '';
  dateFrom        = '';
  dateTo          = '';

  operations: Operation[] = [];
  maintenanceRecords: MaintenanceRecord[] = [];
  visiteTechniqueRecords: VtRecord[] = [];
  assuranceRecords: AssuranceRecord[] = [];
  vignetteRecords: VignetteRecord[] = [];

  private _loaded = 0;

  constructor(
    private operationService: OperationService,
    private maintenanceService: MaintenanceService,
    private vtService: VisiteTechniqueService,
    private assuranceService: AssuranceService,
    private vignetteService: VignetteService
  ) {}

  private isoToFr(iso: string): string {
    if (!iso) return '';
    const [y, m, d] = iso.split('T')[0].split('-');
    return `${d}/${m}/${y}`;
  }

  loadAll() {
    this._loaded = 0;
    this.operationService.getAll().subscribe({
      next: (data: any[]) => {
        this.operations = data.map(op => {
          const d1 = new Date(op.dateDepart);
          const d2 = new Date(op.dateRetour);
          const jours = Math.max(1, Math.ceil((d2.getTime() - d1.getTime()) / 86400000));
          const total = op.prixTTC ?? 0;
          const prixJour = jours > 0 ? Math.round(total / jours) : total;
          const paye = op.statut === 'PAYE' ? total : Number(op.avance ?? 0);
          return {
            marque: `${op.vehiculeMarque ?? ''} ${op.vehiculeModele ?? ''}`.trim(),
            matricule: op.vehiculeMatricule ?? op.matricule ?? '',
            client: op.client ?? '',
            dateAller: this.isoToFr(op.dateDepart),
            dateRetour: this.isoToFr(op.dateRetour),
            jours, prixJour, total, paye
          };
        });
        if (++this._loaded === 5) this.render();
      },
      error: () => { if (++this._loaded === 5) this.render(); }
    });
    this.maintenanceService.getAll().subscribe({
      next: (data: any[]) => {
        this.maintenanceRecords = data.map((m, i) => ({
          id: m.id ?? i,
          marque: `${m.vehiculeMarque ?? ''} ${m.vehiculeModele ?? ''}`.trim(),
          matricule: m.matricule ?? '',
          type: m.type ?? '',
          description: m.description ?? '',
          date: this.isoToFr(m.date),
          montant: m.cout ?? 0
        }));
        if (++this._loaded === 5) this.render();
      },
      error: () => { if (++this._loaded === 5) this.render(); }
    });
    this.vtService.getAll().subscribe({
      next: (data: any[]) => {
        this.visiteTechniqueRecords = data.map(r => ({
          id: r.id,
          marque: `${r.marque ?? ''} ${r.modele ?? ''}`.trim(),
          matricule: r.matricule ?? '',
          dateVisite: this.isoToFr((r.dateVisite ?? '').split('T')[0]),
          montant: Number(r.montant ?? 0)
        }));
        if (++this._loaded === 5) this.render();
      },
      error: () => { if (++this._loaded === 5) this.render(); }
    });
    this.assuranceService.getAll().subscribe({
      next: (data: any[]) => {
        this.assuranceRecords = data.map(r => ({
          id: r.id,
          annee: r.annee ?? 0,
          dateDebut: this.isoToFr((r.dateDebut ?? '').split('T')[0]),
          montant: Number(r.montant ?? 0),
          matricule: r.matricule ?? ''
        }));
        if (++this._loaded === 5) this.render();
      },
      error: () => { if (++this._loaded === 5) this.render(); }
    });
    this.vignetteService.getAll().subscribe({
      next: (data: any[]) => {
        this.vignetteRecords = data.map(r => ({
          id: r.id,
          annee: r.annee ?? 0,
          dateExpiration: this.isoToFr((r.dateExpiration ?? '').split('T')[0]),
          montant: Number(r.montant ?? 0),
          matricule: r.matricule ?? ''
        }));
        if (++this._loaded === 5) this.render();
      },
      error: () => { if (++this._loaded === 5) this.render(); }
    });
  }

  // ── helpers ──
  private parseDate(d: string): Date {
    const [dd, mm, yy] = d.split('/');
    return new Date(`${yy}-${mm}-${dd}`);
  }

  /** Check if a single-point date (maintenance, VT…) falls in the active filter */
  private inRange(d: string): boolean {
    const dt = this.parseDate(d);
    if (this.filterMode === 'month' && this.filterMonth) {
      const [y, m] = this.filterMonth.split('-').map(Number);
      return dt.getFullYear() === y && dt.getMonth() + 1 === m;
    }
    if (this.filterMode === 'range') {
      if (this.dateFrom && dt < new Date(this.dateFrom)) return false;
      if (this.dateTo   && dt > new Date(this.dateTo))   return false;
    }
    return true;
  }

  /** Check if an operation [dateAller..dateRetour] overlaps the active filter period */
  private opOverlaps(op: Operation): boolean {
    const start = this.parseDate(op.dateAller);
    const end   = this.parseDate(op.dateRetour);
    if (this.filterMode === 'month' && this.filterMonth) {
      const [y, m] = this.filterMonth.split('-').map(Number);
      const mStart = new Date(y, m - 1, 1);
      const mEnd   = new Date(y, m, 0);
      return start <= mEnd && end >= mStart;
    }
    if (this.filterMode === 'range') {
      const from = this.dateFrom ? new Date(this.dateFrom) : null;
      const to   = this.dateTo   ? new Date(this.dateTo)   : null;
      if (from && end   < from) return false;
      if (to   && start > to)   return false;
    }
    return true;
  }

  /** Pro-rata ratio: overlap days / total operation days */
  private opRatio(op: Operation): number {
    if (this.filterMode === 'all') return 1;
    const start = this.parseDate(op.dateAller);
    const end   = this.parseDate(op.dateRetour);
    const totalDays = Math.max(1, op.jours);

    let filterStart: Date;
    let filterEnd: Date;
    if (this.filterMode === 'month' && this.filterMonth) {
      const [y, m] = this.filterMonth.split('-').map(Number);
      filterStart = new Date(y, m - 1, 1);
      filterEnd   = new Date(y, m, 0);
    } else {
      filterStart = this.dateFrom ? new Date(this.dateFrom) : start;
      filterEnd   = this.dateTo   ? new Date(this.dateTo)   : end;
    }
    const overlapStart = start > filterStart ? start : filterStart;
    const overlapEnd   = end   < filterEnd   ? end   : filterEnd;
    const overlapDays  = Math.max(0, Math.round((overlapEnd.getTime() - overlapStart.getTime()) / 86_400_000));
    return overlapDays / totalDays;
  }

  get filteredOps(): Operation[] {
    return this.operations.filter(op =>
      this.opOverlaps(op) &&
      (!this.filterMatricule || op.matricule === this.filterMatricule)
    );
  }

  get filteredMnt(): MaintenanceRecord[] {
    return this.maintenanceRecords.filter(r =>
      this.inRange(r.date) &&
      (!this.filterMatricule || r.matricule === this.filterMatricule)
    );
  }

  // ── KPIs operations (pro-rated when filter is active)
  get totalCA():    number { return this.filteredOps.reduce((s, o) => s + o.total * this.opRatio(o), 0); }
  get totalPaye():  number { return this.filteredOps.reduce((s, o) => s + o.paye  * this.opRatio(o), 0); }
  get totalReste(): number { return this.totalCA - this.totalPaye; }
  get tauxRecouvrement(): number { return this.totalCA > 0 ? Math.round(this.totalPaye / this.totalCA * 100) : 0; }
  get totalJoursLoues(): number {
    return Math.round(this.filteredOps.reduce((s, o) => s + o.jours * this.opRatio(o), 0));
  }

  get filteredVT(): VtRecord[] {
    return this.visiteTechniqueRecords.filter(r =>
      (r.dateVisite ? this.inRange(r.dateVisite) : true) &&
      (!this.filterMatricule || r.matricule === this.filterMatricule)
    );
  }

  get filteredAssurance(): AssuranceRecord[] {
    return this.assuranceRecords.filter(r =>
      (r.dateDebut ? this.inRange(r.dateDebut) : true) &&
      (!this.filterMatricule || r.matricule === this.filterMatricule)
    );
  }

  get filteredVignette(): VignetteRecord[] {
    return this.vignetteRecords.filter(r =>
      (r.dateExpiration ? this.inRange(r.dateExpiration) : true) &&
      (!this.filterMatricule || r.matricule === this.filterMatricule)
    );
  }

  get totalAssurance(): number {
    const sum = this.filteredAssurance.reduce((s, r) => s + r.montant, 0);
    return this.filterMode === 'month' ? sum / 12 : sum;
  }
  get totalVignette(): number {
    const sum = this.filteredVignette.reduce((s, r) => s + r.montant, 0);
    return this.filterMode === 'month' ? sum / 12 : sum;
  }

  // ── KPI maintenance
  get totalDepenses(): number {
    return this.filteredMnt.reduce((s, r) => s + r.montant, 0)
         + this.filteredVT.reduce((s, r) => s + r.montant, 0)
         + this.totalAssurance
         + this.totalVignette;
  }

  // ── net
  get netRevenu(): number { return this.totalPaye - this.totalDepenses; }

  fmt(n: number): string { return n.toLocaleString('fr-MA') + ' DH'; }

  ngAfterViewInit(): void {
    this.bindFilters();
    this.loadAll();
  }

  private render(): void {
    this.computeVehicleOptions();
    // KPIs
    this.set('stat-ca',         this.fmt(this.totalCA));
    this.set('stat-paye',        this.fmt(this.totalPaye));
    this.set('stat-reste',       this.fmt(this.totalReste));
    this.set('stat-taux',        this.tauxRecouvrement + '%');
    this.set('stat-assurance',   this.fmt(this.totalAssurance));
    this.set('stat-vignette',    this.fmt(this.totalVignette));
    this.set('stat-depenses',    this.fmt(this.totalDepenses));
    this.set('stat-net',         this.fmt(this.netRevenu));
    const jours = this.totalJoursLoues;
    this.set('stat-jours',      jours + 'j');
    this.set('stat-jours-sub',  `${this.filteredOps.length} opération(s)`);
    this.set('stat-count-ops',  `${this.filteredOps.length} op. · ${jours}j loués`);
    const totalInterv = this.filteredMnt.length + this.filteredVT.length;
    this.set('stat-count-mnt',   `${totalInterv} (${this.filteredMnt.length} mnt + ${this.filteredVT.length} VT)`);

    // progress bar
    const bar = document.getElementById('stat-taux-bar');
    if (bar) bar.style.width = this.tauxRecouvrement + '%';

    // net couleur
    const netEl = document.getElementById('stat-net');
    if (netEl) netEl.style.color = this.netRevenu >= 0 ? '#00e6b4' : '#ff4d6d';

    this.renderChart();
  }

  private renderChart(): void {
    const net = this.netRevenu;
    const bars = [
      { label: 'CA Total',      value: this.totalCA,       color: '#00f5ff', glow: 'rgba(0,245,255,0.35)',   sub: this.filteredOps.length + ' op.' },
      { label: 'Payé',          value: this.totalPaye,     color: '#00e6b4', glow: 'rgba(0,230,180,0.35)',   sub: this.tauxRecouvrement + '%' },
      { label: 'Reste',         value: this.totalReste,    color: '#ff4d6d', glow: 'rgba(255,77,109,0.35)',  sub: '' },
      { label: 'Dépenses',      value: this.totalDepenses, color: '#a06fff', glow: 'rgba(123,47,255,0.35)',  sub: `${this.filteredMnt.length} mnt + ${this.filteredVT.length} VT + assur. + vign.` },
      { label: 'Revenu Net',    value: Math.abs(net),      color: net >= 0 ? '#00ff87' : '#ff4d6d', glow: net >= 0 ? 'rgba(0,255,135,0.3)' : 'rgba(255,77,109,0.35)', sub: net < 0 ? 'Déficit' : 'Bénéfice' },
    ];
    const maxVal = Math.max(...bars.map(b => b.value), 1);
    const el = document.getElementById('stat-chart-bars');
    if (!el) return;
    el.innerHTML = bars.map(b => {
      const pct = Math.round(b.value / maxVal * 100);
      return `
        <div class="bar-col">
          <div class="bar-amount" style="color:${b.color}">${this.fmt(b.value)}</div>
          <div class="bar-wrap">
            <div class="bar-fill" style="height:${pct}%;background:linear-gradient(180deg,${b.color},${b.color}88);box-shadow:0 0 18px ${b.glow}"></div>
          </div>
          <div class="bar-label">${b.label}</div>
          <div class="bar-sub">${b.sub}</div>
        </div>`;
    }).join('');
  }

  private computeVehicleOptions(): void {
    const map = new Map<string, string>();
    for (const op of this.operations)
      if (op.matricule) map.set(op.matricule, `${op.marque} — ${op.matricule}`);
    for (const r of this.maintenanceRecords)
      if (r.matricule && !map.has(r.matricule)) map.set(r.matricule, `${r.marque} — ${r.matricule}`);
    for (const r of this.visiteTechniqueRecords)
      if (r.matricule && !map.has(r.matricule)) map.set(r.matricule, `${r.marque} — ${r.matricule}`);
    for (const r of this.assuranceRecords)
      if (r.matricule && !map.has(r.matricule)) map.set(r.matricule, r.matricule);
    for (const r of this.vignetteRecords)
      if (r.matricule && !map.has(r.matricule)) map.set(r.matricule, r.matricule);
    const sel = document.getElementById('stat-vehicule-select') as HTMLSelectElement;
    if (!sel) return;
    const opts = Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([mat, label]) => `<option value="${mat}">${label}</option>`)
      .join('');
    sel.innerHTML = '<option value="">— Tous les v\u00e9hicules —</option>' + opts;
    sel.value = this.filterMatricule;
  }

  private typeColor(t: string): string {
    const map: Record<string, string> = {
      'Vidange': 'badge-vidange', 'Tôlerie': 'badge-tolerie',
      'Mécanique': 'badge-meca', 'Pneumatique': 'badge-pneu', 'Électrique': 'badge-elec'
    };
    return map[t] ?? 'badge-vidange';
  }

  private bindFilters(): void {
    (window as any)['statMode'] = (mode: 'all' | 'month' | 'range') => {
      this.filterMode = mode;
      document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
      const btn = document.getElementById('stat-mode-' + mode);
      if (btn) btn.classList.add('active');
      const monthPanel = document.getElementById('stat-month-panel');
      const rangePanel = document.getElementById('stat-range-panel');
      if (monthPanel) monthPanel.style.display = mode === 'month' ? 'flex' : 'none';
      if (rangePanel) rangePanel.style.display = mode === 'range' ? 'flex' : 'none';
      this.render();
    };

    (window as any)['statMonth'] = (val: string) => {
      this.filterMonth = val;
      this.render();
    };

    (window as any)['statFrom'] = (val: string) => {
      this.dateFrom = val;
      this.render();
    };

    (window as any)['statTo'] = (val: string) => {
      this.dateTo = val;
      this.render();
    };

    (window as any)['statVehicule'] = (val: string) => {
      this.filterMatricule = val;
      this.render();
    };

    (window as any)['statReset'] = () => {
      this.filterMode      = 'all';
      this.filterMonth     = '';
      this.filterMatricule = '';
      this.dateFrom        = '';
      this.dateTo          = '';
      const vSel = document.getElementById('stat-vehicule-select') as HTMLSelectElement;
      if (vSel) vSel.value = '';
      (document.getElementById('stat-month-input') as HTMLInputElement)?.value !== undefined &&
        ((document.getElementById('stat-month-input') as HTMLInputElement).value = '');
      (document.getElementById('stat-from') as HTMLInputElement)?.value !== undefined &&
        ((document.getElementById('stat-from') as HTMLInputElement).value = '');
      (document.getElementById('stat-to') as HTMLInputElement)?.value !== undefined &&
        ((document.getElementById('stat-to') as HTMLInputElement).value = '');
      document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
      document.getElementById('stat-mode-all')?.classList.add('active');
      const monthPanel = document.getElementById('stat-month-panel');
      const rangePanel = document.getElementById('stat-range-panel');
      if (monthPanel) monthPanel.style.display = 'none';
      if (rangePanel) rangePanel.style.display = 'none';
      this.render();
    };
  }

  private set(id: string, html: string): void {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
  }
}
