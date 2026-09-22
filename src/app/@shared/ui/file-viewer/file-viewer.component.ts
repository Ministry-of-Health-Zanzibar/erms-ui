import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { finalize } from 'rxjs';

export interface FileViewerData {
  url: string;
  fileName?: string;
  title?: string;
  mimeType?: string;
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
  readonly safePreviewUrl: SafeResourceUrl;

  isDownloading = false;
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
    this.dialogRef.close();
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
        await navigator.share({
          title: this.title,
          text: 'Shared from ERIS: ' + this.fileName,
          url: this.fileUrl,
        });
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
      await navigator.clipboard.writeText(this.fileUrl);
      this.statusMessage = 'File link copied to clipboard.';
    } catch {
      this.statusMessage = 'Unable to copy the file link.';
    }
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
