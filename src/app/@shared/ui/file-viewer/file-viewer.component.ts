import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { catchError, finalize, firstValueFrom, of } from 'rxjs';

export interface FileViewerData {
  url: string;
  fileName?: string;
  title?: string;
  mimeType?: string;
  shareUrl?: string;
  printTrackingUrl?: string;
  printTrackingBody?: Record<string, unknown>;
}

@Component({
  selector: 'app-file-viewer',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatTooltipModule,
  ],
  templateUrl: './file-viewer.component.html',
  styleUrl: './file-viewer.component.scss',
})
export class FileViewerComponent {
  readonly fileUrl: string;
  readonly fileName: string;
  readonly title: string;
  readonly mimeType: string;
  readonly shareUrl: string;
  readonly printTrackingUrl?: string;
  readonly printTrackingBody?: Record<string, unknown>;
  readonly safePreviewUrl: SafeResourceUrl;

  isDownloading = false;
  isPrinting = false;
  printStarted = false;
  isMaximized = false;
  statusMessage = '';

  constructor(
    @Inject(MAT_DIALOG_DATA) data: FileViewerData,
    private readonly dialogRef: MatDialogRef<FileViewerComponent>,
    private readonly http: HttpClient,
    private readonly sanitizer: DomSanitizer,
    @Inject(PLATFORM_ID) private readonly platformId: object,
  ) {
    this.fileUrl = data.url;
    this.fileName = this.resolveFileName(data.fileName, data.url);
    this.title = data.title?.trim() || this.fileName;
    this.mimeType = data.mimeType?.toLowerCase() || '';
    this.shareUrl = data.shareUrl || data.url;
    this.printTrackingUrl = data.printTrackingUrl;
    this.printTrackingBody = data.printTrackingBody;
    this.safePreviewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.fileUrl);
  }

  get isPdf(): boolean {
    return this.mimeType === 'application/pdf' || /\.pdf$/i.test(this.pathWithoutQuery);
  }

  get isImage(): boolean {
    return this.mimeType.startsWith('image/') || /\.(avif|bmp|gif|jpe?g|png|svg|webp)$/i.test(this.pathWithoutQuery);
  }

  get canPreview(): boolean {
    return this.isPdf || this.isImage;
  }

  get fileTypeLabel(): string {
    if (this.isPdf) {
      return 'PDF document';
    }

    if (this.isImage) {
      return 'Image file';
    }

    const extension = this.fileName.split('.').pop();
    return extension && extension !== this.fileName ? extension.toUpperCase() + ' file' : 'Document file';
  }

  get fileIcon(): string {
    if (this.isPdf) {
      return 'picture_as_pdf';
    }

    if (this.isImage) {
      return 'image';
    }

    return 'description';
  }

  get nativeShareAvailable(): boolean {
    return isPlatformBrowser(this.platformId)
      && typeof navigator !== 'undefined'
      && typeof navigator.share === 'function';
  }

  close(): void {
    this.dialogRef.close({ printed: this.printStarted });
  }

  toggleMaximized(): void {
    this.isMaximized = !this.isMaximized;

    if (this.isMaximized) {
      this.dialogRef.addPanelClass('file-viewer-dialog--maximized');
      this.dialogRef.updateSize('100vw', '100vh');
    } else {
      this.dialogRef.removePanelClass('file-viewer-dialog--maximized');
      this.dialogRef.updateSize('min(96vw, 1200px)', 'min(92vh, 860px)');
    }
  }

  downloadFile(): void {
    if (this.isDownloading || !isPlatformBrowser(this.platformId)) {
      return;
    }

    this.isDownloading = true;
    this.statusMessage = 'Preparing download…';

    this.http.get(this.fileUrl, { responseType: 'blob' }).pipe(
      finalize(() => this.isDownloading = false),
    ).subscribe({
      next: (file) => {
        this.triggerDownload(file);
        this.statusMessage = 'Download started.';
      },
      error: () => {
        // A direct download is a useful fallback for public storage links that
        // do not allow the browser to read the response through XHR.
        this.triggerDirectDownload();
        this.statusMessage = 'Download started.';
      },
    });
  }

  async shareFile(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    if (this.nativeShareAvailable) {
      try {
        const navigatorWithFileShare = navigator as Navigator & {
          canShare?: (data?: ShareData) => boolean;
        };

        if (navigatorWithFileShare.canShare?.({ files: [new File([], this.fileName)] })) {
          const file = await firstValueFrom(this.http.get(this.fileUrl, { responseType: 'blob' }));
          const shareFile = new File([file], this.fileName, {
            type: this.mimeType || 'application/octet-stream',
          });

          if (navigatorWithFileShare.canShare({ files: [shareFile] })) {
            await navigator.share({
              title: this.title,
              text: 'Shared from ERIS: ' + this.fileName,
              files: [shareFile],
            });
          } else {
            await navigator.share({
              title: this.title,
              text: 'Shared from ERIS: ' + this.fileName,
              url: this.shareUrl,
            });
          }
        } else {
          await navigator.share({
            title: this.title,
            text: 'Shared from ERIS: ' + this.fileName,
            url: this.shareUrl,
          });
        }
        this.statusMessage = 'Share sheet opened.';
        return;
      } catch (error: unknown) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }
      }
    }

    await this.copyFileLink();
  }

  async copyFileLink(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    if (!navigator.clipboard?.writeText) {
      this.statusMessage = 'Copy link is not available in this browser.';
      return;
    }

    try {
      await navigator.clipboard.writeText(this.shareUrl);
      this.statusMessage = 'File link copied to clipboard.';
    } catch {
      this.statusMessage = 'Unable to copy the file link.';
    }
  }

  printFile(): void {
    if (this.isPrinting || !isPlatformBrowser(this.platformId)) {
      return;
    }

    this.isPrinting = true;
    this.statusMessage = 'Preparing print…';
    let auditFailed = false;

    const trackingRequest = this.printTrackingUrl
      ? this.http.post(this.printTrackingUrl, this.printTrackingBody || {}).pipe(
          catchError(() => {
            auditFailed = true;
            return of(null);
          }),
        )
      : of(null);

    trackingRequest.pipe(
      finalize(() => this.isPrinting = false),
    ).subscribe(() => {
      this.printStarted = !auditFailed || !this.printTrackingUrl;
      this.statusMessage = auditFailed
        ? 'Print dialog opened, but the print audit could not be saved.'
        : 'Print dialog opened.';
      window.setTimeout(() => {
        const frame = document.querySelector('.file-viewer__pdf') as HTMLIFrameElement | null;
        frame?.contentWindow?.focus();
        frame?.contentWindow?.print();
      });
    });
  }

  private get pathWithoutQuery(): string {
    return this.fileUrl.split(/[?#]/, 1)[0].toLowerCase();
  }

  private resolveFileName(fileName: string | undefined, url: string): string {
    const suppliedName = fileName?.trim();
    if (suppliedName) {
      return suppliedName;
    }

    const pathName = url.split(/[?#]/, 1)[0].split('/').pop() || 'document';

    try {
      return decodeURIComponent(pathName) || 'document';
    } catch {
      return pathName || 'document';
    }
  }

  private triggerDownload(file: Blob): void {
    const objectUrl = URL.createObjectURL(file);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = this.fileName;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  }

  private triggerDirectDownload(): void {
    const anchor = document.createElement('a');
    anchor.href = this.fileUrl;
    anchor.download = this.fileName;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }
}
