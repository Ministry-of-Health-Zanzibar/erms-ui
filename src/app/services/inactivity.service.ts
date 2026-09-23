// import { Injectable, NgZone } from '@angular/core';
// import { Router } from '@angular/router';

// @Injectable({
//   providedIn: 'root'
// })
// export class InactivityService {

//   private timeout: any;
//   private readonly idleTime = 1 * 60 * 1000; 

//   constructor(private router: Router, private ngZone: NgZone) {}

//   startWatching() {
//     this.resetTimer();

//     window.addEventListener('mousemove', () => this.resetTimer());
//     window.addEventListener('keydown', () => this.resetTimer());
//     window.addEventListener('click', () => this.resetTimer());
//   }

//   resetTimer() {
//     clearTimeout(this.timeout);

//     this.timeout = setTimeout(() => {
//       this.showWarning();
//     }, this.idleTime);
//   }

//   showWarning() {
//     Swal.fire({
//       icon: 'warning',
//       title: 'Session Timeout',
//       text: 'You have been inactive for 5 minutes. Do you want to continue?',
//       showCancelButton: true,
//       confirmButtonText: 'Yes, Continue',
//       cancelButtonText: 'Logout'
//     }).then((result) => {

//       if (result.isConfirmed) {
//         this.resetTimer(); 
//       } else {
//         this.logout();
//       }

//     });
//   }

//   logout() {
//     localStorage.clear();
//     this.ngZone.run(() => {
//       this.router.navigateByUrl('/auth/sign-in');
//     });
//   }
// }
