import { CommonModule } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { finalize } from 'rxjs';
import { LetterBrandingService, LetterBrandingState } from '../../../services/letters/letter-branding.service';
import { getApiErrorMessage } from '../../utils/api-error';
import { FeedbackService } from '../../services/feedback.service';

type BrandingAsset = 'signature' | 'stamp';

@Component({
  selector: 'app-letter-branding-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatDialogModule, MatIconModule],
  templateUrl: './letter-branding-dialog.component.html',
  styleUrl: './letter-branding-dialog.component.scss',
})
export class LetterBrandingDialogComponent implements OnInit, OnDestroy {
  branding: LetterBrandingState | null = null;
  signatureFile: File | null = null;
  stampFile: File | null = null;
  signaturePreview = '';
  stampPreview = '';
  loading = true;
  saving = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public readonly data: unknown,
    private readonly dialogRef: MatDialogRef<LetterBrandingDialogComponent>,
    private readonly brandingService: LetterBrandingService,
    private readonly feedback: FeedbackService,
  ) {}

  ngOnInit(): void {
    this.brandingService.get().subscribe({
      next: (response) => {
        this.branding = response.data;
        this.signaturePreview = response.data.signature_url;
        this.stampPreview = response.data.stamp_url;
        this.loading = false;
      },
      error: (error: unknown) => {
        this.loading = false;
        this.feedback.error(
          'Unable to load letter branding',
          getApiErrorMessage(error, 'The current signature and stamp could not be loaded.'),
        );
      },
    });
  }

  ngOnDestroy(): void {
    this.revokePreview(this.signaturePreview, this.branding?.signature_url);
    this.revokePreview(this.stampPreview, this.branding?.stamp_url);
  }

  onFileSelected(event: Event, asset: BrandingAsset): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] || null;

    if (!file) {
      return;
    }

    if (!['image/png', 'image/jpeg'].includes(file.type)) {
      this.feedback.error('Invalid image', 'Please choose a PNG, JPG, or JPEG image.');
      input.value = '';
      return;
    }

    const preview = URL.createObjectURL(file);

    if (asset === 'signature') {
      this.revokePreview(this.signaturePreview, this.branding?.signature_url);
      this.signatureFile = file;
      this.signaturePreview = preview;
    } else {
      this.revokePreview(this.stampPreview, this.branding?.stamp_url);
      this.stampFile = file;
      this.stampPreview = preview;
    }
  }

  save(): void {
    if (this.saving || (!this.signatureFile && !this.stampFile)) {
      return;
    }

    this.saving = true;
    this.brandingService.update(this.signatureFile, this.stampFile).pipe(
      finalize(() => this.saving = false),
    ).subscribe({
      next: () => {
        this.feedback.success(
          'Letter branding updated',
          'The new signature and stamp will be used on the next generated letter.',
        );
        this.dialogRef.close({ saved: true });
      },
      error: (error: unknown) => {
        this.feedback.error(
          'Unable to update letter branding',
          getApiErrorMessage(error, 'The signature and stamp could not be saved.'),
        );
      },
    });
  }

  async resetToDefaults(): Promise<void> {
    const result = await this.feedback.confirm(
      'Restore system branding?',
      'This will use the bundled DG signature and Ministry stamp for future letters.',
      { confirmButtonText: 'Restore defaults', cancelButtonText: 'Keep current assets' },
    );

    if (!result.isConfirmed || this.saving) {
      return;
    }

    this.saving = true;
    this.brandingService.reset().pipe(
      finalize(() => this.saving = false),
    ).subscribe({
      next: () => {
        this.feedback.success('System branding restored', 'The default signature and stamp are active again.');
        this.dialogRef.close({ reset: true });
      },
      error: (error: unknown) => {
        this.feedback.error(
          'Unable to restore branding',
          getApiErrorMessage(error, 'The default branding could not be restored.'),
        );
      },
    });
  }

  close(): void {
    this.dialogRef.close();
  }

  private revokePreview(current: string, original?: string | null): void {
    if (current && current !== original && current.startsWith('blob:')) {
      URL.revokeObjectURL(current);
    }
  }
}
