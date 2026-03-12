import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'front-end-LOCA';

  constructor(private auth: AuthService) {}

  ngOnInit(): void {
    // Apply role class to body for CSS-based RBAC visibility
    const role = this.auth.getRole();
    if (role) {
      document.body.classList.add(`role-${role}`);
    }

    // Global logout function accessible from all HTML templates via onclick="doLogout()"
    (window as any).doLogout = () => {
      this.auth.logout();
      document.body.className = document.body.className.replace(/role-\S+/g, '').trim();
      window.location.href = '/login';
    };
  }
}
