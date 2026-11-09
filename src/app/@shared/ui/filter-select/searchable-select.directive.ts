import { DOCUMENT } from '@angular/common';
import {
  AfterViewInit, booleanAttribute, Directive, ElementRef, EventEmitter,
  inject, Input, OnDestroy, Output, Renderer2,
} from '@angular/core';
import { MatOption } from '@angular/material/core';
import { MatSelect } from '@angular/material/select';
import { Subject, takeUntil } from 'rxjs';

/** Adds search without replacing a select's value accessor, options, or event handlers. */
@Directive({
  selector: 'mat-select[appSearchableSelect]',
  standalone: true,
})
export class SearchableSelectDirective implements AfterViewInit, OnDestroy {
  @Input({ transform: booleanAttribute }) appSearchableSelect = true;
  @Input({ transform: booleanAttribute }) selectSearchRemote = false;
  @Input() selectSearchPlaceholder = 'Search options…';
  @Output() selectSearchChange = new EventEmitter<string>();

  private readonly select = inject(MatSelect);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly document = inject(DOCUMENT);
  private readonly renderer = inject(Renderer2);
  private readonly destroyed = new Subject<void>();
  private readonly hiddenOptions = new Set<MatOption>();
  private readonly cleanups: (() => void)[] = [];
  private panel: HTMLElement | null = null;
  private searchRow: HTMLElement | null = null;
  private input: HTMLInputElement | null = null;
  private emptyMessage: HTMLElement | null = null;
  private term = '';

  ngAfterViewInit(): void {
    this.select.openedChange.pipe(takeUntil(this.destroyed)).subscribe((open) => {
      if (open && this.appSearchableSelect) {
        this.openSearch();
      } else {
        this.removeSearch();
      }
    });
    this.select.options.changes.pipe(takeUntil(this.destroyed)).subscribe(() => {
      // Remote options and their text finish rendering after the content query updates.
      queueMicrotask(() => this.applyFilter());
    });
  }

  private openSearch(): void {
    this.removeSearch();
    this.panel = this.select.panel?.nativeElement ?? null;
    if (!this.panel) return;

    const hadSearch = !!this.term;
    this.term = '';
    this.renderer.addClass(this.panel, 'ui-select-search-panel');
    this.searchRow = this.renderer.createElement('div');
    this.renderer.addClass(this.searchRow, 'ui-select-search');
    this.renderer.setAttribute(this.searchRow, 'role', 'presentation');

    const icon = this.renderer.createElement('span');
    this.renderer.addClass(icon, 'material-icons');
    this.renderer.setAttribute(icon, 'aria-hidden', 'true');
    this.renderer.appendChild(icon, this.renderer.createText('search'));
    this.renderer.appendChild(this.searchRow, icon);

    const input: HTMLInputElement = this.renderer.createElement('input');
    this.input = input;
    this.renderer.setAttribute(input, 'type', 'search');
    this.renderer.setAttribute(input, 'autocomplete', 'off');
    this.renderer.setAttribute(input, 'placeholder', this.selectSearchPlaceholder);
    const label = this.select.ariaLabel || this.host.nativeElement.closest('mat-form-field')
      ?.querySelector('mat-label')?.textContent?.trim() || this.select.placeholder || 'options';
    this.renderer.setAttribute(input, 'aria-label', `Search ${label}`);
    this.renderer.appendChild(this.searchRow, input);
    this.renderer.insertBefore(this.panel, this.searchRow, this.panel.firstChild);

    this.emptyMessage = this.renderer.createElement('div');
    this.renderer.addClass(this.emptyMessage, 'ui-select-search__empty');
    this.renderer.setAttribute(this.emptyMessage, 'role', 'status');
    this.renderer.appendChild(this.emptyMessage, this.renderer.createText('No matching options'));
    this.renderer.appendChild(this.panel, this.emptyMessage);

    this.cleanups.push(
      this.renderer.listen(input, 'input', () => {
        this.term = input.value;
        this.applyFilter();
        this.selectSearchChange.emit(this.term);
      }),
      this.renderer.listen(input, 'click', (event: MouseEvent) => event.stopPropagation()),
      this.renderer.listen(input, 'keydown', (event: KeyboardEvent) => this.searchKeydown(event)),
    );

    // Keep Material's normal keyboard behaviour, skipping only search-hidden options.
    // _keyManager is Material's exposed CDK key manager; option values/disabled states stay intact.
    this.select._keyManager.skipPredicate((option) =>
      this.hiddenOptions.has(option) || (!this.select.panelOpen && option.disabled));
    this.applyFilter();
    if (hadSearch) this.selectSearchChange.emit('');
    queueMicrotask(() => {
      if (this.select.panelOpen && this.input === input) {
        input.focus({ preventScroll: true });
        if (this.panel) this.panel.scrollTop = 0;
      }
    });
  }

  private applyFilter(): void {
    if (!this.panel || !this.select.panelOpen) return;
    const term = this.term.trim().toLocaleLowerCase();
    this.hiddenOptions.clear();
    let matches = 0;
    for (const option of this.select.options) {
      const label = `${option.group?.label || ''} ${option.viewValue}`.toLocaleLowerCase();
      const hidden = !this.selectSearchRemote && !!term && !label.includes(term);
      const element = this.document.getElementById(option.id);
      if (hidden) {
        this.hiddenOptions.add(option);
        if (element) this.renderer.addClass(element, 'ui-select-search-hidden');
      } else {
        matches++;
        if (element) this.renderer.removeClass(element, 'ui-select-search-hidden');
      }
    }
    if (this.emptyMessage) {
      this.renderer.setProperty(this.emptyMessage, 'hidden', this.selectSearchRemote || matches > 0);
    }
    const manager = this.select._keyManager;
    if (manager.activeItem && this.hiddenOptions.has(manager.activeItem)) {
      manager.setActiveItem(-1);
    }
  }

  private searchKeydown(event: KeyboardEvent): void {
    event.stopPropagation();
    if (event.key === 'Escape' || event.key === 'Tab') {
      if (event.key === 'Escape') event.preventDefault();
      this.select.close();
      this.select.focus();
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      this.select.focus();
      const manager = this.select._keyManager;
      event.key === 'ArrowDown' ? manager.setFirstItemActive() : manager.setLastItemActive();
    } else if (event.key === 'Enter') {
      // Searching must never submit the enclosing form or select an invisible option.
      event.preventDefault();
    }
  }

  private removeSearch(): void {
    this.cleanups.splice(0).forEach((cleanup) => cleanup());
    this.panel?.querySelectorAll('.ui-select-search-hidden').forEach((element) => {
      this.renderer.removeClass(element, 'ui-select-search-hidden');
    });
    this.hiddenOptions.clear();
    if (this.searchRow?.parentNode) this.renderer.removeChild(this.searchRow.parentNode, this.searchRow);
    if (this.emptyMessage?.parentNode) this.renderer.removeChild(this.emptyMessage.parentNode, this.emptyMessage);
    this.searchRow = this.input = this.emptyMessage = this.panel = null;
    this.select._keyManager?.skipPredicate((option) => !this.select.panelOpen && option.disabled);
    if (!this.select.panelOpen && !this.select.multiple) {
      // Resume normal closed-field arrow navigation from the current selection,
      // without emitting a selection event while the search is being dismissed.
      const selectedIndex = this.select.options?.toArray().findIndex((option) => option.selected) ?? -1;
      this.select._keyManager?.updateActiveItem(selectedIndex);
    }
  }

  ngOnDestroy(): void {
    this.removeSearch();
    this.destroyed.next();
    this.destroyed.complete();
  }
}
