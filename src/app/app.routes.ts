import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { SaisirOperationComponent } from './pages/saisir-operation/saisir-operation.component';
import { DisponibiliteComponent } from './pages/disponibilite/disponibilite.component';
import { ParcHubComponent } from './pages/parc-hub/parc-hub.component';
import { ParcComponent } from './pages/parc/parc.component';
import { AjouterVehiculeComponent } from './pages/ajouter-vehicule/ajouter-vehicule.component';
import { VidangeComponent } from './pages/vidange/vidange.component';
import { VisiteTechniqueComponent } from './pages/visite-technique/visite-technique.component';
import { OperationsComponent } from './pages/operations/operations.component';
import { ChiffreAffaireComponent } from './pages/chiffre-affaire/chiffre-affaire.component';
import { MaintenanceComponent } from './pages/maintenance/maintenance.component';
import { StatistiquesComponent } from './pages/statistiques/statistiques.component';
import { FacturesComponent } from './pages/factures/factures.component';
import { AssuranceHubComponent } from './pages/assurance-hub/assurance-hub.component';
import { AssuranceComponent } from './pages/assurance/assurance.component';
import { VignetteComponent } from './pages/vignette/vignette.component';
import { UsersComponent } from './pages/users/users.component';
import { VerifyAccountComponent } from './pages/verify-account/verify-account.component';
import { ForgotPasswordComponent } from './pages/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './pages/reset-password/reset-password.component';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard, statsGuard, usersGuard } from './core/guards/role.guard';

const guard      = [authGuard];
const adminOnly  = [authGuard, adminGuard];
const statsOnly  = [authGuard, statsGuard];
const usersAccess = [authGuard, usersGuard];

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // Public auth pages
  { path: 'login',            component: LoginComponent },
  { path: 'verify-account',   component: VerifyAccountComponent },
  { path: 'forgot-password',  component: ForgotPasswordComponent },
  { path: 'reset-password',   component: ResetPasswordComponent },

  // Protected pages - all roles
  { path: 'dashboard',        component: DashboardComponent,       canActivate: guard },
  { path: 'operations',       component: OperationsComponent,      canActivate: guard },
  { path: 'chiffre-affaire',  component: ChiffreAffaireComponent,  canActivate: guard },
  { path: 'saisir-operation', component: SaisirOperationComponent, canActivate: guard },
  { path: 'disponibilite',    component: DisponibiliteComponent,   canActivate: guard },
  { path: 'parc',             component: ParcHubComponent,         canActivate: guard },
  { path: 'parc-liste',       component: ParcComponent,            canActivate: guard },
  { path: 'vidange',          component: VidangeComponent,         canActivate: guard },
  { path: 'visite-technique', component: VisiteTechniqueComponent, canActivate: guard },
  { path: 'maintenance',      component: MaintenanceComponent,     canActivate: guard },
  { path: 'factures',         component: FacturesComponent,        canActivate: guard },
  { path: 'assurance-hub',    component: AssuranceHubComponent,    canActivate: guard },
  { path: 'assurance',        component: AssuranceComponent,       canActivate: guard },
  { path: 'vignette',         component: VignetteComponent,        canActivate: guard },

  // Protected pages - ADMIN only
  { path: 'ajouter-vehicule', component: AjouterVehiculeComponent, canActivate: adminOnly },

  // Protected pages - ADMIN + GERANT only
  { path: 'statistiques',     component: StatistiquesComponent,    canActivate: statsOnly },
  { path: 'users',            component: UsersComponent,           canActivate: usersAccess },
];
