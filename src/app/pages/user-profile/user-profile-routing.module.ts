import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'profile',
    title: 'My Profile',
    loadComponent: () => import('./talent-profile/talent-profile.component').then(c => c.TalentProfileComponent)
  },
  {
    path: 'talent-profile',
    pathMatch: 'full',
    redirectTo: 'profile'
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UserProfileRoutingModule { }
