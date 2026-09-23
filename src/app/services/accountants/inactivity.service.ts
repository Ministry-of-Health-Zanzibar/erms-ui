import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class InactivityService {

  // private timeout: any;
  // private countdownInterval: any;
  // private readonly logoutDelay = 600000000; // Show dialog after 10s
  // private readonly countdownSeconds = 59;


  // constructor(private router: Router, private ngZone: NgZone) {}

  // initListener(): void {
  //   this.resetTimeout();
  //   ['mousemove', 'keydown', 'click'].forEach(event =>
  //     window.addEventListener(event, () => this.resetTimeout())
  //   );
  // }

  // private resetTimeout(): void {
  //   clearTimeout(this.timeout);
  //   clearInterval(this.countdownInterval);

  //   this.timeout = setTimeout(() => {
  //     this.ngZone.run(() => this.showCountdownPopup());
  //   }, this.logoutDelay);
  // }

  // private showCountdownPopup(): void {
  //   // ✅ Ignore if on login page
  //   const currentUrl = this.router.url;
  //   if (currentUrl.includes('/auth/sign-in') || currentUrl.includes('/login')) {
  //     return;
  //   }

  //   let secondsLeft = this.countdownSeconds;

  //   Swal.fire({
  //     title: '⚠️ Session Timeout',
  //     html: `You will be logged out in <b>${secondsLeft}</b> seconds due to inactivity.`,
  //     icon: 'warning',
  //     showCancelButton: true,
  //     cancelButtonText: 'Stay Logged In',
  //     confirmButtonText: 'Logout Now',
  //     allowOutsideClick: false,
  //     allowEscapeKey: false,
  //     customClass: {
  //       popup: 'sweet-dialog'
  //     },
  //     didOpen: () => {
  //       const content = Swal.getHtmlContainer()?.querySelector('b');
  //       const popup = Swal.getPopup();

  //       this.countdownInterval = setInterval(() => {
  //         secondsLeft--;

  //         if (content) content.textContent = secondsLeft.toString();

  //         if (secondsLeft <= 5 && popup) {
  //           popup.style.border = '3px solid red';
  //           popup.style.boxShadow = '0 0 25px red';

  //           if (secondsLeft === 5) {
  //             //this.audio.play();
  //           }
  //         }

  //         if (secondsLeft <= 0) {
  //           clearInterval(this.countdownInterval);
  //           Swal.close();
  //           this.forceLogout();
  //         }
  //       }, 1000);
  //     }
  //   }).then(result => {
  //     clearInterval(this.countdownInterval);
  //     if (result.dismiss === Swal.DismissReason.cancel) {
  //       this.resetTimeout();
  //     } else if (result.isConfirmed) {
  //       this.forceLogout();
  //     }
  //   });
  // }


  // private forceLogout(): void {
  //   this.stopListener();
  //   localStorage.clear();
  //   this.router.navigateByUrl('/auth/sign-in');
  // }

  // stopListener(): void {
  //   clearTimeout(this.timeout);
  //   clearInterval(this.countdownInterval);
  //   this.timeout = null;
  //   this.countdownInterval = null;
  // }



}
