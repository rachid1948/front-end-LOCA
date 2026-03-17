import { Component, AfterViewInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../shared/sidebar.component';
import { MaintenanceService } from '../../core/services/maintenance.service';

interface VehiculeVidange {
  id: number;
  vehiculeId: number;
  nom: string;
  matricule: string;
  dateVidange: string;
  kmProchain: number;
}

@Component({
  selector: 'app-vidange',
  standalone: true,
  imports: [CommonModule, SidebarComponent],
  templateUrl: './vidange.component.html',
  styleUrls: ['./vidange.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class VidangeComponent implements AfterViewInit {

  vehicles: VehiculeVidange[] = [];
  currentIndex = -1;

  constructor(private maintenanceService: MaintenanceService) {}

  private isoToFr(iso: string): string {
    if (!iso) return '';
    const [y, m, d] = iso.split('T')[0].split('-');
    return `${d}/${m}/${y}`;
  }

  loadAll() {
    this.maintenanceService.getByType('VIDANGE').subscribe({
      next: (data: any[]) => {
        this.vehicles = data.map(m => ({
          id: m.id,
          vehiculeId: m.vehiculeId,
          nom: `${m.vehiculeMarque ?? ''} ${m.vehiculeModele ?? ''}`.trim(),
          matricule: m.matricule ?? '',
          dateVidange: this.isoToFr(m.date),
          kmProchain: m.kilometrage ?? 0,
        }));
        this.renderTable();
      },
      error: () => this.renderTable()
    });
  }

  renderTable() {
    const tbody = document.getElementById('vidange-tbody');
    if (!tbody) return;
    tbody.innerHTML = this.vehicles.map((v, i) => `
      <tr>
        <td class="nom-cell">${v.nom}</td>
        <td><span class="plate">${v.matricule}</span></td>
        <td class="date-cell">${v.dateVidange}</td>
        <td><span class="km-badge">${v.kmProchain.toLocaleString('fr-FR')} km</span></td>
        <td>
          <button class="btn-edit" onclick="openVidangeModal(${i})">
            <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            Modifier
          </button>
        </td>
      </tr>
    `).join('');
  }

  openModal(index: number) {
    this.currentIndex = index;
    const v = this.vehicles[index];
    const modal = document.getElementById('vidange-modal');
    const modalNom = document.getElementById('modal-nom');
    const modalPlate = document.getElementById('modal-plate');
    const inputDate = document.getElementById('modal-date') as HTMLInputElement;
    const inputKm = document.getElementById('modal-km') as HTMLInputElement;
    if (!modal || !modalNom || !modalPlate || !inputDate || !inputKm) return;

    modalNom.textContent = v.nom;
    modalPlate.textContent = v.matricule;

    // Convert dd/mm/yyyy → yyyy-mm-dd for date input
    const parts = v.dateVidange.split('/');
    inputDate.value = `${parts[2]}-${parts[1]}-${parts[0]}`;
    inputKm.value = v.kmProchain.toString();

    modal.classList.add('open');
    inputDate.focus();
  }

  closeModal() {
    const modal = document.getElementById('vidange-modal');
    modal?.classList.remove('open');
    this.currentIndex = -1;
  }

  saveModal() {
    if (this.currentIndex < 0) return;
    const inputDate = document.getElementById('modal-date') as HTMLInputElement;
    const inputKm = document.getElementById('modal-km') as HTMLInputElement;
    if (!inputDate || !inputKm) return;

    const raw = inputDate.value; // yyyy-mm-dd
    if (!raw) return;
    const [y, m, d] = raw.split('-');
    const formatted = `${d}/${m}/${y}`;
    const km = parseInt(inputKm.value, 10);
    if (isNaN(km) || km < 0) return;

    const v = this.vehicles[this.currentIndex];
    const body = { vehiculeId: v.vehiculeId, type: 'VIDANGE', description: 'Vidange', cout: 0, date: raw, kilometrage: km };
    this.maintenanceService.update(v.id, body).subscribe({
      next: () => {
        this.closeModal();
        this.loadAll();
        const toast = document.getElementById('vidange-toast');
        if (toast) { toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 3000); }
      },
      error: () => {
        this.closeModal();
        const toast = document.getElementById('vidange-toast');
        if (toast) { toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 3000); }
      }
    });
  }

  ngAfterViewInit() {
    (window as any)['openVidangeModal'] = (i: number) => this.openModal(i);
    (window as any)['closeVidangeModal'] = () => this.closeModal();
    (window as any)['saveVidangeModal'] = () => this.saveModal();

    // Close on backdrop click
    const modal = document.getElementById('vidange-modal');
    modal?.addEventListener('click', (e) => {
      if ((e.target as Element).id === 'vidange-modal') this.closeModal();
    });

    setTimeout(() => this.loadAll(), 0);
  }
}
