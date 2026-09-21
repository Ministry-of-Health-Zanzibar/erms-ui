import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'top-diagnoses',
    loadComponent: () => import('./top-diagnoses/top-diagnoses.component').then(c => c.TopDiagnosesComponent),
  },
  {
    path: '',
    loadComponent: () =>
      import('./viewpartient/viewpartient.component').then(
        (c) => c.ViewpartientComponent
      ),
  },
  {
    path: 'insurances0000011111',
    loadComponent: () =>
      import('./viewinsurances/viewinsurances.component').then(
        (c) => c.ViewinsurancesComponent
      ),
  },
  {
    path: 'more/:id',
    loadComponent: () =>
      import('./displaymoredata/displaymoredata.component').then(
        (c) => c.DisplaymoredataComponent
      ),
  },
  {
    path: 'referralreport0990',
    loadComponent: () =>
      import('./referralrangereport/referralrangereport.component').then(
        (c) => c.ReferralrangereportComponent
      ),
  },
  {
    path: 'searchreport99990000',
    loadComponent: () =>
      import('./referralsearchreport/referralsearchreport.component').then(
        (c) => c.ReferralsearchreportComponent
      ),
  },
  {
    path: 'bodylist',
    loadComponent: () =>
      import('./bodyform-list/bodyform-list.component').then(
        (c) => c.BodyformListComponent
      ),
  },
  {
    path: 'bodylist/:id',
    loadComponent: () =>
      import('./body-list-more/body-list-more.component').then(
        (c) => c.BodyListMoreComponent
      ),
  },

  {
    path: 'partient',
    loadComponent: () =>
      import('./patiant/patiant.component').then((c) => c.PatiantComponent),
  },
  {
    path: 'patientfromhospital',
    loadComponent:()=>import('./viewpatientfromhospital/viewpatientfromhospital.component').then(c=>c.ViewpatientfromhospitalComponent)

  },


   {
    path: 'patient/:id',
    loadComponent: () =>
      import('./patient-details/patient-details.component').then(
        (c) => c.PatientDetailsComponent
      ),
  },


   {
    path: 'patient-table/:id',
    loadComponent: () =>
      import('./patient-history-table/patient-history-table.component').then(
        (c) => c.PatientHistoryTableComponent
      ),
  },
  {
    path:'patientfromhospital/:id',
    loadComponent:()=>import('./viewpatientfromhospitalbyid/viewpatientfromhospitalbyid.component').then(c=>c.ViewpatientfromhospitalbyidComponent)

  },


   {
    path:'medical-history',
    loadComponent:() => import('./addmedicalhistory/addmedicalhistory.component').then(c=>c.AddmedicalhistoryComponent)

  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PartientRoutingModule {}
