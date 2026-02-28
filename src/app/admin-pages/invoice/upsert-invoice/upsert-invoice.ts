import { Component, inject, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { CoreFacadeService } from '@src/app/core/services/core-facade-service';
import { EToasterType } from '@src/app/models/utils.model';
import { ApiFacadeService } from '@src/app/services/api-facade-service';
import { ROUTES } from '@src/app/constants/app.routes';
import { CommonDropdown } from '@src/app/shared/components/common-dropdown/common-dropdown';
import { CommonModule } from '@angular/common';

export type TaxType = 'cgstSgst' | 'igst';


@Component({
  selector: 'app-upsert-invoice',
  imports: [
    ReactiveFormsModule,
    CommonModule,
    CommonDropdown
  ],
  templateUrl: './upsert-invoice.html',
  styleUrl: './upsert-invoice.scss'
})
export class UpsertInvoice implements OnInit {

  protected readonly _coreService = inject(CoreFacadeService);
  protected readonly _apiFs = inject(ApiFacadeService);
  protected readonly _fb = inject(FormBuilder);
  protected readonly _router = inject(Router);
  protected readonly _route = inject(ActivatedRoute);

  protected workspaceOptions: any[] = [];
  protected selectedWorkspace: any = null;
  protected isReqAlive = false;
  protected invoiceId: string | null = null;

  protected invoiceForm!: FormGroup;

  protected readonly taxTypeOptions: { value: TaxType; label: string }[] = [
    { value: 'cgstSgst', label: 'CGST + SGST' },
    { value: 'igst', label: 'IGST' }
  ];

  private static readonly CGST_PERCENT = 9;
  private static readonly SGST_PERCENT = 9;
  private static readonly IGST_PERCENT = 18;


  ngOnInit(): void {
    this.buildForm();
    this.invoiceId = this._route.snapshot.paramMap.get('invoiceId');
    this.loadOptions();
    this.setupCalculations();
    if (this.invoiceId) {
      this.loadInvoice(this.invoiceId);
    }
  }


  private static atLeastOneLineItemRequired(control: AbstractControl): ValidationErrors | null {
    const lineItems = control.get('lineItems');
    if (!lineItems?.value || !Array.isArray(lineItems.value)) return null;
    const hasValid = (lineItems.value as any[]).some((row: any) => (Number(row?.amount) || 0) > 0);
    return hasValid ? null : { atLeastOneLineItemRequired: true };
  }

  /** If any of description, qty or unitPrice is filled, all three must be filled for that row. */
  private static lineItemAllOrNothing(control: AbstractControl): ValidationErrors | null {
    const g = control as FormGroup;
    const desc = (g.get('itemDescription')?.value ?? '').toString().trim();
    const qty = Number(g.get('qty')?.value);
    const unitPrice = Number(g.get('unitPrice')?.value);
    const anyFilled = desc.length > 0 || qty > 0 || unitPrice > 0;
    if (!anyFilled) return null;
    const hasDesc = desc.length > 0;
    const hasQty = !Number.isNaN(qty) && hasDesc ? qty > 0 : qty >= 0;
    const hasUnitPrice = !Number.isNaN(unitPrice) && unitPrice >= 0;
    return hasDesc && hasQty && hasUnitPrice ? null : { lineItemIncomplete: true };
  }

  private buildForm(): void {
    this.invoiceForm = this._fb.group({
      workspaceId: ['', [Validators.required]],
      invoiceDate: [null as string | null, [Validators.required]],
      amcAmount: [null as number | null, [Validators.required, Validators.min(0)]],
      workspace: this._fb.group({
        firmName: ['', [Validators.required]],
        gst: ['', []],
        mobile: ['', []],
        address: ['', []],
        subscriptionStartDate: [null as string | null, [Validators.required]],
        subscriptionEndDate: [null as string | null, [Validators.required]]
      }),
      lineItems: this._fb.array([this.createLineItemGroup()]),
      totalAmount: [{ value: 0, disabled: true }, []],
      discountedTotal: [{ value: 0, disabled: true }, []],
      cgstAmount: [{ value: 0, disabled: true }, []],
      sgstAmount: [{ value: 0, disabled: true }, []],
      igstAmount: [{ value: 0, disabled: true }, []],
      discount: [0, [Validators.min(0)]],
      inAndAmount: [null as number | null, [Validators.min(0)]],
      roundOff: [{ value: 0, disabled: true }, []],
      finalAmount: [{ value: 0, disabled: true }, []],
      includesGst: [null, [Validators.required]],
      taxType: ['cgstSgst' as TaxType, []]
    });
  }

  private createLineItemGroup(): FormGroup {
    return this._fb.group({
      itemDescription: ['', []],
      qty: [0, [Validators.min(0)]],
      unitPrice: [0, [Validators.min(0)]],
      amount: [0, [Validators.min(0)]]
    });
  }

  /** Runs line item validation on submit: per-row “all or nothing” and at least one line item required. */
  private validateLineItemsOnSubmit(): void {
    this.lineItemsArray.controls.forEach((ctrl) => {
      const errors = UpsertInvoice.lineItemAllOrNothing(ctrl);
      ctrl.setErrors(errors);
    });
    this.lineItemsArray.updateValueAndValidity({ emitEvent: false });

    const atLeastOneError = UpsertInvoice.atLeastOneLineItemRequired(this.invoiceForm);
    const currentErrors = this.invoiceForm.errors ?? {};
    const newErrors = { ...currentErrors };
    if (atLeastOneError) {
      newErrors['atLeastOneLineItemRequired'] = true;
    } else {
      delete newErrors['atLeastOneLineItemRequired'];
    }
    this.invoiceForm.setErrors(Object.keys(newErrors).length ? newErrors : null);
  }

  protected get lineItemsArray(): FormArray {
    return this.invoiceForm.get('lineItems') as FormArray;
  }

  /** Recalculates amount (qty × unitPrice) for a single line item group. */
  private updateLineItemAmount(group: AbstractControl): void {
    const g = group as FormGroup;
    const qty = Number(g.get('qty')?.value) || 0;
    const unitPrice = Number(g.get('unitPrice')?.value) || 0;
    g.get('amount')?.setValue(Math.round(qty * unitPrice * 100) / 100, { emitEvent: false });
  }

  /** Recalculates amount for every line item (e.g. after add/remove so indices stay correct). */
  private refreshAllLineItemAmounts(): void {
    this.lineItemsArray.controls.forEach((ctrl) => this.updateLineItemAmount(ctrl));
    this.recalculateTotals();
  }

  protected addLineItem(): void {
    const newGroup = this.createLineItemGroup();
    this.lineItemsArray.push(newGroup);
    newGroup.get('qty')?.valueChanges.subscribe(() => this.updateLineItemAmount(newGroup));
    newGroup.get('unitPrice')?.valueChanges.subscribe(() => this.updateLineItemAmount(newGroup));
    this.refreshAllLineItemAmounts();
  }

  protected removeLineItem(index: number): void {
    if (this.lineItemsArray.length > 1) {
      this.lineItemsArray.removeAt(index);
      this.refreshAllLineItemAmounts();
    }
  }

  private loadOptions(): void {
    this._apiFs.invoice.getOptions().subscribe({
      next: (res: any) => {
        const data = res?.data;
        let list: any[] = Array.isArray(data) ? data : data?.workspaces ?? data?.list ?? [];
        this.workspaceOptions = list.map((w: any) => ({
          ...w,
          workspaceName: w.firmName ?? ''
        }));
        if (this.invoiceId) {
          const workspaceId = this.invoiceForm.get('workspaceId')?.value;
          if (workspaceId) {
            const opt = this.workspaceOptions.find((w: any) => (w._id ?? w.id) === workspaceId);
            if (opt) this.selectedWorkspace = opt;
          }
        }
      },
      error: () => {
        this.workspaceOptions = [];
      }
    });
  }

  protected onWorkspaceSelect(option: any): void {
    this.selectedWorkspace = option;
    this.invoiceForm.patchValue({
      workspaceId: option?._id ?? '',
      amcAmount: option?.amcAmount ?? null
    }, { emitEvent: true });
    if (!option) return;

    const workspace = this.invoiceForm.get('workspace') as FormGroup;
    workspace.patchValue({
      firmName: option.firmName ?? '',
      gst: option.GSTNo ?? ''
    });
  }

  private loadInvoice(id: string): void {
    this._apiFs.invoice.getById(id).subscribe({
      next: (res: any) => {
        const inv = res?.data ?? res;
        if (!inv) return;

        const ws = inv.workspace ?? {};
        this.invoiceForm.patchValue({
          workspaceId: inv.workspaceId ?? '',
          invoiceDate: inv.invoiceDate?.split?.('T')[0] ?? null,
          amcAmount: inv.amcAmount != null ? Number(inv.amcAmount) : (inv.workspace?.amcAmount != null ? Number(inv.workspace.amcAmount) : null),
          workspace: {
            firmName: ws.firmName ?? '',
            gst: ws.gst ?? ws.GSTNo ?? '',
            mobile: ws.mobile ?? '',
            address: ws.address ?? '',
            subscriptionStartDate: ws.subscriptionStartDate?.split('T')[0] ?? null,
            subscriptionEndDate: ws.subscriptionEndDate?.split('T')[0] ?? null
          },
          discount: Number(inv.discount) ?? 0,
          inAndAmount: inv.inAndAmount ?? null,
          includesGst: !!inv.includesGst,
          taxType: (inv.taxType ?? 'cgstSgst') as TaxType
        }, { emitEvent: false });
        const items = inv.lineItems;
        if (Array.isArray(items) && items.length > 0) {
          this.lineItemsArray.clear();
          items.forEach((item: any) => {
            const g = this.createLineItemGroup();
            g.patchValue({
              itemDescription: item.itemDescription ?? '',
              qty: Number(item.qty) ?? 0,
              unitPrice: Number(item.unitPrice) ?? 0,
              amount: Number(item.amount) ?? 0
            }, { emitEvent: false });
            this.lineItemsArray.push(g);
            g.get('qty')?.valueChanges.subscribe(() => this.updateLineItemAmount(g));
            g.get('unitPrice')?.valueChanges.subscribe(() => this.updateLineItemAmount(g));
          });
        }
        this.refreshAllLineItemAmounts();
        const workspaceId = inv.workspaceId ?? inv.workspace?._id;
        if (workspaceId && this.workspaceOptions.length) {
          const opt = this.workspaceOptions.find((w: any) => (w._id ?? w.id) === workspaceId);
          if (opt) this.selectedWorkspace = opt;
        }
        if (this.invoiceId) {
          this.invoiceForm.get('includesGst')?.disable();
        }
      },
      error: () => {
        this._coreService.utils.showToaster(EToasterType.Danger, 'Failed to load invoice.');
      }
    });
  }

  private setupCalculations(): void {
    const subscribeLineItem = (ctrl: AbstractControl) => {
      const g = ctrl as FormGroup;
      g.get('qty')?.valueChanges.subscribe(() => this.updateLineItemAmount(ctrl));
      g.get('unitPrice')?.valueChanges.subscribe(() => this.updateLineItemAmount(ctrl));
    };
    this.lineItemsArray.controls.forEach(subscribeLineItem);
    this.lineItemsArray.valueChanges.subscribe(() => this.recalculateTotals());

    this.invoiceForm.valueChanges.subscribe(() => this.recalculateTotals());
    this.refreshAllLineItemAmounts();
  }

  private recalculateTotals(): void {
    const items = this.lineItemsArray.getRawValue();
    const totalAmount = items.reduce((sum: number, row: any) => sum + (Number(row.amount) || 0), 0);
    const inAndAmountCtrl = this.invoiceForm.get('inAndAmount');
    const inAndVal = inAndAmountCtrl?.value;
    const inAndNum = Number(inAndVal);
    const useInAndAmount = inAndVal != null && inAndVal !== '' && !Number.isNaN(inAndNum);

    if (inAndAmountCtrl && useInAndAmount && inAndNum > totalAmount) {
      inAndAmountCtrl.setErrors({ ...(inAndAmountCtrl.errors ?? {}), inAndAmountExceedsTotal: { totalAmount } });
    } else if (inAndAmountCtrl?.errors?.['inAndAmountExceedsTotal']) {
      const errs = { ...inAndAmountCtrl.errors };
      delete errs['inAndAmountExceedsTotal'];
      inAndAmountCtrl.setErrors(Object.keys(errs).length ? errs : null);
    }

    let discountedTotal: number;
    let discount: number;
    if (useInAndAmount && inAndNum <= totalAmount) {
      const clearAmount = Math.max(0, Math.min(inAndNum, totalAmount));
      discountedTotal = Math.round(clearAmount * 100) / 100;
      discount = Math.round((totalAmount - discountedTotal) * 100) / 100;
      this.invoiceForm.patchValue({ discount }, { emitEvent: false });
    } else {
      discount = Number(this.invoiceForm.get('discount')?.value) || 0;
      discountedTotal = Math.max(0, totalAmount - discount);
    }
    const includesGst = !!this.invoiceForm.get('includesGst')?.value;
    const taxType = (this.invoiceForm.get('taxType')?.value as TaxType) || 'cgstSgst';

    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;
    if (includesGst) {
      if (taxType === 'cgstSgst') {
        cgstAmount = Math.round((discountedTotal * UpsertInvoice.CGST_PERCENT / 100) * 100) / 100;
        sgstAmount = Math.round((discountedTotal * UpsertInvoice.SGST_PERCENT / 100) * 100) / 100;
      } else {
        igstAmount = Math.round((discountedTotal * UpsertInvoice.IGST_PERCENT / 100) * 100) / 100;
      }
    }
    const amountBeforeRoundOff = discountedTotal + cgstAmount + sgstAmount + igstAmount;
    const finalAmountRounded = Math.round(amountBeforeRoundOff);
    const roundOff = Math.round((finalAmountRounded - amountBeforeRoundOff) * 100) / 100;

    this.invoiceForm.patchValue({
      totalAmount: Math.round(totalAmount * 100) / 100,
      discountedTotal: Math.round(discountedTotal * 100) / 100,
      cgstAmount,
      sgstAmount,
      igstAmount,
      roundOff,
      finalAmount: finalAmountRounded
    }, { emitEvent: false });
    this.invoiceForm.updateValueAndValidity({ emitEvent: false });
  }

  protected onSubmit(): void {
    if (this.isReqAlive) return;
    this.validateLineItemsOnSubmit();

    if (this.invoiceForm.invalid) {
      this.invoiceForm.markAllAsTouched();
      return;
    }

    const raw = this.invoiceForm.getRawValue();
    const allLineItems = raw.lineItems.map((item: any) => ({
      itemDescription: item.itemDescription ?? '',
      qty: Number(item.qty) || 0,
      unitPrice: Number(item.unitPrice) || 0,
      amount: Number(item.amount) || 0
    }));
    const lineItems = allLineItems.filter(
      (item: any) =>
        (item.itemDescription?.trim?.() ?? '').length > 0 ||
        item.qty > 0 ||
        item.unitPrice > 0 ||
        item.amount > 0
    );

    const payload = {
      workspaceId: raw.workspaceId,
      invoiceDate: raw.invoiceDate || null,
      amcAmount: raw.amcAmount != null ? Number(raw.amcAmount) : null,
      workspace: {
        firmName: raw.workspace.firmName ?? '',
        gst: raw.workspace.gst ?? '',
        mobile: raw.workspace.mobile ?? '',
        address: raw.workspace.address ?? '',
        subscriptionStartDate: raw.workspace.subscriptionStartDate || null,
        subscriptionEndDate: raw.workspace.subscriptionEndDate || null
      },
      lineItems,
      totalAmount: raw.totalAmount,
      discountedTotal: raw.discountedTotal,
      includesGst: !!raw.includesGst,
      taxType: raw.taxType,
      cgstAmount: raw.cgstAmount,
      sgstAmount: raw.sgstAmount,
      igstAmount: raw.igstAmount,
      discount: Number(raw.discount) || 0,
      roundOff: Number(raw.roundOff) || 0,
      finalAmount: raw.finalAmount,
      inAndAmount: raw.inAndAmount,
    };

    this.isReqAlive = true;
    const req = this.invoiceId
      ? this._apiFs.invoice.update(this.invoiceId, payload)
      : this._apiFs.invoice.create(payload);
    req.subscribe({
      next: (res: any) => {
        this.isReqAlive = false;
        if (res?.code === 'OK' || res?.code === 'CREATED') {
          this._coreService.utils.showToaster(
            EToasterType.Success,
            this.invoiceId ? 'Invoice updated successfully.' : 'Invoice created successfully.'
          );
          this._router.navigate([ROUTES.ADMIN.BASE, ROUTES.ADMIN.INVOICE]);
        }
      },
      error: (err: any) => {
        this.isReqAlive = false;
        const msg = err?.error?.message || (this.invoiceId ? 'Failed to update invoice.' : 'Failed to create invoice. Please try again.');
        this._coreService.utils.showToaster(EToasterType.Danger, msg);
      }
    });
  }

  protected goBack(): void {
    this._router.navigate([ROUTES.ADMIN.BASE, ROUTES.ADMIN.INVOICE]);
  }

  protected navigateToPrint(): void {
    if (!this.invoiceId) return;
    this._router.navigate([ROUTES.ADMIN.BASE, ROUTES.ADMIN.INVOICE, ROUTES.ADMIN.INVOICE_PRINT, this.invoiceId]);
  }

  get workspaceId(): AbstractControl | null {
    return this.invoiceForm.get('workspaceId');
  }
  get invoiceDate(): AbstractControl | null {
    return this.invoiceForm.get('invoiceDate');
  }
  get amcAmount(): AbstractControl | null {
    return this.invoiceForm.get('amcAmount');
  }
  get discount(): AbstractControl | null {
    return this.invoiceForm.get('discount');
  }
  get inAndAmount(): AbstractControl | null {
    return this.invoiceForm.get('inAndAmount');
  }
  get firmName(): AbstractControl | null {
    return this.invoiceForm.get('workspace.firmName');
  }
  get subscriptionStartDate(): AbstractControl | null {
    return this.invoiceForm.get('workspace.subscriptionStartDate');
  }
  get subscriptionEndDate(): AbstractControl | null {
    return this.invoiceForm.get('workspace.subscriptionEndDate');
  }
  get includesGst(): AbstractControl | null {
    return this.invoiceForm.get('includesGst');
  }
  getLineItemControl(index: number, path: string): AbstractControl | null {
    return this.lineItemsArray.at(index)?.get(path) ?? null;
  }

  /** Returns the form group errors for a line item row (e.g. lineItemIncomplete). */
  getLineItemRowErrors(index: number): ValidationErrors | null {
    const group = this.lineItemsArray.at(index);
    return group?.errors ?? null;
  }
}