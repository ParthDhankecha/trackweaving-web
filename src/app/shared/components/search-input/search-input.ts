import { Component, ElementRef, EventEmitter, HostListener, Input, Output, Renderer2, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-search-input',
  imports: [
    FormsModule
  ],
  templateUrl: './search-input.html',
  styleUrl: './search-input.scss'
})
export class SearchInput {

  constructor(
    private _renderer2: Renderer2
  ) { }


  @Input('searchTerms') searchTerms: string = '';
  @Input('debounceTime') debounceTime: number = 300;
  /**
   * { ['query selector str' || 'self']: ['propertyName:value'] }
   */
  @Input('styles') ngStyles: any = {};
  @Output('onSearch') onSearch: EventEmitter<string> = new EventEmitter<string>();
  @Output('onClick') onclick: EventEmitter<Event> = new EventEmitter<Event>();


  protected searchInputDebounceId: any;


  @ViewChild('searchInputWrapRef') searchInputWrap!: ElementRef;
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;
  @HostListener('window:keydown', ['$event'])
  handleKeydown(event: KeyboardEvent) {
    if ((event.metaKey || event.ctrlKey) && event.key === '1') {
      event.preventDefault(); // Prevent default browser behavior (like opening the browser search bar)
      this.focusSearchInput();
    }
  }


  ngOnInit(): void { }


  ngAfterViewInit(): void {
    this.updateStyles();
  }


  private updateStyles(): void {
    if (this.searchInputWrap.nativeElement) {
      if (typeof this.ngStyles === 'object' && this.ngStyles !== null) {
        for (const qsStr in this.ngStyles) {
          const styles = this.ngStyles[qsStr];

          if (Array.isArray(styles) && styles.length > 0) {
            let element = this.searchInputWrap.nativeElement;
            if (qsStr !== 'self') {
              element = this.searchInputWrap.nativeElement.querySelector(qsStr);
            }

            if (element) {
              for (const style of styles) {
                const [name, value] = style.split(':').map((part: string) => part.trim());
                if (name && value) {
                  this._renderer2.setStyle(element, name, value);
                }
              }
            }
          }
        }
      }
    }
  }


  protected focusSearchInput(event?: Event): void {
    event?.stopPropagation();
    this.searchInput.nativeElement?.focus();
    this.onclick.emit(event);
  }


  protected onSearchTerms(event: Event | string) {
    if (this.searchInputDebounceId) clearTimeout(this.searchInputDebounceId);

    this.searchInputDebounceId = setTimeout(() => {
      this.onSearch.emit(this.searchTerms?.trim()?.toLowerCase());
    }, (event ? this.debounceTime : 0));
  }
}