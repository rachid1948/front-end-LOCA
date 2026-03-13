import { Component, AfterViewInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FactureService } from '../../core/services/facture.service';
import { VehiculeService } from '../../core/services/vehicule.service';
import { SidebarComponent } from '../../shared/sidebar.component';
interface SavedInvoice {
  id?: number;
  numero: string;
  dateFacture: string;
  client: string;
  marque: string;
  matricule: string;
  dateDepart: string;
  dateRetour: string;
  jours: number;
  prixTTC: number;
  prixHT: number;
  tva: number;
  prixJourHT: number;
}

@Component({
  selector: 'app-factures',
  standalone: true,
  imports: [CommonModule, SidebarComponent],
  templateUrl: './factures.component.html',
  styleUrl: './factures.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class FacturesComponent implements AfterViewInit {

  private MONTH_CODES = ['J','F','M','A','X','U','L','T','S','O','N','D'];
  private MONTH_NAMES = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

  savedInvoices: SavedInvoice[] = [];
  currentInvoice: SavedInvoice | null = null;
  private vehicules: any[] = [];

  constructor(private factureService: FactureService, private vehiculeService: VehiculeService) {}

  ngAfterViewInit(): void {
    this.vehiculeService.getAll().subscribe({ next: (v) => { this.vehicules = v; } });
    this.loadFromApi();
    this.bindForm();
    this.bindDates();
  }

  private loadFromApi(): void {
    this.factureService.getAll().subscribe({
      next: (data) => {
        this.savedInvoices = data.map(f => this.mapFromBackend(f));
      }
    });
  }

  private mapFromBackend(f: any): SavedInvoice {
    const ht  = f.prixHT  || (f.prixTTC / 1.2);
    const tva = f.tva     || (f.prixTTC - ht);
    const jours  = f.jours  || 1;
    return {
      id:          f.id,
      numero:      f.numero,
      dateFacture: f.dateFacture || '',
      client:      f.client,
      marque:      f.marque || `${f.vehiculeMarque || ''} ${f.vehiculeModele || ''}`.trim(),
      matricule:   f.matricule || f.vehiculeMatricule || '',
      dateDepart:  f.dateDepart || '',
      dateRetour:  f.dateRetour || '',
      jours,
      prixTTC:     f.prixTTC,
      prixHT:      ht,
      tva,
      prixJourHT:  f.prixJourHT || (ht / jours)
    };
  }

  private fmtDate(d: string): string {
    if (!d) return '';
    const [y, m, da] = d.split('-');
    return `${da}/${m}/${y}`;
  }

  private fmt(n: number): string {
    return n.toLocaleString('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' DH';
  }

  private bindDates(): void {
    (window as any)['facCalcJours'] = () => {
      const depart = (document.getElementById('fac-depart') as HTMLInputElement)?.value;
      const retour = (document.getElementById('fac-retour') as HTMLInputElement)?.value;
      if (depart && retour) {
        const j = Math.max(0, Math.round((new Date(retour).getTime() - new Date(depart).getTime()) / 86400000));
        this.set('fac-jours-badge', j + ' jour' + (j > 1 ? 's' : ''));
      }
    };
  }

  private bindForm(): void {
    (window as any)['facGenerate'] = () => {
      const get = (id: string) => (document.getElementById(id) as HTMLInputElement)?.value?.trim();
      const client    = get('fac-client');
      const marque    = get('fac-marque');
      const matricule = get('fac-matricule');
      const depart    = get('fac-depart');
      const retour    = get('fac-retour');
      const ttcStr    = get('fac-ttc');
      const dateF     = get('fac-date');

      if (!client || !marque || !matricule || !depart || !retour || !ttcStr || !dateF) {
        this.showToast('Veuillez remplir tous les champs', 'error'); return;
      }
      const ttc = parseFloat(ttcStr!);
      if (isNaN(ttc) || ttc <= 0) { this.showToast('Prix TTC invalide', 'error'); return; }
      if (new Date(retour!) <= new Date(depart!)) {
        this.showToast('La date de retour doit être après le départ', 'error'); return;
      }

      // Find vehiculeId from vehicule list by matricule
      const vehicule = this.vehicules.find(v => v.matricule.toLowerCase() === (matricule || '').toLowerCase());
      if (!vehicule) {
        this.showToast('Véhicule non trouvé dans le parc. Vérifiez la matricule.', 'error'); return;
      }

      const body = { client, vehiculeId: vehicule.id, dateDepart: depart, dateRetour: retour, prixTTC: ttc, dateFacture: dateF };

      this.factureService.create(body).subscribe({
        next: (f) => {
          const inv = this.mapFromBackend(f);
          this.currentInvoice = inv;
          this.savedInvoices.unshift(inv);
          this.renderInvoice(inv);
          this.showToast('Facture N° ' + inv.numero + ' générée avec succès', 'success');
          const preview = document.getElementById('fac-preview');
          if (preview) { preview.style.display = 'block'; preview.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
        },
        error: (err) => {
          const msg = err.error?.message || 'Erreur lors de la génération de la facture.';
          this.showToast(msg, 'error');
        }
      });
    };

    (window as any)['facPrint'] = () => window.print();

    (window as any)['facReset'] = () => {
      ['fac-client','fac-marque','fac-matricule','fac-depart','fac-retour','fac-ttc','fac-date'].forEach(id => {
        const el = document.getElementById(id) as HTMLInputElement;
        if (el) el.value = '';
      });
      this.set('fac-jours-badge', '—');
      const preview = document.getElementById('fac-preview');
      if (preview) preview.style.display = 'none';
      this.currentInvoice = null;
    };

    (window as any)['facDelete'] = (numero: string) => {
      const inv = this.savedInvoices.find(i => i.numero === numero);
      if (!inv?.id) {
        this.savedInvoices = this.savedInvoices.filter(i => i.numero !== numero);
        this.renderConsultList(); return;
      }
      this.factureService.delete(inv.id).subscribe({
        next: () => {
          this.savedInvoices = this.savedInvoices.filter(i => i.numero !== numero);
          this.renderConsultList();
          this.showToast('Facture supprimée', 'success');
        },
        error: () => this.showToast('Erreur lors de la suppression.', 'error')
      });
    };

    (window as any)['facLoad'] = (numero: string) => {
      const inv = this.savedInvoices.find(i => i.numero === numero);
      if (!inv) return;
      this.currentInvoice = inv;
      this.renderInvoice(inv);
      const preview = document.getElementById('fac-preview');
      if (preview) { preview.style.display = 'block'; preview.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
    };

    (window as any)['facSetView'] = (view: string) => {
      ['generate', 'consult'].forEach(p => {
        const panel = document.getElementById(`fac-view-${p}`);
        const opt   = document.getElementById(`opt-${p}`);
        if (panel) panel.style.display = view === p ? 'flex' : 'none';
        if (opt)   opt.classList.toggle('active', view === p);
      });
      if (view === 'consult') this.renderConsultList();
    };

    (window as any)['facPrintOne'] = (numero: string) => {
      const inv = this.savedInvoices.find(i => i.numero === numero);
      if (!inv) return;
      this.currentInvoice = inv;
      this.renderInvoice(inv);
      (window as any)['facSetView']('generate');
      const preview = document.getElementById('fac-preview');
      if (preview) preview.style.display = 'block';
      setTimeout(() => window.print(), 350);
    };
  }

  private renderInvoice(inv: SavedInvoice): void {
    const el = document.getElementById('fac-invoice-content');
    if (!el) return;

    const [yy4, mm, dd] = inv.dateFacture.split('-');
    const monthName   = this.MONTH_NAMES[parseInt(mm) - 1];
    const pjTTC       = inv.prixTTC / inv.jours;

    el.innerHTML = `
      <div class="inv-header">
        <div class="inv-brand">
          <div class="inv-logo">LOCA<span>DRIVE</span></div>
          <div class="inv-tagline">Location de véhicules premium</div>
          <div class="inv-contact">contact@locadrive.ma &nbsp;·&nbsp; +212 5XX-XXXXXX &nbsp;·&nbsp; Casablanca, Maroc</div>
        </div>
        <div class="inv-meta">
          <div class="inv-meta-label">FACTURE</div>
          <div class="inv-numero">N° ${inv.numero}</div>
          <div class="inv-meta-date">Date : ${this.fmtDate(inv.dateFacture)}</div>
          <div class="inv-meta-month">${monthName} ${yy4}</div>
        </div>
      </div>

      <div class="inv-divider"></div>

      <div class="inv-parties">
        <div class="inv-party prestataire">
          <div class="inv-party-title">PRESTATAIRE</div>
          <div class="inv-party-name">LOCADRIVE SARL</div>
          <div class="inv-party-detail">123 Boulevard Hassan II, Casablanca</div>
          <div class="inv-party-detail">ICE : 000123456789000</div>
          <div class="inv-party-detail">IF : 56789012</div>
        </div>
        <div class="inv-party client">
          <div class="inv-party-title">CLIENT</div>
          <div class="inv-party-name">${inv.client}</div>
          <div class="inv-party-detail">Véhicule loué : ${inv.marque}</div>
          <div class="inv-party-detail">Matricule : <span class="inv-plate">${inv.matricule}</span></div>
        </div>
      </div>

      <table class="inv-table">
        <thead>
          <tr>
            <th>Description</th>
            <th>Date départ</th>
            <th>Date retour</th>
            <th>Durée</th>
            <th>P.U. HT / jour</th>
            <th>Total HT</th>
            <th>TVA (20%)</th>
            <th>Total TTC</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="inv-desc-cell">
              Location de véhicule<br>
              <span class="inv-sub">${inv.marque} — <span class="inv-plate">${inv.matricule}</span></span>
            </td>
            <td>${this.fmtDate(inv.dateDepart)}</td>
            <td>${this.fmtDate(inv.dateRetour)}</td>
            <td class="inv-center"><strong>${inv.jours}</strong> j</td>
            <td>${this.fmt(inv.prixJourHT)}</td>
            <td class="inv-ht-val">${this.fmt(inv.prixHT)}</td>
            <td class="inv-tva-val">${this.fmt(inv.tva)}</td>
            <td class="inv-ttc-val">${this.fmt(inv.prixTTC)}</td>
          </tr>
        </tbody>
      </table>

      <div class="inv-totals-block">
        <div class="inv-total-row">
          <span class="inv-total-label">Sous-total HT</span>
          <span class="inv-total-val">${this.fmt(inv.prixHT)}</span>
        </div>
        <div class="inv-total-row">
          <span class="inv-total-label">TVA (20%)</span>
          <span class="inv-total-val tva-col">${this.fmt(inv.tva)}</span>
        </div>
        <div class="inv-total-divider"></div>
        <div class="inv-total-row final-row">
          <span class="inv-total-label">TOTAL TTC</span>
          <span class="inv-total-val ttc-col">${this.fmt(inv.prixTTC)}</span>
        </div>
      </div>

      <div class="inv-footer">
        <div class="inv-footer-note">Merci pour votre confiance. Cette facture est générée électroniquement par LOCADRIVE.</div>
        <div class="inv-footer-ref">Réf : ${inv.numero} &nbsp;|&nbsp; LOCADRIVE © ${yy4}</div>
      </div>
    `;
  }

  private renderConsultList(): void {
    const el  = document.getElementById('fac-consult-list');
    const cnt = document.getElementById('fac-count');
    if (cnt) cnt.textContent = `${this.savedInvoices.length} facture${this.savedInvoices.length !== 1 ? 's' : ''}`;
    if (!el) return;
    if (!this.savedInvoices.length) {
      el.innerHTML = `<tr><td colspan="9" class="empty-row">Aucune facture sauvegardée</td></tr>`;
      return;
    }
    el.innerHTML = this.savedInvoices.map(inv => `
      <tr>
        <td class="fac-num-cell">${inv.numero}</td>
        <td class="fac-client-cell">${inv.client}</td>
        <td>${inv.marque}</td>
        <td><span class="plate-sm">${inv.matricule}</span></td>
        <td>${this.fmtDate(inv.dateFacture)}</td>
        <td class="ht-cell">${this.fmt(inv.prixHT)}</td>
        <td class="tva-cell">${this.fmt(inv.tva)}</td>
        <td class="ttc-cell">${this.fmt(inv.prixTTC)}</td>
        <td class="actions-cell">
          <button class="btn-save-local" onclick="facPrintOne('${inv.numero}')">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            Sauvegarder en local
          </button>
          <button class="btn-del-saved" onclick="facDelete('${inv.numero}')">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
          </button>
        </td>
      </tr>
    `).join('');
  }

  private showToast(msg: string, type: string): void {
    const el    = document.getElementById('fac-toast');
    const msgEl = document.getElementById('fac-toast-msg');
    if (!el || !msgEl) return;
    msgEl.textContent = msg;
    el.className = `fac-toast toast-${type} show`;
    setTimeout(() => el.classList.remove('show'), 3200);
  }

  private set(id: string, html: string): void {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
  }
}
