import { HttpErrorResponse, HttpHeaders, HttpParams, HttpClient as _HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class HttpClient {

  private readonly _http = inject(_HttpClient);
  private baseUrl = 'http://192.168.29.74:3000/api/v1/';// environment.apiUrl; // e.g., 'https://api.example.com'

  /** Default headers */
  private get headers(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      // Add Authorization token here if needed
      // 'Authorization': `Bearer ${token}`
    });
  }


  /**
   * Generate HTTP options
   * @param options Request options
   * @param options.multipart Set to true for multipart/form-data
   * @param options.params Additional query params
   * @return HTTP options
   */
  private httpOptions({ multipart = false, params = {} }): { headers: HttpHeaders; withCredentials: boolean; params: HttpParams } {
    const contentType = multipart ? 'multipart/form-data' : 'application/json';
    const headers = new HttpHeaders({
      'Content-Type': contentType,
      'Accept': 'application/json',
      // Add Authorization token here if needed
      // 'Authorization': `Bearer ${token}`
    });
    return {
      headers: headers,
      withCredentials: false,
      params: new HttpParams({ fromObject: params })
    };
  }

  /**
   * Handle API errors
   */
  private handleError(error: HttpErrorResponse) {
    let errorMsg = '';
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMsg = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMsg = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    return throwError(() => new Error(errorMsg));
  }


  /**
   * GET request
   * @param endpoint API endpoint (e.g., '/users')
   * @param params Query params
   */
  get<T>(endpoint: string, params?: Record<string, string | number>): Observable<T> {
    return this._http
      .get<T>(`${this.baseUrl}${endpoint}`, { ...this.httpOptions({ params }) })
    // .pipe(catchError(this.handleError));
  }

  /**
   * POST request
   * @param endpoint API endpoint (e.g., '/users')
   * @param data Body payload
   * @param options Request options
   * @param options.multipart Set to true for multipart/form-data
   * @param options.params Additional query params
   */
  post<T>(endpoint: string, data: any, { multipart = false, params = {} } = {}): Observable<T> {
    return this._http
      .post<T>(`${this.baseUrl}${endpoint}`, data, {
        ...this.httpOptions({ multipart, params })
      })
    // .pipe(catchError(this.handleError));
  }

  /**
   * PUT request
   * @param endpoint API endpoint
   * @param data Body payload
   * @param options Request options
   * @param options.multipart Set to true for multipart/form-data
   * @param options.params Additional query params
   */
  put<T>(endpoint: string, data: any, { multipart = false, params = {} } = {}): Observable<T> {
    return this._http
      .put<T>(`${this.baseUrl}${endpoint}`, data, {
        ...this.httpOptions({ multipart, params })
      })
    // .pipe(catchError(this.handleError));
  }

  /**
   * PATCH request
   * @param endpoint API endpoint
   * @param data Body payload
   * @param options Request options
   * @param options.multipart Set to true for multipart/form-data
   * @param options.params Additional query params
   */
  patch<T>(endpoint: string, data: any, { multipart = false, params = {} } = {}): Observable<T> {
    return this._http
      .patch<T>(`${this.baseUrl}${endpoint}`, data, {
        ...this.httpOptions({ multipart, params })
      })
    // .pipe(catchError(this.handleError));
  }

  /**
   * DELETE request
   * @param endpoint API endpoint
   */
  delete<T>(endpoint: string): Observable<T> {
    return this._http
      .delete<T>(`${this.baseUrl}${endpoint}`, {
        ...this.httpOptions({})
      })
    // .pipe(catchError(this.handleError));
  }
}