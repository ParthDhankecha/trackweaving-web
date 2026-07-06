import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';

import { ApiFacadeService } from '@src/app/services/api-facade-service';
import { CoreFacadeService } from '@src/app/core/services/core-facade-service';
import { IResponse } from '@src/app/models/http-response.model';
import { EToasterType } from '@src/app/models/utils.model';
import { Pagination } from '@src/app/shared/components/pagination/pagination';
import { EntriesPerPageSelector } from '@src/app/shared/components/entries-per-page-selector/entries-per-page-selector';
import { UpsertLead } from './upsert-lead/upsert-lead';
import { ViewLead } from './view-lead/view-lead';


const LEAD_STATUSES = ['New', 'Contacted', 'Demo scheduled', 'Visited', 'Follow up', 'Converted', 'Not interested', 'Lost'];
const MACHINE_TYPES = ['Rapier Jacquard', 'Rapier', 'Waterjet', 'Airjet', 'Other'];


@Component({
  selector: 'app-leads',
  standalone: true,
  imports: [
    FormsModule,
    DatePipe,
    Pagination,
    EntriesPerPageSelector,
    UpsertLead,
    ViewLead,
  ],
  templateUrl: './leads.html',
  styleUrl: './leads.scss'
})
export class Leads {

  protected readonly _apiFs = inject(ApiFacadeService);
  protected readonly _coreService = inject(CoreFacadeService);

  protected readonly leadStatuses = LEAD_STATUSES;
  protected readonly machineTypes = MACHINE_TYPES;

  // Pagination
  protected currentPage = 1;
  protected pageSize = 10;
  protected totalEntries = 0;

  // Sort
  protected sortField = '';
  protected sortOrder: 'asc' | 'desc' = 'desc';

  // Filters
  protected searchTerms = '';
  protected filterLeadStatus = '';
  protected filterMachineType = '';
  protected filterIsVisited = '';
  protected filterIsConverted = '';
  protected filterLandmark = '';
  protected filterVisitedBy = '';
  protected filterCreatedAtFrom = '';
  protected filterCreatedAtTo = '';
  protected filterFollowUpDueToday = false;
  protected filterOverdueFollowUp = false;

  // Data
  protected leadList: any[] = [];
  protected stats: any = null;
  protected isLoading = false;

  // Modals
  protected upsertModalData: any = null;
  protected isUpsertModalOpen = false;
  protected viewModalLead: any = null;
  protected isViewModalOpen = false;
  protected deleteConfirmConfig: { isOpen: boolean; data: any } = { isOpen: false, data: null };
  protected isDeleteInProgress = false;


  ngOnInit(): void {
    this.loadStats();
    this.loadList();
  }


  private loadStats(): void {
    this._apiFs.lead.getStats().subscribe({
      next: (res: IResponse) => {
        if (res.code === 'OK') {
          this.stats = res.data;
        }
      },
      error: () => {}
    });
  }

  private buildFilter() {
    const filter: any = {};
    if (this.searchTerms?.trim()) filter.search = this.searchTerms.trim();
    if (this.filterLeadStatus) filter.leadStatus = this.filterLeadStatus;
    if (this.filterMachineType) filter.machineType = this.filterMachineType;
    if (this.filterIsVisited === 'true') filter.isVisited = true;
    else if (this.filterIsVisited === 'false') filter.isVisited = false;
    if (this.filterIsConverted === 'true') filter.isConverted = true;
    else if (this.filterIsConverted === 'false') filter.isConverted = false;
    if (this.filterLandmark?.trim()) filter.landmark = this.filterLandmark.trim();
    if (this.filterVisitedBy?.trim()) filter.visitedBy = this.filterVisitedBy.trim();
    if (this.filterCreatedAtFrom) filter.createdAtFrom = this.filterCreatedAtFrom;
    if (this.filterCreatedAtTo) filter.createdAtTo = this.filterCreatedAtTo;
    if (this.filterFollowUpDueToday) filter.followUpDueToday = true;
    if (this.filterOverdueFollowUp) filter.overdueFollowUp = true;
    return filter;
  }

  private loadList(): void {
    const payload: any = {
      page: this.currentPage,
      limit: this.pageSize,
      filter: this.buildFilter(),
    };
    if (this.sortField) {
      payload.sort = { field: this.sortField, order: this.sortOrder };
    }

    this.isLoading = true;
    this._apiFs.lead.list(payload).subscribe({
      next: (res: IResponse) => {
        this.isLoading = false;
        if (res.code === 'OK') {
          this.leadList = res.data?.list ?? [];
          this.totalEntries = res.data?.count ?? 0;
        }
      },
      error: () => { this.isLoading = false; }
    });
  }

