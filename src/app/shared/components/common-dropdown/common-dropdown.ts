import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

import { SearchInput } from '../search-input/search-input';
import { TranslatePipe } from '@ngx-translate/core';


@Component({
  selector: 'app-common-dropdown',
  imports: [
    TranslatePipe,
    SearchInput,
    NgTemplateOutlet
],
  templateUrl: './common-dropdown.html',
  styleUrl: './common-dropdown.scss'
})
export class CommonDropdown {

  @Input('placeholder') placeholder: string = '';
  @Input('optionsList') optionsList: Array<any> = [];
  @Input('selectedOption') selectedOption!: any;

  @Input('uniqueKey') uniqueKey: string = '_id';
  @Input('displayKey1') displayKey1: string = '';
  @Input('displayKey2') displayKey2?: string = '';
  @Input('enableCreate') enableCreate: boolean = false;

  @Input('filterKeys') filterKeys: string[] = [];
  @Input('disableSameSelect') disableSameSelect: boolean = false;
  @Input('disableSearch') disableSearch: boolean = false;
  @Input('disabled') disabled: boolean = false;
  @Input('listWrapClass') listWrapClass: string = '';
  @Input('btnClass') btnClass: string = '';
  @Input('btnStyle') btnStyle: string = '';

  @Output('onSelect') onSelect: EventEmitter<any> = new EventEmitter<any>();
  @Output('onCreate') onCreate: EventEmitter<any> = new EventEmitter<any>();


  protected cacheSearchTerms: string = '';
  protected filteredList: Array<any> = [];


  protected ngOnChanges(changes: SimpleChanges): void {
    if (changes['optionsList'] && changes['optionsList'].currentValue) {
      this.filteredList = [...this.optionsList || []];
      if (this.cacheSearchTerms) this.onSearchTerms(this.cacheSearchTerms);
    }
    if (changes['selectedOption'] && changes['selectedOption'].currentValue) {
      this.selectedOption = changes['selectedOption'].currentValue;
    }
  }


  protected get displayText(): string {
    if (!this.selectedOption) return '';
    else if (this.displayKey1 && this.displayKey2) return `${this.selectedOption[this.displayKey1] ?? ''} (${this.selectedOption[this.displayKey2] ?? ''})`.trim();
    else if (this.displayKey1) return this.selectedOption[this.displayKey1] ?? '';
    else return this.selectedOption?.toString() ?? '';
  }
  protected trackByUniqueKey = (index: number, item: any) => item[this.uniqueKey] ?? index;


  protected onSearchTerms(event: string): void {
    this.cacheSearchTerms = event;
    event = event?.trim()?.toLowerCase() ?? '';
    if (this.filterKeys.length > 0) {
      this.filteredList = this.optionsList?.filter((item: any) => this.filterKeys.some((key: string) => {
        return item?.[key]?.toLowerCase().includes(event);
      })) || [];
    } else {
      this.filteredList = this.optionsList?.filter((item: any) => {
        return item?.toLowerCase().includes(event);
      }) || [];
    }
  }

  protected isSelected(option: any): boolean {
    if (!this.selectedOption || !option) return false;
    if (this.uniqueKey) {
      return this.selectedOption?.[this.uniqueKey] === option?.[this.uniqueKey];
    } else {
      return this.selectedOption === option;
    }
  }

  protected onOptionChange(option: any): void {
    if (this.disabled || !option) return;
    if (this.selectedOption && !this.disableSameSelect) {
      if (this.uniqueKey && this.selectedOption[this.uniqueKey] === option[this.uniqueKey]) return;
      else if (this.selectedOption === option) return;
    }

    this.onSelect.emit(option);
    if (this.cacheSearchTerms) this.onSearchTerms('');
  }


  protected onCreateNew(): void {
    if (this.disabled || !this.enableCreate) return;
    this.onCreate.emit(this.cacheSearchTerms?.trim());
    if (this.cacheSearchTerms) this.onSearchTerms('');
  }
}