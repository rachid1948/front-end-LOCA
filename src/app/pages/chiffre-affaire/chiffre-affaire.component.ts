import { Component, AfterViewInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../shared/sidebar.component';
import { OperationService } from '../../core/services/operation.service';

interface Operation {
  marque: string;
  matricule: string;
  client: string;
  dateAller: string;
  dateRetour: string;
  jours: number;
  prixJour: number;
  total: number;
  paye: number;
}

@Component({
  selector: 'app-chiffre-affaire',
  standalone: true,
  imports: [CommonModule, SidebarComponent],
  templateUrl: './chiffre-affaire.component.html',
  styleUrl: './chiffre-affaire.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class ChiffreAffaireComponent implements AfterViewInit {

  filterMode: 'all' | 'month' | 'voiture' | 'client' = 'all';
  searchText = '';
  selectedMonth = '';
  dateFrom = '';
  dateTo = '';

  operations: Operation[] = [
    { marque: 'BMW Série 3',     matricule: '123-A-45', client: 'Ahmed Benali',    dateAller: '01/03/2026', dateRetour: '05/03/2026', jours: 4, prixJour: 450, total: 1800, paye: 1800 },
    { marque: 'Renault Clio',    matricule: '456-B-12', client: 'Fatima Zahra',    dateAller: '02/03/2026', dateRetour: '06/03/2026', jours: 4, prixJour: 200, total: 800,  paye: 500  },
    { marque: 'Peugeot 308',     matricule: '789-C-33', client: 'Karim Mansouri',  dateAller: '03/03/2026', dateRetour: '08/03/2026', jours: 5, prixJour: 280, total: 1400, paye: 1400 },
    { marque: 'Toyota Yaris',    matricule: '321-D-07', client: 'Sara El Idrissi', dateAller: '04/03/2026', dateRetour: '07/03/2026', jours: 3, prixJour: 220, total: 660,  paye: 0    },
    { marque: 'Volkswagen Golf', matricule: '654-E-91', client: 'Youssef Lahlou',  dateAller: '05/03/2026', dateRetour: '10/03/2026', jours: 5, prixJour: 320, total: 1600, paye: 1000 },
    { marque: 'Mercedes C200',   matricule: '987-F-55', client: 'Nadia Benyoussef',dateAller: '06/03/2026', dateRetour: '09/03/2026', jours: 3, prixJour: 550, total: 1650, paye: 1650 },
    { marque: 'Audi A4',         matricule: '147-G-28', client: 'Rachid Tazi',     dateAller: '07/03/2026', dateRetour: '12/03/2026', jours: 5, prixJour: 480, total: 2400, paye: 2400 },
    { marque: 'Ford Focus',      matricule: '258-H-63', client: 'Halima Chraibi',  dateAller: '08/03/2026', dateRetour: '11/03/2026', jours: 3, prixJour: 240, total: 720,  paye: 350  },
    { marque: 'Seat Ibiza',      matricule: '369-I-84', client: 'Omar Benjelloun', dateAller: '09/03/2026', dateRetour: '13/03/2026', jours: 4, prixJour: 190, total: 760,  paye: 760  },
    { marque: 'Hyundai Tucson',  matricule: '741-J-17', client: 'Leila Sekkat',    dateAller: '10/03/2026', dateRetour: '14/03/2026', jours: 4, prixJour: 350, total: 1400, paye: 700  },
    { marque: 'Kia Sportage',    matricule: '852-K-39', client: 'Hassan Berrada',  dateAller: '01/03/2026', dateRetour: '04/03/2026', jours: 3, prixJour: 380, total: 1140, paye: 1140 },
    { marque: 'Nissan Qashqai',  matricule: '963-L-72', client: 'Amina Filali',    dateAller: '02/03/2026', dateRetour: '05/03/2026', jours: 3, prixJour: 340, total: 1020, paye: 500  },
    { marque: 'Citroën C3',      matricule: '159-M-46', client: 'Mourad Alami',    dateAller: '03/03/2026', dateRetour: '06/03/2026', jours: 3, prixJour: 180, total: 540,  paye: 540  },
    { marque: 'Dacia Logan',     matricule: '357-N-81', client: 'Imane Kettani',   dateAller: '04/03/2026', dateRetour: '09/03/2026', jours: 5, prixJour: 150, total: 750,  paye: 0    },
    { marque: 'Fiat Punto',      matricule: '246-O-59', client: 'Bilal Cherkaoui', dateAller: '05/03/2026', dateRetour: '08/03/2026', jours: 3, prixJour: 170, total: 510,  paye: 510  },
    { marque: 'BMW Série 3',     matricule: '123-A-45', client: 'Sanae Moujahid',  dateAller: '06/03/2026', dateRetour: '11/03/2026', jours: 5, prixJour: 450, total: 2250, paye: 2250 },
    { marque: 'Renault Clio',    matricule: '456-B-12', client: 'Tariq Ouazzani',  dateAller: '07/03/2026', dateRetour: '10/03/2026', jours: 3, prixJour: 200, total: 600,  paye: 300  },
    { marque: 'Peugeot 308',     matricule: '789-C-33', client: 'Najat Essabri',   dateAller: '08/03/2026', dateRetour: '13/03/2026', jours: 5, prixJour: 280, total: 1400, paye: 1400 },
    { marque: 'Toyota Yaris',    matricule: '321-D-07', client: 'Amine Rhazal',    dateAller: '09/03/2026', dateRetour: '12/03/2026', jours: 3, prixJour: 220, total: 660,  paye: 660  },
    { marque: 'Volkswagen Golf', matricule: '654-E-91', client: 'Zineb Maarouf',   dateAller: '10/03/2026', dateRetour: '15/03/2026', jours: 5, prixJour: 320, total: 1600, paye: 800  },
    // ─── À cheval mars / avril ───
    { marque: 'BMW X5',          matricule: '111-P-11', client: 'Mehdi Alaoui',     dateAller: '28/03/2026', dateRetour: '05/04/2026', jours: 8, prixJour: 600, total: 4800, paye: 4800 },
    { marque: 'Audi Q5',         matricule: '222-Q-22', client: 'Dounia Karimi',    dateAller: '26/03/2026', dateRetour: '02/04/2026', jours: 7, prixJour: 520, total: 3640, paye: 2000 },
    { marque: 'Mercedes GLE',    matricule: '333-R-33', client: 'Samir Ouali',      dateAller: '30/03/2026', dateRetour: '06/04/2026', jours: 7, prixJour: 700, total: 4900, paye: 2450 },
    { marque: 'Peugeot 3008',    matricule: '444-S-44', client: 'Najwa Tahir',      dateAller: '29/03/2026', dateRetour: '03/04/2026', jours: 5, prixJour: 350, total: 1750, paye: 1750 },
    { marque: 'Toyota RAV4',     matricule: '555-T-55', client: 'Yasmine Alami',    dateAller: '31/03/2026', dateRetour: '04/04/2026', jours: 4, prixJour: 400, total: 1600, paye: 0    },
    // ─── Opérations en avril ───
    { marque: 'Honda CR-V',      matricule: '666-U-66', client: 'Khalid Moussaoui', dateAller: '07/04/2026', dateRetour: '12/04/2026', jours: 5, prixJour: 380, total: 1900, paye: 1900 },
    { marque: 'Dacia Duster',    matricule: '777-V-77', client: 'Ilham Berrada',    dateAller: '10/04/2026', dateRetour: '14/04/2026', jours: 4, prixJour: 200, total: 800,  paye: 400  },
  ];
  // Note: array above is kept only as compile-time placeholder; loadAll() replaces it from API.

  constructor(private operationService: OperationService) {}

  private isoToFr(iso: string): string {
    if (!iso) return '';
    const [y, m, d] = iso.split('T')[0].split('-');
    return `${d}/${m}/${y}`;
  }

  loadAll() {
    this.operationService.getAll().subscribe({
      next: (data: any[]) => {
        this.operations = data.map(op => {
          const d1 = new Date(op.dateDepart);
          const d2 = new Date(op.dateRetour);
          const jours = Math.max(1, Math.ceil((d2.getTime() - d1.getTime()) / 86400000));
          const total = op.prixTTC ?? 0;
          const prixJour = jours > 0 ? Math.round(total / jours) : total;
          const paye = op.statut === 'PAYE' ? total : 0;
          return {
            marque: `${op.vehiculeMarque ?? ''} ${op.vehiculeModele ?? ''}`.trim(),
            matricule: op.vehiculeMatricule ?? op.matricule ?? '',
            client: op.client ?? '',
            dateAller: this.isoToFr(op.dateDepart),
            dateRetour: this.isoToFr(op.dateRetour),
            jours, prixJour, total, paye
          };
        });
        this.renderAll();
      },
      error: () => this.renderAll()
    });
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────
  parseDate(d: string): Date {
    const [dd, mm, yy] = d.split('/');
    return new Date(`${yy}-${mm}-${dd}`);
  }

  // Retourne la portion d'une opération qui tombe dans un mois donné (pro-rata)
  getMonthPortion(op: Operation, yearMonth: string): { jours: number; total: number; paye: number } | null {
    const [yy, mm] = yearMonth.split('-').map(Number);
    const monthStart = new Date(yy, mm - 1, 1).getTime();
    const monthEnd   = new Date(yy, mm, 1).getTime();
    const aller  = this.parseDate(op.dateAller).getTime();
    const retour = this.parseDate(op.dateRetour).getTime();
    if (retour <= monthStart || aller >= monthEnd) return null;
    const overlapStart = Math.max(aller, monthStart);
    const overlapEnd   = Math.min(retour, monthEnd);
    const joursInMonth = Math.round((overlapEnd - overlapStart) / 86400000);
    if (joursInMonth <= 0) return null;
    const total = joursInMonth * op.prixJour;
    const paye  = op.total > 0 ? Math.round(op.paye * (total / op.total)) : 0;
    return { jours: joursInMonth, total, paye };
  }

  // Valeurs affichées selon le mode actif (pro-rata pour mois)
  getDisplayRow(op: Operation): { jours: number; total: number; paye: number; reste: number; crossMonth: boolean } {
    if (this.filterMode === 'month' && this.selectedMonth) {
      const portion = this.getMonthPortion(op, this.selectedMonth);
      if (portion) {
        return { jours: portion.jours, total: portion.total, paye: portion.paye, reste: Math.max(0, portion.total - portion.paye), crossMonth: portion.jours < op.jours };
      }
    }
    return { jours: op.jours, total: op.total, paye: op.paye, reste: Math.max(0, op.total - op.paye), crossMonth: false };
  }

  fmt(n: number): string {
    return n.toLocaleString('fr-FR') + ' DH';
  }

  monthLabel(iso: string): string {
    if (!iso) return '';
    const [y, m] = iso.split('-');
    const months = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
    return `${months[parseInt(m) - 1]} ${y}`;
  }

  // ─── Filtered data ────────────────────────────────────────────────────────────
  get filtered(): Operation[] {
    return this.operations.filter(op => {
      // Date range (always active)
      if (this.dateFrom || this.dateTo) {
        const d = this.parseDate(op.dateAller);
        if (this.dateFrom && d < new Date(this.dateFrom)) return false;
        if (this.dateTo   && d > new Date(this.dateTo))   return false;
      }
      // Mode filters
      if (this.filterMode === 'month' && this.selectedMonth) {
        if (!this.getMonthPortion(op, this.selectedMonth)) return false;
      }
      if (this.filterMode === 'voiture' && this.searchText) {
        const q = this.searchText.toLowerCase();
        if (!op.marque.toLowerCase().includes(q) && !op.matricule.toLowerCase().includes(q)) return false;
      }
      if (this.filterMode === 'client' && this.searchText) {
        if (!op.client.toLowerCase().includes(this.searchText.toLowerCase())) return false;
      }
      return true;
    });
  }

  get totalCA(): number {
    if (this.filterMode === 'month' && this.selectedMonth)
      return this.filtered.reduce((s, op) => { const p = this.getMonthPortion(op, this.selectedMonth); return s + (p ? p.total : 0); }, 0);
    return this.filtered.reduce((s, o) => s + o.total, 0);
  }
  get totalPaye(): number {
    if (this.filterMode === 'month' && this.selectedMonth)
      return this.filtered.reduce((s, op) => { const p = this.getMonthPortion(op, this.selectedMonth); return s + (p ? p.paye : 0); }, 0);
    return this.filtered.reduce((s, o) => s + o.paye, 0);
  }
  get totalReste(): number { return Math.max(0, this.totalCA - this.totalPaye); }
  get tauxRecouvrement(): number {
    return this.totalCA > 0 ? Math.round((this.totalPaye / this.totalCA) * 100) : 0;
  }

  // ─── Render ───────────────────────────────────────────────────────────────────
  renderAll() {
    this.renderCards();
    this.renderTable();
  }

  renderCards() {
    const set = (id: string, v: string) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('ca-total',  this.fmt(this.totalCA));
    set('ca-paye',   this.fmt(this.totalPaye));
    set('ca-reste',  this.fmt(this.totalReste));
    set('ca-taux',   this.tauxRecouvrement + ' %');
    set('ca-count',  this.filtered.length + ' opération' + (this.filtered.length > 1 ? 's' : ''));
    set('ca-total-foot', this.fmt(this.totalCA));
    set('ca-paye-foot',  this.fmt(this.totalPaye));
    set('ca-reste-foot', this.fmt(this.totalReste));

    const bar = document.getElementById('ca-bar');
    if (bar) bar.style.width = this.tauxRecouvrement + '%';
  }

  renderTable() {
    const tbody = document.getElementById('ca-tbody');
    if (!tbody) return;

    if (this.filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" class="empty-row">Aucun résultat pour ce filtre</td></tr>`;
      return;
    }

    tbody.innerHTML = this.filtered.map(op => {
      const d = this.getDisplayRow(op);
      const isPaid = d.reste <= 0;
      const tauxOp = d.total > 0 ? Math.round((d.paye / d.total) * 100) : 0;
      const joursCell = d.crossMonth
        ? `<span class="jours-main">${d.jours}j</span><span class="jours-split"> / ${op.jours}j total</span>`
        : `${d.jours}j`;
      const totalCell = d.crossMonth
        ? `${this.fmt(d.total)}<span class="month-note"> ce mois</span>`
        : this.fmt(d.total);
      return `
        <tr>
          <td class="marque-cell">${op.marque}</td>
          <td><span class="plate">${op.matricule}</span></td>
          <td class="client-cell">${op.client}</td>
          <td class="date-cell">${op.dateAller}</td>
          <td class="date-cell">${op.dateRetour}</td>
          <td class="num-cell">${joursCell}</td>
          <td class="total-cell">${totalCell}</td>
          <td class="paye-cell">${this.fmt(d.paye)}</td>
          <td class="${isPaid ? 'reste-zero' : 'reste-cell'}">${d.reste > 0 ? this.fmt(d.reste) : '—'}</td>
          <td>
            <div class="mini-bar-wrap">
              <div class="mini-bar" style="width:${tauxOp}%"></div>
              <span class="mini-pct">${tauxOp}%</span>
            </div>
          </td>
        </tr>`;
    }).join('');
  }

  // ─── Filter logic ─────────────────────────────────────────────────────────────
  setMode(mode: string) {
    this.filterMode = mode as any;
    this.searchText = '';
    (document.getElementById('ca-search') as HTMLInputElement).value = '';

    // Toggle UI
    ['all','month','voiture','client'].forEach(m => {
      document.getElementById(`mode-${m}`)?.classList.toggle('active', m === mode);
    });

    // Show/hide extra inputs
    const searchWrap = document.getElementById('ca-search-wrap');
    const monthWrap  = document.getElementById('ca-month-wrap');
    if (searchWrap) searchWrap.style.display = (mode === 'voiture' || mode === 'client') ? 'flex' : 'none';
    if (monthWrap)  monthWrap.style.display  = mode === 'month' ? 'flex' : 'none';

    // Update placeholder
    const input = document.getElementById('ca-search') as HTMLInputElement;
    if (input) {
      if (mode === 'voiture') input.placeholder = 'Marque ou matricule...';
      if (mode === 'client')  input.placeholder = 'Nom du client...';
    }

    this.renderAll();
  }

  applySearch(v: string) { this.searchText = v; this.renderAll(); }
  applyMonth()  { this.selectedMonth = (document.getElementById('ca-month') as HTMLInputElement).value; this.renderAll(); }
  applyDates()  {
    this.dateFrom = (document.getElementById('ca-from') as HTMLInputElement).value;
    this.dateTo   = (document.getElementById('ca-to')   as HTMLInputElement).value;
    this.renderAll();
  }
  reset() {
    this.filterMode = 'all';
    this.searchText = '';
    this.selectedMonth = '';
    this.dateFrom = '';
    this.dateTo = '';
    (['ca-search','ca-month','ca-from','ca-to'] as string[]).forEach(id => {
      const el = document.getElementById(id) as HTMLInputElement;
      if (el) el.value = '';
    });
    this.setMode('all');
  }

  ngAfterViewInit() {
    (window as any)['caMode']   = (m: string) => this.setMode(m);
    (window as any)['caSearch'] = (v: string) => this.applySearch(v);
    (window as any)['caMonth']  = () => this.applyMonth();
    (window as any)['caDates']  = () => this.applyDates();
    (window as any)['caReset']  = () => this.reset();
    this.loadAll();
  }
}
