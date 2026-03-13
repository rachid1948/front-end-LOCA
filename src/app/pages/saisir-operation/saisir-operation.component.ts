import { Component, AfterViewInit, ViewEncapsulation } from '@angular/core';
import { SidebarComponent } from '../../shared/sidebar.component';
import { Router } from '@angular/router';
import { VehiculeService } from '../../core/services/vehicule.service';
import { OperationService } from '../../core/services/operation.service';

@Component({
  selector: 'app-saisir-operation',
  standalone: true,
  imports: [SidebarComponent],
  templateUrl: './saisir-operation.component.html',
  styleUrl: './saisir-operation.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class SaisirOperationComponent implements AfterViewInit {
  constructor(
    private vehiculeService: VehiculeService,
    private operationService: OperationService,
    private router: Router
  ) {}

  ngAfterViewInit(): void {
    this.loadVehicules();
    this.bindDateCalc();
    (window as any)['saisirSubmit'] = () => this.submit();
    (window as any)['toggleRetourInconnu'] = () => this.toggleRetourInconnu();
  }

  private toggleRetourInconnu(): void {
    const cb = document.getElementById('retourInconnu') as HTMLInputElement;
    const inputRetour = document.getElementById('dateRetour') as HTMLInputElement;
    const recapAttente = document.getElementById('recap-attente') as HTMLElement;
    const recapResult  = document.getElementById('recap-result')  as HTMLElement;
    const recapOpen    = document.getElementById('recap-open')    as HTMLElement;

    if (cb.checked) {
      inputRetour.value = '';
      inputRetour.disabled = true;
      recapAttente.style.display = 'none';
      recapResult.style.display  = 'none';
      recapOpen.style.display    = 'flex';
    } else {
      inputRetour.disabled = false;
      recapOpen.style.display    = 'none';
      recapAttente.style.display = 'flex';
    }
  }

  private loadVehicules(dateDepart?: string, dateRetour?: string): void {
    const select = document.getElementById('vehiculeId') as HTMLSelectElement;
    if (!select) return;
    select.innerHTML = '<option value="" disabled selected>Chargement...</option>';

    const obs = (dateDepart && dateRetour)
      ? this.vehiculeService.getDisponibles(dateDepart, dateRetour)
      : this.vehiculeService.getAll();

    obs.subscribe({
      next: (vehicules) => {
        if (vehicules.length === 0) {
          select.innerHTML = '<option value="" disabled selected>Aucune voiture disponible pour ces dates</option>';
          return;
        }
        select.innerHTML = '<option value="" disabled selected>Sélectionner une voiture</option>' +
          vehicules.map(v =>
            `<option value="${v.id}">${v.marque} ${v.modele} — ${v.matricule}</option>`
          ).join('');
      },
      error: () => {
        select.innerHTML = '<option value="" disabled selected>Erreur de chargement</option>';
      }
    });
  }

  private bindDateCalc(): void {
    const dateDepart   = document.getElementById('dateDepart')   as HTMLInputElement;
    const dateRetour   = document.getElementById('dateRetour')   as HTMLInputElement;
    const prixJour     = document.getElementById('prixJour')     as HTMLInputElement;
    const avanceInput  = document.getElementById('avance')       as HTMLInputElement;
    const recapAttente = document.getElementById('recap-attente') as HTMLElement;
    const recapResult  = document.getElementById('recap-result')  as HTMLElement;
    const recapOpen    = document.getElementById('recap-open')    as HTMLElement;
    const nbJoursEl    = document.getElementById('nbJours')       as HTMLElement;
    const prixAfficheEl = document.getElementById('prixAffiche') as HTMLElement;
    const avanceEl     = document.getElementById('avanceAffichee') as HTMLElement;
    const totalEl      = document.getElementById('totalPrix')     as HTMLElement;
    const resteEl      = document.getElementById('resteAffiche')  as HTMLElement;

    // Rechargement des voitures UNIQUEMENT quand les deux dates changent
    const reloadVehicules = () => {
      const cb = document.getElementById('retourInconnu') as HTMLInputElement;
      if (cb?.checked) return; // location ouverte — pas de filtre par dates
      if (dateDepart.value && dateRetour.value) {
        const d1 = new Date(dateDepart.value), d2 = new Date(dateRetour.value);
        if (d2 > d1) this.loadVehicules(dateDepart.value, dateRetour.value);
      }
    };

    // Calcul du récap (sans recharger la liste de voitures)
    const calculer = () => {
      const cb = document.getElementById('retourInconnu') as HTMLInputElement;
      if (cb?.checked) return; // location ouverte — pas de récap
      const d1   = new Date(dateDepart.value);
      const d2   = new Date(dateRetour.value);
      const prix = parseFloat(prixJour.value);
      if (dateDepart.value && dateRetour.value && d2 > d1 && !isNaN(prix) && prix > 0) {
        const jours = Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
        const total = jours * prix;
        const avance = Math.max(0, parseFloat(avanceInput?.value) || 0);
        const reste = Math.max(0, total - avance);
        nbJoursEl.textContent       = `${jours} jour${jours > 1 ? 's' : ''}`;
        prixAfficheEl.textContent   = `${prix.toLocaleString('fr-FR')} DH / jour`;
        avanceEl.textContent        = `${avance.toLocaleString('fr-FR')} DH`;
        totalEl.textContent         = `${total.toLocaleString('fr-FR')} DH`;
        resteEl.textContent         = `${reste.toLocaleString('fr-FR')} DH`;
        recapAttente.style.display = 'none';
        recapResult.style.display  = 'flex';
        if (recapOpen) recapOpen.style.display = 'none';
      } else {
        recapAttente.style.display = 'flex';
        recapResult.style.display  = 'none';
      }
    };

    dateDepart?.addEventListener('change', () => { reloadVehicules(); calculer(); });
    dateRetour?.addEventListener('change', () => { reloadVehicules(); calculer(); });
    prixJour?.addEventListener('input', calculer);
    avanceInput?.addEventListener('input', calculer);
  }

  private submit(): void {
    const get = (id: string) => (document.getElementById(id) as HTMLInputElement | HTMLSelectElement)?.value?.trim() || '';
    const client        = get('client');
    const vehiculeId    = parseInt(get('vehiculeId'), 10);
    const dateDepart    = get('dateDepart');
    const prixJour      = parseFloat(get('prixJour'));
    const avance        = Math.max(0, parseFloat(get('avance')) || 0);
    const retourInconnu = (document.getElementById('retourInconnu') as HTMLInputElement)?.checked;
    const dateRetour    = retourInconnu ? null : get('dateRetour');

    if (!client || !vehiculeId || !dateDepart || isNaN(prixJour) || prixJour <= 0) {
      this.showToast('Veuillez remplir tous les champs obligatoires.', 'error');
      return;
    }
    if (!retourInconnu) {
      if (!dateRetour) {
        this.showToast('Veuillez saisir une date de retour ou cocher "Retour inconnu".', 'error');
        return;
      }
      if (new Date(dateRetour) <= new Date(dateDepart)) {
        this.showToast('La date de retour doit être après la date de départ.', 'error');
        return;
      }
    }

    const body: any = { client, vehiculeId, dateDepart, prixJour, avance };
    if (dateRetour) body.dateRetour = dateRetour;

    const btn = document.querySelector('.btn-submit') as HTMLButtonElement;
    if (btn) btn.disabled = true;

    this.operationService.create(body).subscribe({
      next: () => {
        this.showToast('Opération enregistrée avec succès !', 'success');
        setTimeout(() => this.router.navigate(['/operations']), 1500);
      },
      error: (err) => {
        const msg = err.error?.message || 'Erreur lors de l\'enregistrement.';
        this.showToast(msg, 'error');
        if (btn) btn.disabled = false;
      }
    });
  }

  private showToast(msg: string, type: string): void {
    const el = document.getElementById('saisir-toast');
    if (!el) return;
    el.textContent = msg;
    el.style.background = type === 'success' ? 'rgba(0,230,118,0.15)' : 'rgba(255,71,87,0.15)';
    el.style.color = type === 'success' ? '#00e676' : '#ff4757';
    el.style.border = `1px solid ${type === 'success' ? '#00e67644' : '#ff475744'}`;
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 3500);
  }
}

