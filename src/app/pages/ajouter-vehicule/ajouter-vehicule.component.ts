import { Component, AfterViewInit, ViewEncapsulation } from '@angular/core';
import { SidebarComponent } from '../../shared/sidebar.component';
import { Router } from '@angular/router';
import { VehiculeService } from '../../core/services/vehicule.service';

@Component({
  selector: 'app-ajouter-vehicule',
  standalone: true,
  imports: [SidebarComponent],
  templateUrl: './ajouter-vehicule.component.html',
  styleUrl: './ajouter-vehicule.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class AjouterVehiculeComponent implements AfterViewInit {
  constructor(private vehiculeService: VehiculeService, private router: Router) {}

  ngAfterViewInit(): void {
    const form = document.querySelector('.form-card form, .form-card') as HTMLElement;

    (window as any)['ajouterVehicule'] = () => this.submit();

    // Wire submit button if form exists
    const submitBtn = document.querySelector('.btn-submit') as HTMLButtonElement;
    if (submitBtn) {
      submitBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.submit();
      });
    }
  }

  private submit(): void {
    const get = (id: string) => (document.getElementById(id) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement)?.value?.trim() || '';

    const marque    = get('marque');
    const modele    = get('modele');
    const matricule = get('matricule');
    const statut    = get('statut') || 'DISPONIBLE';
    const remarques = get('remarques');

    // Parse couleur and annee from remarques or defaults
    const annee = new Date().getFullYear();

    if (!modele || !matricule) {
      this.showToast('Modèle et matricule sont requis.', 'error');
      return;
    }

    const body = {
      marque: marque || 'Autre',
      modele,
      matricule: matricule.toUpperCase(),
      couleur: remarques || 'Non spécifié',
      annee,
      carburant: 'Essence',
      statut: statut.toUpperCase()
    };

    const btn = document.querySelector('.btn-submit') as HTMLButtonElement;
    if (btn) btn.disabled = true;

    this.vehiculeService.create(body).subscribe({
      next: () => {
        this.showToast('Véhicule ajouté avec succès !', 'success');
        setTimeout(() => this.router.navigate(['/parc-liste']), 1500);
      },
      error: (err) => {
        const msg = err.error?.message || 'Erreur lors de l\'ajout du véhicule.';
        this.showToast(msg, 'error');
        if (btn) btn.disabled = false;
      }
    });
  }

  private showToast(msg: string, type: string): void {
    let toast = document.getElementById('av-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'av-toast';
      toast.style.cssText = 'position:fixed;bottom:24px;right:24px;padding:14px 22px;border-radius:10px;font-size:0.9rem;font-weight:600;color:#fff;z-index:9999;transition:opacity 0.3s;';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.background = type === 'success' ? '#00e676' : '#ff4757';
    toast.style.opacity = '1';
    setTimeout(() => { toast!.style.opacity = '0'; }, 3000);
  }
}
