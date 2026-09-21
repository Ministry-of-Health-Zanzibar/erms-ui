import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  // {
  //   path:'',
  //   loadComponent:()=>import('./view-referal-type/view-referal-type.component').then(c=>c.ViewReferalTypeComponent)
  // }

  {
    path: '',
    loadComponent: () =>
      import('./view-referrals/view-referrals.component').then(
        (c) => c.ViewReferralsComponent
      ),
  },
  {
    path:'searchfollow-up',
    loadComponent:() => 
      import('./followup/searchfollow-up/searchfollow-up.component').then(
        (c)=> c.SearchfollowUpComponent
      )

  },
  {
    path:'viewbillbyhospital/:id',
    loadComponent: () =>
      import('./bill/viewbillbyhospital/viewbillbyhospital.component').then(
        (c)=> c.ViewbillbyhospitalComponent
      )

  },
  {
    path: 'bill',
    loadComponent: () =>
      import('./referralwithbills/referralwithbills.component').then(
        (c) => c.ReferralwithbillsComponent
      ),
  },

  {
    path: 'bill-file-list',
    loadComponent: () =>
      import('./bill/bill-file-list/bill-file-list.component').then(
        (c) => c.BillFileListComponent
      ),
  },

  {
    path: 'more-bill-file/:id',
    loadComponent: () =>
      import('./bill/bill-file-by-id/bill-file-by-id.component').then(
        (c) => c.BillFileByIdComponent
      ),
  },

  {
    path: 'bill-by-hospital',
    loadComponent: () =>
      import(
        './bill/bill-fill-by-hospital/bill-fill-by-hospital.component'
      ).then((c) => c.BillFillByHospitalComponent),
  },

  {
    path: 'view-follow-up/:id',
    loadComponent: () =>
      import('./followup/view-follow-up/view-follow-up.component').then(
        (c) => c.ViewFollowUpComponent
      ),
  },

  {
    path: 'bills-details/:id',
    loadComponent: () =>
      import('./bill/bills-details/bills-details.component').then(
        (c) => c.BillsDetailsComponent
      ),
  },

  {
    path: 'more/:id',
    loadComponent: () =>
      import('./referral-details/referral-details.component').then(
        (c) => c.ReferralDetailsComponent
      ),
  },

  {
    path: 'individual-report/:id',
    loadComponent:()=> import('./individualreport/individualreport.component').then(c=>c.IndividualreportComponent)

  },
  {
    path: 'dialog',
    loadComponent: () =>
      import('./referral-status-dialog/referral-status-dialog.component').then(
        (c) => c.ReferralStatusDialogComponent
      ),
  },
 

  {
    path: 'referralsLetter',
    loadComponent: () =>
      import('./referrals-letter/referrals-letter.component').then(
        (c) => c.ReferralsLetterComponent
      ),
  },
  {
    path: 'confirm0000111101',
    loadComponent: () =>
      import('./view-referal-confirm/view-referal-confirm.component').then(
        (c) => c.ViewReferalConfirmComponent
      ),
  },
  {
    path: 'billpayments/:id',
    loadComponent: () =>
      import('./billpayment/billpayment.component').then(
        (c) => c.BillpaymentComponent
      ),
  },
  {
    path: 'monthbill00998778',
    loadComponent: () =>
      import('./month-bill/month-bill.component').then(
        (c) => c.MonthBillComponent
      ),
  },
  {
    path: 'monthbill/:id',
    loadComponent: () =>
      import('./more-month-bill/more-month-bill.component').then(
        (c) => c.MoreMonthBillComponent
      ),
  },

  {
    path: 'payment-details/:id',
    loadComponent: () =>
      import('./payment-details/payment-details.component').then(
        (c) => c.PaymentDetailsComponent
      ),
  },

  {
    path: 'bill-iterm-list',
    loadComponent: () =>
      import('./bill/bill-items-list/bill-items-list.component').then(
        (c) => c.BillItemsListComponent
      ),
  },

  {
    path: 'bill-iterm-form',
    loadComponent: () =>
      import('./bill/bill-iterm-form/bill-iterm-form.component').then(
        (c) => c.BillItermFormComponent
      ),
  },

  {
    path: 'bill-iterm-details/:id',
    loadComponent: () =>
      import('./bill/bill-iterm-details/bill-iterm-details.component').then(
        (c) => c.BillItermDetailsComponent
      ),
  },

  {
    path: 'bill-iterm-by-id/:id',
    loadComponent: () =>
      import('./bill/bill-iterm-by-id/bill-iterm-by-id.component').then(
        (c) => c.BillItermByIdComponent
      ),
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ReferralsRoutingModule {}
