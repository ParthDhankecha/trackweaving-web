import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Header } from '@src/app/layouts/header/header';

import { ApiFacadeService } from '@src/app/services/api-facade-service';


export type LayoutOption = 'default' | '1x1' | '2x2' | '3x2' | '4x2' | '4x3' | '5x3';

export interface LayoutConfig {
  rows: number;
  cols: number;
  fs?: string;
  bootstrap?: string; // optional bootstrap class
};


@Component({
  selector: 'app-dashboard',
  imports: [
    FormsModule,
    Header
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard {

  // Inject services
  readonly _apiFs = inject(ApiFacadeService);


  // Component properties
  protected layoutOptions: LayoutOption[] = ['default', '1x1', '2x2', '3x2', '4x2', '4x3', '5x3'];
  protected selectedLayout: LayoutOption = 'default';

  protected readonly layoutMap: Record<LayoutOption, LayoutConfig> = {
    default: { rows: 1, cols: 1, fs: 'fs-normal' },
    '1x1': { rows: 1, cols: 1, fs: 'fs-1' },
    '2x2': { rows: 2, cols: 2, fs: 'fs-2' },
    '3x2': { rows: 2, cols: 3, fs: 'fs-3' },
    '4x2': { rows: 2, cols: 4, fs: 'fs-5' },
    '4x3': { rows: 3, cols: 4, fs: 'fs-6' },
    '5x3': { rows: 3, cols: 5, fs: 'fs-6' },
  };


  ngOnInit(): void { }

  openFullscreen() {
    const elem = document.body; // or any element you want
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if ((elem as any).webkitRequestFullscreen) { // Safari
      (elem as any).webkitRequestFullscreen();
    } else if ((elem as any).msRequestFullscreen) { // IE/Edge
      (elem as any).msRequestFullscreen();
    }
  }


  protected onChangeLayout(opt: LayoutOption): void {
    if (this.selectedLayout !== opt) {
      this.selectedLayout = opt;
    }
  }

  get selectedLayoutStr(): string {
    if (this.selectedLayout === 'default') {
      return '';
    }

    return `(${parseInt(this.selectedLayout.split('x')[0]) * parseInt(this.selectedLayout.split('x')[1])})`;
  }

  get gridArray(): number[] {
    const config = this.layoutMap[this.selectedLayout];
    return Array(config.rows * config.cols).fill(0).map((_, i) => i + 1);
  }

  get colClass(): string {
    const config = this.layoutMap[this.selectedLayout];
    return `col-${12 / config.cols}`;
  }

  get rowClass(): string {
    const config = this.layoutMap[this.selectedLayout];
    if (this.selectedLayout === 'default') {
      return `default-grid ${config.fs || ''}`;
    }
    return `row-cols-${config.cols} ${config.fs || ''}`;
  }


  onChange(event: any) {
    console.log('Layout changed to:', this.selectedLayout);
    console.log(this.gridArray);
    console.log(this.colClass);
  }
}