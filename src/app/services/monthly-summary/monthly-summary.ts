import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { HttpClient } from '../http-client/http-client';
import { IResponse } from '@src/app/models/http-response.model';
import { IMonthlySummaryRequest } from '@src/app/models/monthly-summary.model';


@Injectable({
    providedIn: 'root'
})
export class MonthlySummary {
    private readonly _http: HttpClient = inject(HttpClient);
    private readonly _baseUrl = 'reports';

    getMonthlySummary(payload: IMonthlySummaryRequest): Observable<IResponse> {
        return this._http.post(`${this._baseUrl}/monthly-summary`, payload);
    }
}
