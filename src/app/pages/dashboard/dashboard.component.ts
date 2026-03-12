import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../shared/sidebar.component';
import { AuthService } from '../../core/services/auth.service';
import { HttpClient } from '@angular/common/http';
import { API_BASE } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, SidebarComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  today: Date = new Date();
  totalOperations   = 0;
  maintenancesCount = 0;
  chiffreAffaire    = 0;
  facturesCount     = 0;
  vehiculesDispos   = 0;
  totalVehicules    = 0;
  recentOps: any[]  = [];

  userName = '';
  userRole = '';

  constructor(private http: HttpClient, private auth: AuthService) {
    const user = this.auth.getUser();
    this.userName = user?.username || 'Utilisateur';
    this.userRole = user?.role || '';
  }

  /** Positive = days left, negative = overdue */
  daysRemaining(dateRetour: string): number {
    const today = new Date(); today.setHours(0,0,0,0);
    const end   = new Date(dateRetour.split('T')[0]); end.setHours(0,0,0,0);
    return Math.round((end.getTime() - today.getTime()) / 86_400_000);
  }

  daysLabel(dateRetour: string): string {
    const d = this.daysRemaining(dateRetour);
    if (d === 0)  return 'Auj.';
    if (d > 0)    return `+${d}J`;
    return `${d}J`;
  }

  ngOnInit(): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Load vehicules + operations together to compute real availability
    Promise.all([
      this.http.get<any[]>(`${API_BASE}/vehicules`).toPromise(),
      this.http.get<any[]>(`${API_BASE}/operations`).toPromise()
    ]).then(([vehicules, ops]) => {
      const vehicles = vehicules ?? [];
      const operations = ops ?? [];

      this.totalVehicules  = vehicles.length;
      this.chiffreAffaire  = operations.reduce((s, o) => s + (o.prixTTC || o.total || 0), 0);

      // Only count operations where the car hasn't returned yet (dateRetour >= today)
      const activeOps = operations.filter(o => {
        const end = new Date((o.dateRetour ?? '').split('T')[0]);
        end.setHours(0, 0, 0, 0);
        return end >= today;
      });
      this.totalOperations = activeOps.length;

      // Show all ongoing + recently overdue (last 7 days) sorted by dateRetour asc
      this.recentOps = operations
        .filter(o => {
          const end = new Date((o.dateRetour ?? '').split('T')[0]);
          end.setHours(0, 0, 0, 0);
          const diffDays = Math.round((end.getTime() - today.getTime()) / 86_400_000);
          return diffDays >= -7; // active + max 7 days overdue
        })
        .sort((a, b) => {
          const da = new Date((a.dateRetour ?? '').split('T')[0]);
          const db = new Date((b.dateRetour ?? '').split('T')[0]);
          return da.getTime() - db.getTime();
        });

      // Matricules currently rented (dateDepart <= today <= dateRetour)
      const rentedMatricules = new Set(
        operations
          .filter(o => {
            const start = new Date((o.dateDepart  ?? '').split('T')[0]);
            const end   = new Date((o.dateRetour  ?? '').split('T')[0]);
            start.setHours(0, 0, 0, 0);
            end.setHours(0, 0, 0, 0);
            return start <= today && today <= end;
          })
          .map(o => (o.matricule ?? '').trim().toUpperCase())
      );

      this.vehiculesDispos = vehicles.filter(
        v => !rentedMatricules.has((v.matricule ?? '').trim().toUpperCase())
      ).length;
    });

    const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD

    this.http.get<any[]>(`${API_BASE}/maintenances`).subscribe({
      next: m => {
        const heavyTypes = new Set(['TOLERIE', 'MECANIQUE', 'ELECTRIQUE']);
        // Count distinct vehicles with a heavy maintenance dated today
        const inShopToday = new Set(
          m.filter(r =>
            heavyTypes.has((r.type ?? '').toUpperCase()) &&
            (r.date ?? '').split('T')[0] === todayStr
          ).map(r => (r.matricule ?? '').trim().toUpperCase())
        );
        this.maintenancesCount = inShopToday.size;
      }
    });

    this.http.get<any[]>(`${API_BASE}/factures`).subscribe({
      next: f => { this.facturesCount = f.length; }
    });
  }
}
