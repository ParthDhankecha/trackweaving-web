import { Component, EventEmitter, Input, OnChanges, OnInit, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { ApiFacadeService } from '@src/app/services/api-facade-service';
import { CoreFacadeService } from '@src/app/core/services/core-facade-service';
import { IResponse } from '@src/app/models/http-response.model';
import { EToasterType } from '@src/app/models/utils.model';


const MACHINE_TYPES = ['Rapier Jacquard', 'Rapier', 'Waterjet', 'Airjet', 'Other'];
const LEAD_SOURCES = ['Website', 'Instagram', 'Facebook', 'Reference', 'Direct call', 'WhatsApp', 'Other'];
const LEAD_STATUSES = ['New', 'Contacted', 'Demo scheduled', 'Visited', 'Follow up', 'Converted', 'Not interested', 'Lost'];
const PAYMENT_STATUSES = ['Pending', 'Partial', 'Paid'];


@Component({
  selector: 'app-upsert-lead',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './upsert-lead.html',
  styleUrl: './upsert-lead.scss'
})
export class UpsertLead implements OnInit, OnChanges {

  @Input() leadData: any = null; // null = create mode, object = edit mode
  @Output() close = new EventEmitter<void>();
  @Output() upsert = new EventEmitter<any>();


  protected readonly _apiFs = inject(ApiFacadeService);
  protected readonly _coreService = inject(CoreFacadeService);

  protected readonly machineTypes = MACHINE_TYPES;
  protected readonly leadSources = LEAD_SOURCES;
  protected readonly leadStatuses = LEAD_STATUSES;
  protected readonly paymentStatuses = PAYMENT_STATUSES;

  protected isSubmitting = false;
  protected isDuplicateWarning = false;
  protected duplicateCheckDone = false;

  protected form: any = this.getEmptyForm();


  ngOnInit(): void {
    this.initForm();
  }

  ngOnChanges(): void {
    this.initForm();
  }

  private getEmptyForm() {
    return {
      // Basic
      customerName: '',
      firmName: '',
      mobileNumber: '',
      alternateMobileNumber: '',
      email: '',
      machineType: '',
      numberOfMachines: null as number | null,
      machineCompany: '',
      machineDisplayCompany: '',
      unitAddress: '',
      unitLocationUrl: '',
      city: '',
      state: '',
      leadSource: '',
      remarks: '',
      // Visit
      isVisited: false,
      visitDate: '',
      visitedBy: '',
      visitRemarks: '',
      // Status
      leadStatus: 'New',
      // Follow Up
      nextFollowUpDate: '',
      followUpNotes: '',
      // Conversion
      isConverted: false,
      convertedDate: '',
      numberOfMachinesPurchased: null as number | null,
      purchasedMachineCompany: '',
      purchasedMachineType: '',
      pricePerMachine: null as number | null,
      totalSetupPrice: null as number | null,
      amcPrice: null as number | null,
      amcStartDate: '',
      amcEndDate: '',
      paymentStatus: 'Pending',
      conversionRemarks: '',
    };
  }

  private initForm(): void {
    this.isDuplicateWarning = false;
    this.duplicateCheckDone = false;
    if (this.leadData) {
      this.form = {
        customerName: this.leadData.customerName || '',
        firmName: this.leadData.firmName || '',
        mobileNumber: this.leadData.mobileNumber || '',
        alternateMobileNumber: this.leadData.alternateMobileNumber || '',
        email: this.leadData.email || '',
        machineType: this.leadData.machineType || '',
        numberOfMachines: this.leadData.numberOfMachines ?? null,
        machineCompany: this.leadData.machineCompany || '',
        machineDisplayCompany: this.leadData.machineDisplayCompany || '',
        unitAddress: this.leadData.unitAddress || '',
        unitLocationUrl: this.leadData.unitLocationUrl || '',
        city: this.leadData.city || '',
        state: this.leadData.state || '',
        leadSource: this.leadData.leadSource || '',
        remarks: this.leadData.remarks || '',
        isVisited: this.leadData.isVisited || false,
        visitDate: this.leadData.visitDate ? this.toDateInputValue(this.leadData.visitDate) : '',
        visitedBy: this.leadData.visitedBy || '',
        visitRemarks: this.leadData.visitRemarks || '',
        leadStatus: this.leadData.leadStatus || 'New',
        nextFollowUpDate: this.leadData.nextFollowUpDate ? this.toDateInputValue(this.leadData.nextFollowUpDate) : '',
        followUpNotes: this.leadData.followUpNotes || '',
        isConverted: this.leadData.isConverted || false,
        convertedDate: this.leadData.convertedDate ? this.toDateInputValue(this.leadData.convertedDate) : '',
        numberOfMachinesPurchased: this.leadData.numberOfMachinesPurchased ?? null,
        purchasedMachineCompany: this.leadData.purchasedMachineCompany || '',
        purchasedMachineType: this.leadData.purchasedMachineType || '',
        pricePerMachine: this.leadData.pricePerMachine ?? null,
        totalSetupPrice: this.leadData.totalSetupPrice ?? null,
        amcPrice: this.leadData.amcPrice ?? null,
        amcStartDate: this.leadData.amcStartDate ? this.toDateInputValue(this.leadData.amcStartDate) : '',
        amcEndDate: this.leadData.amcEndDate ? this.toDateInputValue(this.leadData.amcEndDate) : '',
        paymentStatus: this.leadData.paymentStatus || 'Pending',
        conversionRemarks: this.leadData.conversionRemarks || '',
      };
    } else {
      this.form = this.getEmptyForm();
    }
  }

  private toDateInputValue(date: string | Date): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }

  protected get isEditMode(): boolean {
    return !!this.leadData?._id;
  }

  protected get showConversionDetails(): boolean {
    return this.form.leadStatus === 'Converted';
  }

  // Auto-compute totalSetupPrice when pricePerMachine or numberOfMachinesPurchased changes
  protected onConversionAmountChange(): void {
    const price = Number(this.form.pricePerMachine) || 0;
    const qty = Number(this.form.numberOfMachinesPurchased) || 0;
    if (price > 0 && qty > 0) {
      this.form.totalSetupPrice = price * qty;
    }
  }

  // Check for duplicate mobile number (on blur)
  protected onMobileBlur(): void {
    const mobile = (this.form.mobileNumber || '').trim();
    if (!mobile) return;
    const excludeId = this.isEditMode ? this.leadData._id : undefined;
    this._apiFs.lead.checkDuplicate(mobile, excludeId).subscribe({
      next: (res: IResponse) => {
        if (res.code === 'OK') {
          this.isDuplicateWarning = res.data?.isDuplicate === true;
          this.duplicateCheckDone = true;
        }
      },
      error: () => {}
    });
  }

  protected validate(): string | null {
    if (!this.form.customerName?.trim()) return 'Customer name is required.';
    if (!this.form.firmName?.trim()) return 'Firm name is required.';
    if (!this.form.mobileNumber?.trim()) return 'Mobile number is required.';
    if (!this.form.machineType) return 'Machine type is required.';
    if (!this.form.numberOfMachines || this.form.numberOfMachines < 1) return 'Number of machines must be at least 1.';
    if (!this.form.leadStatus) return 'Lead status is required.';
    if (this.form.isVisited) {
      if (!this.form.visitDate) return 'Visit date is required when visited.';
      if (!this.form.visitedBy?.trim()) return 'Visited by is required when visited.';
    }
    if (this.form.leadStatus === 'Converted') {
      if (!this.form.convertedDate) return 'Converted date is required.';
      if (!this.form.numberOfMachinesPurchased || this.form.numberOfMachinesPurchased < 1) return 'Number of machines purchased is required.';
      if (!this.form.pricePerMachine || this.form.pricePerMachine < 0) return 'Price per machine is required.';
      if (this.form.amcPrice == null || this.form.amcPrice < 0) return 'AMC price is required.';
    }
    return null;
  }

  protected onSubmit(): void {
    const error = this.validate();
    if (error) {
      this._coreService.utils.showToaster(EToasterType.Danger, error);
      return;
    }
    if (this.isSubmitting) return;

    this.isSubmitting = true;
    const payload = { ...this.form };
    // Sync isConverted
    payload.isConverted = payload.leadStatus === 'Converted';
    // Clean empty dates
    if (!payload.visitDate) payload.visitDate = null;
    if (!payload.nextFollowUpDate) payload.nextFollowUpDate = null;
    if (!payload.convertedDate) payload.convertedDate = null;
    if (!payload.amcStartDate) payload.amcStartDate = null;
    if (!payload.amcEndDate) payload.amcEndDate = null;

    const request$ = this.isEditMode
      ? this._apiFs.lead.update(this.leadData._id, payload)
      : this._apiFs.lead.create(payload);

    request$.subscribe({
      next: (res: IResponse) => {
        this.isSubmitting = false;
        if (res.code === 'OK' || res.code === 'CREATED') {
          const msg = this.isEditMode ? 'Lead updated successfully.' : 'Lead created successfully.';
          this._coreService.utils.showToaster(EToasterType.Success, msg);
          this.upsert.emit(res.data?.lead ?? res.data);
        }
      },
      error: (err: any) => {
        this.isSubmitting = false;
        const msg = err?.error?.message ?? 'Something went wrong. Please try again.';
        this._coreService.utils.showToaster(EToasterType.Danger, msg);
      }
    });
  }

  protected onClose(): void {
    this.close.emit();
  }
}
