import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../shared/sidebar.component';

@Component({
  selector: 'app-assurance-hub',
  standalone: true,
  imports: [CommonModule, SidebarComponent],
  templateUrl: './assurance-hub.component.html',
  styleUrl: './assurance-hub.component.scss'
})
export class AssuranceHubComponent {}