  protected onSearch(): void {
    this.currentPage = 1;
    this.loadList();
  }

  protected onFilterChange(): void {
    this.currentPage = 1;
    this.loadList();
  }

  protected onResetFilters(): void {
    this.searchTerms = '';
    this.filterLeadStatus = '';
    this.filterMachineType = '';
    this.filterIsVisited = '';
    this.filterIsConverted = '';
    this.filterLandmark = '';
    this.filterVisitedBy = '';
    this.filterCreatedAtFrom = '';
    this.filterCreatedAtTo = '';
    this.filterFollowUpDueToday = false;
    this.filterOverdueFollowUp = false;
    this.currentPage = 1;
    this.loadList();
  }

  protected onPageChange(page: number): void {
    this.currentPage = page;
    this.loadList();
  }

  protected onEntriesPerPageChange(size: number): void {
    if (size && size > 0) {
      this.currentPage = 1;
      this.pageSize = size;
      this.loadList();
    }
  }

  protected onSort(field: string): void {
    if (this.sortField === field) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortOrder = 'desc';
    }
    this.currentPage = 1;
    this.loadList();
  }

  // Upsert Modal
  protected openAddModal(): void {
    this.upsertModalData = null;
    this.isUpsertModalOpen = true;
  }

  protected openEditModal(lead: any): void {
    // Load full lead data
    this._apiFs.lead.getById(lead._id).subscribe({
      next: (res: IResponse) => {
        if (res.code === 'OK') {
          this.upsertModalData = res.data;
          this.isUpsertModalOpen = true;
        }
      },
      error: () => {}
    });
  }

  protected closeUpsertModal(): void {
    this.isUpsertModalOpen = false;
    this.upsertModalData = null;
  }

  protected onUpsertSuccess(data: any): void {
    this.closeUpsertModal();
    this.loadStats();
    this.loadList();
  }

  // View Modal
  protected openViewModal(lead: any): void {
    this._apiFs.lead.getById(lead._id).subscribe({
      next: (res: IResponse) => {
        if (res.code === 'OK') {
          this.viewModalLead = res.data;
          this.isViewModalOpen = true;
        }
      },
      error: () => {}
    });
  }

  protected closeViewModal(): void {
    this.isViewModalOpen = false;
    this.viewModalLead = null;
  }

  protected onEditFromView(lead: any): void {
    this.closeViewModal();
    this.openEditModal(lead);
  }

  // Delete
  protected openDeleteModal(lead: any): void {
    this.deleteConfirmConfig = { isOpen: true, data: lead };
  }

  protected closeDeleteModal(): void {
    this.deleteConfirmConfig = { isOpen: false, data: null };
  }

  protected confirmDelete(): void {
    const lead = this.deleteConfirmConfig.data;
    if (!lead?._id || this.isDeleteInProgress) return;

    this.isDeleteInProgress = true;
    this._apiFs.lead.delete(lead._id).subscribe({
      next: (res: IResponse) => {
        this.isDeleteInProgress = false;
        this.closeDeleteModal();
        if (res.code === 'OK') {
          this._coreService.utils.showToaster(EToasterType.Success, 'Lead deleted successfully.');
          this.loadStats();
          this.loadList();
        }
      },
      error: (err: any) => {
        this.isDeleteInProgress = false;
        const msg = err?.error?.message ?? 'Something went wrong. Please try again.';
        this._coreService.utils.showToaster(EToasterType.Danger, msg);
      }
    });
  }

  // Helpers
  protected getStatusBadgeClass(status: string): string {
    const map: Record<string, string> = {
      'New': 'bg-primary',
      'Contacted': 'bg-info text-dark',
      'Demo scheduled': 'bg-warning text-dark',
      'Visited': 'bg-info text-dark',
      'Follow up': 'bg-warning text-dark',
      'Converted': 'bg-success',
      'Not interested': 'bg-secondary',
      'Lost': 'bg-danger',
    };
    return map[status] ?? 'bg-secondary';
  }

  protected isOverdue(lead: any): boolean {
    if (!lead.nextFollowUpDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(lead.nextFollowUpDate) < today;
  }
}
