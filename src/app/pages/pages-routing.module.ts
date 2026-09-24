import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../services/authentication/auth.guard';

const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./common/common.component').then(c => c.CommonComponent),
    canActivate: [AuthGuard],
    children: [

      {
        path: 'dashboard',
        loadChildren: () => import('./dashboard/dashboard.module').then(m => m.DashboardModule)
      },
      {
        path: 'users/permission',
        loadChildren: () => import('./users/permission/permission.module').then(m => m.PermissionModule)
      },
      {
        path: 'users/role-permission',
        loadChildren: () => import('./users/role-permission/role-permission.module').then(m => m.RolePermissionModule)
      },
      {
        path: 'config/country',
        loadChildren: () => import('./system-config/country/country.module').then(m => m.CountryModule)
      },
      {
        path:'config/location',
        loadChildren:()=>import('./system-config/locations/locations.module').then(m=>m.LocationsModule)
      },
      {
        path:'config/diagnosis',
        loadComponent:()=>import('./system-config/diagnosis/view-diagnosis/view-diagnosis.component').then(c=>c.ViewDiagnosisComponent)

      },
      {
        path:'config/hospital',
        loadChildren:()=>import('./system-config/hospital/hospital.module').then(m=>m.HospitalModule)

      },
      {

        path:'config/referal-type',
        loadChildren:()=>import('./system-config/referal-type/referal-type.module').then(m=>m.ReferalTypeModule)

      },
      {


        path:'config/reasons',
        loadChildren:()=>import('./system-config/reasons/reasons.module').then(m=>m.ReasonsModule)

      },

      {
          path:'config/referrals',
          loadChildren:()=>import('./referrals/referrals.module').then(m=>m.ReferralsModule)

      },

      {
        path:'config/bill',
        loadChildren:()=>import('./system-config/bill/bill.module').then(m=>m.BillModule)

      },
      {
        path:'users',
        loadChildren:()=> import('./users/usermanag/usermanag.module').then(m=>m.UsermanagModule)
      },
      {
        path: 'audit-logs',
        loadComponent: () => import('./audit-logs/audit-logs.component').then(c => c.AuditLogsComponent),
      },
      {
        path:'config/work-station',
        loadChildren:()=>import('./system-config/workstation/workstation.module').then(m=>m.WorkstationModule)
      },
      {
        path:'config/employer',
        loadChildren:()=>import('./system-config/employer/employer.module').then(m=>m.EmployerModule)
      },
      {
        path:'config/employer-type',
        loadChildren:()=>import('./system-config/employer-type/employer-type.module').then(m=>m.EmployerTypeModule)

      },
      {
        path: 'user-profile',
        loadChildren: () => import('./user-profile/user-profile.module').then(m => m.UserProfileModule)
      },
      {
        path:'patient',
        loadChildren:() => import('./partient/partient.module').then(m=>m.PartientModule)

      },
      {
        path:'accounts',
        loadChildren:()=>import('./accountants/account/account.module').then(m=>m.AccountModule)

      },


      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard'
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PagesRoutingModule { }
