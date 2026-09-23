export type FeedbackIcon = 'success' | 'error' | 'warning' | 'info' | 'question';

export interface FeedbackOptions {
  title?: string;
  text?: string;
  html?: string;
  icon?: FeedbackIcon | string;
  showCancelButton?: boolean;
  showConfirmButton?: boolean;
  confirmButtonText?: string;
  cancelButtonText?: string;
  confirmButtonColor?: string;
  cancelButtonColor?: string;
  allowOutsideClick?: boolean | (() => boolean);
  allowEscapeKey?: boolean;
  reverseButtons?: boolean;
  timer?: number;
  timerProgressBar?: boolean;
}

export interface FeedbackResult {
  isConfirmed: boolean;
  isDenied?: boolean;
  isDismissed: boolean;
  dismiss?: 'cancel' | 'backdrop' | 'esc' | 'close' | 'timer';
}
