import { Directive, HostBinding, inject, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CoreFacadeService } from '@src/app/core/services/core-facade-service';

@Directive({
  selector: '[appSrc]',
  standalone: true,
})
export class AppSrc implements OnChanges {

  // Inject Services
  private readonly _coreService = inject(CoreFacadeService);
  private _basePath: string = this._coreService.appConfig.configData.assetUrl;
  // private publicPath: string = this._coreService.appConfig.configData.publicUrl;
  protected readonly _placeholderImg: string = 'images/img-placeholder.png';
  private readonly _base64Regex = /^data:image\/[a-zA-Z]+;base64,/;


  @Input('appSrc') appSrc: string = '';// actual path
  @Input('basePath') basePath: string = this._basePath;// base path
  @Input('defaultSrc') defaultSrc: string = this._placeholderImg;// default path

  @HostBinding('attr.src') src!: string;


  ngOnChanges(changes: SimpleChanges) {
    if (changes['appSrc'] || changes['basePath'] || changes['defaultSrc']) {
      if (this.appSrc && (this.appSrc.startsWith('http') || this._base64Regex.test(this.appSrc))) {
        this.src = this.appSrc;
        return;
      }
      if (!this.appSrc) {
        // this.src = `${this.publicPath.replace(/\/$/, '')}/${(this.defaultSrc).replace(/^\//, '')}`;
        this.src = `/${(this.defaultSrc).replace(/^\//, '')}`;
        return;
      }
      this.src = `${this.basePath.replace(/\/$/, '')}/${(this.appSrc).replace(/^\//, '')}`;
    }
  }
}