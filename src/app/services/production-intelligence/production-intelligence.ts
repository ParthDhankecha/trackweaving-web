import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { HttpClient } from '../http-client/http-client';
import { IResponse } from '@src/app/models/http-response.model';
import { IProductionIntelligenceRequest } from '@src/app/models/production-intelligence.model';


@Injectable({
    providedIn: 'root'
})
export class ProductionIntelligence {
    private readonly _http: HttpClient = inject(HttpClient);
    private readonly _baseUrl = 'reports';

    getProductionIntelligence(payload: IProductionIntelligenceRequest): Observable<IResponse> {
        return this._http.post(`${this._baseUrl}/production-intelligence`, payload);
    }
}
