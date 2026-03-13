import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../shared/sidebar.component';

@Component({
  selector: 'app-parc-hub',
  standalone: true,
  imports: [CommonModule, SidebarComponent],
  templateUrl: './parc-hub.component.html',
  styleUrls: ['./parc-hub.component.scss']
})
export class ParcHubComponent {}
