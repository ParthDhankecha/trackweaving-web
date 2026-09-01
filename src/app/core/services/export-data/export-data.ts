import { Injectable } from '@angular/core';

import moment from 'moment';

import * as XLSX from 'xlsx';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
(pdfMake as any).vfs = pdfFonts['vfs'];
import { saveAs } from 'file-saver';
import { getStopColumnsForTypes, hasStopKey, MachineType, formatQualityReed } from '@src/app/models/machine.model';

export type TExportAction = 'download' | 'share';

@Injectable({
  providedIn: 'root'
})
export class ExportData {
  /**
   * EXPORT TO EXCEL (.xlsx) (using SheetJS)
   */
  async exportTableToExcel(tableElement: HTMLTableElement, filename: string = 'shift-report.xlsx', options?: { isDevice: boolean, action?: TExportAction }): Promise<void> {
    const ws: XLSX.WorkSheet = XLSX.utils.table_to_sheet(tableElement, {
      raw: true
    });
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

    if (options?.isDevice) {
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
      (window as any).FlutterDownload?.postMessage(JSON.stringify({
        base64: wbout,
        ext: 'xlsx',
        action: options?.action || 'download'
      }));
    } else {
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      saveAs(new Blob([wbout], { type: 'application/octet-stream' }), filename);
    }
  }

  /**
   * EXPORT TO PDF (using pdfMake)
   */
  async exportTableToPDF(reportData: any, options?: { isDevice: boolean, action?: TExportAction }): Promise<void> {
    const title = reportData.reportTitle || 'Report';
    const isStoppageReport = reportData.reportType === 'stoppageReport';
    const isBeamProductionReport = reportData.reportType === 'beamProductionReport';
    const isBeamCompletionDateReport = reportData.reportType === 'beamCompletionDateReport';
    const isQualityWiseReport = reportData.reportType === 'qualityProductionReport';
    const isBy24Hours = !!reportData.isBy24Hours;
    const stopColumns = reportData.stopColumns || this.resolveStopColumns(reportData.list || []);
    const showBeamCompletionDate = !!reportData.showBeamCompletionDateColumn || this.hasBeamCompletionDate(reportData);
    const isPortrait = isStoppageReport || isBeamProductionReport || isBeamCompletionDateReport;

    const tableColspan = isBy24Hours ? (4 + ((reportData.shiftColumns?.length ?? 0) * 2) + (showBeamCompletionDate ? 1 : 0))
      : (isBeamCompletionDateReport ? 5 : (isPortrait ? 7 : (showBeamCompletionDate ? 12 : 11) + stopColumns.length * 2 + 2));

    const content: any[] = [
      { text: title, style: 'header' },
    ];

    if (reportData.fromDate && reportData.toDate) {
      content.push({
        text: `Report Period: ${this.formatDate(reportData.fromDate)} to ${this.formatDate(reportData.toDate)}`,
        style: 'subHeader'
      });
    }

    if (isQualityWiseReport) {
      content.push({ text: reportData.quality || 'Quality', style: 'sectionTitle' });
      const qualityStopColumns = reportData.stopColumns || this.resolveStopColumns(reportData.list || []);
      const qualityFixedColCount = showBeamCompletionDate ? 11 : 10;
      const qualityColspan = qualityFixedColCount + qualityStopColumns.length * 2 + 2;
      content.push({
        table: {
          headerRows: 2,
          widths: Array(qualityColspan).fill('auto'),
          body: this.buildQualityWiseTableBody(reportData, qualityStopColumns, qualityColspan)
        },
        width: 'auto',
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: '#bfbfbf',
          vLineColor: '#bfbfbf',
        }
      });
    } else {
      let bodyData;
      if (isStoppageReport) {
        bodyData = this.buildStoppageTableBody(reportData);
      } else if (isBeamProductionReport) {
        bodyData = this.buildBeamLeftTableBody(reportData);
      } else if (isBeamCompletionDateReport) {
        bodyData = this.buildBeamCompletionDateTableBody(reportData);
      } else if (isBy24Hours) {
        bodyData = this.buildBy24HoursTableBody(reportData, stopColumns, tableColspan);
      } else {
        bodyData = this.buildTableBody(reportData, stopColumns, tableColspan);
      }

      content.push({
        table: {
          headerRows: isBy24Hours ? 3 : (isPortrait ? 1 : 2),
          widths: isBeamCompletionDateReport
            ? ['auto', 'auto', 'auto', 'auto', 'auto']
            : (isPortrait ? ['auto', 'auto', 'auto', '*', '*', '*', 'auto'] : Array(tableColspan).fill('auto')),
          body: bodyData
        },
        width: 'auto',
        // layout: 'lightHorizontalLines',
        layout: {
          hLineWidth: () => 0.5,// horizontal line width
          vLineWidth: () => 0.5,// vertical line width
          hLineColor: '#bfbfbf',
          vLineColor: '#bfbfbf',
        }
      });
    }

    let fontSize = 8, subHeaderFontSize = 8;
    if (isBy24Hours) {
      if (showBeamCompletionDate && reportData.stopColumns?.length > 4) {
        fontSize = 7;
        subHeaderFontSize = 7.4;
      } else if (showBeamCompletionDate) {
        subHeaderFontSize = 8.75;
      } else if (reportData.stopColumns?.length > 4) {
        fontSize = 6.75;
      } else {
        fontSize = 8.75;
        subHeaderFontSize = 9;
      }
    }
    const docDefinition: any = {
      pageOrientation: isPortrait ? 'portrait' : 'landscape',
      pageSize: isBy24Hours ? 'A3' : 'A4',
      pageMargins: [16, 16, 16, 16],
      content,
      styles: {
        header: { bold: true, alignment: 'center', margin: [0, 0, 0, 5], fontSize: 18 },
        subHeader: { alignment: 'center', margin: [0, 0, 0, 10] },
        sectionTitle: { bold: true, margin: [0, 6, 0, 4], fontSize: 12 },
        tableHeader: { bold: true, fillColor: '#343a40', color: 'white', alignment: 'center' },
        tableSubHeader: { bold: true, fillColor: '#495057', color: 'white', alignment: 'center', fontSize: subHeaderFontSize },
        cellCenter: { alignment: 'center' },
        contentCell: { alignment: 'center', fontSize: fontSize },
        contentCellBg: { alignment: 'center', fontSize: fontSize, fillColor: '#ededed' },
        subTotalCell: { bold: true, fontSize: fontSize, alignment: 'center' },
        subTotalCellBg: { bold: true, fontSize: fontSize, alignment: 'center', fillColor: '#ededed' },
        cellBold: { bold: true },
        grandTotalCell: { bold: true, fillColor: '#495057', color: 'white', }
      },
      defaultStyle: {
        fontSize: 10
      }
    };

    if (options?.isDevice) {
      // use save as pdf to save the pdf file
      pdfMake.createPdf(docDefinition).getBase64((base64: string) => {
        (window as any).FlutterDownload?.postMessage(JSON.stringify({
          base64: base64,
          ext: 'pdf',
          action: options?.action || 'download'
        }));
      });
    } else {
      pdfMake.createPdf(docDefinition).open();
    }
  }

  // helper methods for PDF export
  protected hasBeamCompletionDate(reportData: any): boolean {
    return (reportData.list || []).some((item: any) =>
      (item.list || []).some((data: any) => !!data.beamCompletionDate)
    );
  }

  protected resolveStopColumns(reportList: any[]) {
    const machineTypes = new Set<MachineType>();
    reportList.forEach(item => {
      (item.list || []).forEach((data: any) => {
        machineTypes.add((data.machineType || 'rapier') as MachineType);
      });
    });
    return getStopColumnsForTypes([...machineTypes]);
  }

  protected getStopValue(data: any, key: string, field: 'count' | 'duration') {
    if (!hasStopKey((data?.machineType || 'rapier') as MachineType, key)) {
      return '-';
    }
    return data?.stopsData?.[key]?.[field] ?? '-';
  }

  private readonly grandTotalFill = {
    style: 'grandTotalCell',
    fillColor: '#495057',
    color: 'white',
    bold: true
  };


  private isNightShift(shift: number | string | undefined | null): boolean {
    return shift === 1 || shift === 'Night Shift';
  }
  private isNightShiftGroup(item: any): boolean {
    return this.isNightShift(item?.shiftLabel) || this.isNightShift(item?.list?.[0]?.shift);
  }
  private contentCellStyle(isNight: boolean): string {
    return isNight ? 'contentCellBg' : 'contentCell';
  }
  private subTotalCellStyle(isNight: boolean): string {
    return isNight ? 'subTotalCellBg' : 'subTotalCell';
  }


  protected colSpanCells(text: string, colSpan: number, cellStyle: Record<string, unknown>, extra: Record<string, unknown> = {}): any[] {
    return [
      { text: text || ' ', colSpan, ...cellStyle, ...extra },
      ...Array(colSpan - 1).fill({})
    ];
  }

  protected buildTableBody(reportData: any, stopColumns: { key: string; label: string }[], tableColspan: number) {
    const body: any[] = [];
    const showBeamCompletionDate = !!reportData.showBeamCompletionDateColumn || this.hasBeamCompletionDate(reportData);
    const stopSectionColspan = stopColumns.length * 2 + 2;
    const fixedColCount = showBeamCompletionDate ? 12 : 11;
    const avgColspan = showBeamCompletionDate ? 3 : 2;

    const headerRow1: any[] = [
      { text: 'Date', rowSpan: 2, style: 'tableHeader' },
      { text: 'Shift', rowSpan: 2, style: 'tableHeader' },
      { text: 'Machine', rowSpan: 2, style: 'tableHeader' },
      { text: 'Quality', rowSpan: 2, style: 'tableHeader' },
      { text: 'Prod. [Mtrs]', rowSpan: 2, style: 'tableHeader' },
      { text: 'Picks', rowSpan: 2, style: 'tableHeader' },
      { text: 'Eff. %', rowSpan: 2, style: 'tableHeader' },
      { text: 'Real Eff.%', rowSpan: 2, style: 'tableHeader' },
      { text: 'Speed', rowSpan: 2, style: 'tableHeader' },
      { text: 'Run Time', rowSpan: 2, style: 'tableHeader' },
      { text: 'Beam Left', rowSpan: 2, style: 'tableHeader' },
    ];
    if (showBeamCompletionDate) {
      headerRow1.push({ text: 'Beam Completion Date', rowSpan: 2, style: 'tableHeader' });
    }
    stopColumns.forEach(column => {
      headerRow1.push({ text: column.label, colSpan: 2, style: 'tableHeader' }, {});
    });
    headerRow1.push({ text: 'Total Stops', colSpan: 2, rowSpan: 2, style: 'tableHeader' }, {});
    body.push(headerRow1);

    const headerRow2: any[] = Array(fixedColCount).fill({});
    stopColumns.forEach(() => {
      headerRow2.push({ text: 'Count', style: 'tableSubHeader' });
      headerRow2.push({ text: 'Duration', style: 'tableSubHeader' });
    });
    headerRow2.push({}, {});
    body.push(headerRow2);

    // ---- Data Rows ----
    for (const item of reportData.list || []) {
      let shiftIndex = 0;
      const isNight = this.isNightShiftGroup(item);
      const cellStyle = this.contentCellStyle(isNight);
      for (const data of item.list || []) {
        let cells = [{}, {}];
        if (shiftIndex === 0) {
          cells = [
            { text: this.formatDate(item.reportDate), rowSpan: item.list.length, style: cellStyle },
            { text: item.shiftLabel, rowSpan: item.list.length, style: cellStyle },
          ];
        }
        const row: any[] = [
          ...cells,
          { text: data.machineCode, style: cellStyle },
          { text: formatQualityReed(data.quality, data.reed), style: cellStyle },
          { text: data.pieceLengthM, style: cellStyle },
          { text: data.picksCurrentShift, style: cellStyle },
          { text: data.efficiencyPercent, style: cellStyle },
          { text: data.realEfficiencyPercent ?? '-', style: cellStyle },
          { text: data.speedRpm ?? '0', style: cellStyle },
          { text: data.runTime || '-', style: cellStyle },
          { text: data.beamLeft, style: cellStyle },
        ];
        if (showBeamCompletionDate) {
          row.push({
            text: data.beamCompletionDate ? this.formatDate(data.beamCompletionDate) : '-',
            style: cellStyle
          });
        }
        stopColumns.forEach(column => {
          row.push({ text: this.getStopValue(data, column.key, 'count'), style: cellStyle });
          row.push({ text: this.getStopValue(data, column.key, 'duration'), style: cellStyle });
        });
        row.push(
          { text: data.stopsData?.total?.count ?? '-', style: cellStyle, bold: true },
          { text: data.stopsData?.total?.duration ?? '-', style: cellStyle, bold: true }
        );
        body.push(row);
        shiftIndex++;
      }

      const subTtlCellStyle = this.subTotalCellStyle(isNight);
      body.push([
        { text: '', style: subTtlCellStyle },
        { text: `${this.formatDate(item.reportDate)} - ${item.shiftLabel}`, colSpan: 3, style: subTtlCellStyle }, {}, {},
        { text: this.formatNum(item.prodMeter), style: subTtlCellStyle },
        { text: item.totalPicks, style: subTtlCellStyle },
        { text: this.num(item.efficiency, 1), style: subTtlCellStyle },
        { text: this.num(item.realEfficiency, 1), style: subTtlCellStyle },
        { text: this.formatNum(item.avgSpeed), style: subTtlCellStyle },
        { text: `Avg: ${item.avgPicks}`, colSpan: avgColspan, alignment: 'left', style: subTtlCellStyle }, ...Array(avgColspan - 1).fill({}),
        { text: '', colSpan: stopSectionColspan, style: subTtlCellStyle }, ...Array(stopSectionColspan - 1).fill({})
      ]);
      if (item?.fullDay) {
        body.push([
          { text: '', style: subTtlCellStyle },
          { text: `${this.formatDate(item.fullDay.reportDate)} - ${item.fullDay.shiftLabel}`, colSpan: 3, style: subTtlCellStyle }, {}, {},
          { text: this.formatNum(item.fullDay.prodMeter), style: subTtlCellStyle },
          { text: item.fullDay.totalPicks, style: subTtlCellStyle },
          { text: this.num(item.fullDay.efficiency, 1), style: subTtlCellStyle },
          { text: this.num(item.fullDay.realEfficiency, 1), style: subTtlCellStyle },
          { text: this.formatNum(item.fullDay.avgSpeed), style: subTtlCellStyle },
          { text: `Avg: ${item.fullDay.avgPicks}`, colSpan: avgColspan, alignment: 'left', style: subTtlCellStyle }, ...Array(avgColspan - 1).fill({}),
          { text: '', colSpan: stopSectionColspan, style: subTtlCellStyle }, ...Array(stopSectionColspan - 1).fill({})
        ]);
      }
    }

    body.push([
      { text: ' ', colSpan: tableColspan },
      ...Array(tableColspan - 1).fill({})
    ]);

    body.push([
      ...this.colSpanCells('Total', 4, this.grandTotalFill, { alignment: 'center' }),
      { text: this.formatNum(reportData.avgProdMeter), ...this.grandTotalFill },
      { text: reportData.totalPicks, ...this.grandTotalFill },
      { text: reportData.totalEfficiency, ...this.grandTotalFill },
      { text: reportData.totalRealEfficiency, ...this.grandTotalFill },
      { text: reportData.avgSpeed || 0, ...this.grandTotalFill },
      ...this.colSpanCells(`Total Avg: ${reportData.avgPicks}`, avgColspan, this.grandTotalFill, { alignment: 'left' }),
      ...this.colSpanCells(' ', stopSectionColspan, this.grandTotalFill)
    ]);

    return body;
  }

  protected buildBy24HoursTableBody(reportData: any, stopColumns: { key: string; label: string }[], tableColspan: number) {
    const body: any[] = [];
    const showBeamCompletionDate = !!reportData.showBeamCompletionDateColumn || this.hasBeamCompletionDate(reportData);
    const stopSectionColspan = stopColumns.length * 4 + 4;
    const avgColspan = showBeamCompletionDate ? 5 : 4;
    const metricPairs = [
      { key: 'pieceLengthM', avgLabel: false },
      { key: 'picksCurrentShift', avgLabel: false },
      { key: 'efficiencyPercent', avgLabel: true },
      { key: 'realEfficiencyPercent', avgLabel: true },
      { key: 'speedRpm', avgLabel: false },
      { key: 'runTime', avgLabel: false },
      { key: 'beamLeft', avgLabel: false },
    ];

    // Header row 1
    const headerRow1: any[] = [
      { text: 'Date', rowSpan: 3, style: 'tableHeader' },
      { text: 'Machine', rowSpan: 3, style: 'tableHeader' },
      { text: 'Quality', rowSpan: 3, style: 'tableHeader' },
      { text: 'Shift', rowSpan: 3, style: 'tableHeader' },
      { text: 'Prod. [Mtrs]', colSpan: 2, rowSpan: 2, style: 'tableHeader' }, {},
      { text: 'Picks', colSpan: 2, rowSpan: 2, style: 'tableHeader' }, {},
      { text: 'Eff. %', colSpan: 2, rowSpan: 2, style: 'tableHeader' }, {},
      { text: 'Real Eff. %', colSpan: 2, rowSpan: 2, style: 'tableHeader' }, {},
      { text: 'Speed', colSpan: 2, rowSpan: 2, style: 'tableHeader' }, {},
      { text: 'Run Time', colSpan: 2, rowSpan: 2, style: 'tableHeader' }, {},
      { text: 'Beam Left', colSpan: 2, rowSpan: 2, style: 'tableHeader' }, {},
    ];
    if (showBeamCompletionDate) {
      headerRow1.push({ text: 'Beam Completion Date', rowSpan: 3, style: 'tableHeader' });
    }
    stopColumns.forEach(column => {
      headerRow1.push({ text: column.label, colSpan: 4, style: 'tableHeader' }, {}, {}, {});
    });
    headerRow1.push({ text: 'Total Stops', colSpan: 4, rowSpan: 2, style: 'tableHeader' }, {}, {}, {});
    body.push(headerRow1);

    // Header row 2 — Count / Duration under stop columns
    const headerRow2: any[] = [{}, {}, {}, {}];
    metricPairs.forEach(() => headerRow2.push({}, {}));
    if (showBeamCompletionDate) headerRow2.push({});
    stopColumns.forEach(() => {
      headerRow2.push({ text: 'Count', colSpan: 2, style: 'tableSubHeader' }, {});
      headerRow2.push({ text: 'Duration', colSpan: 2, style: 'tableSubHeader' }, {});
    });
    headerRow2.push({}, {}, {}, {});
    body.push(headerRow2);

    // Header row 3 — Shift | Total under each metric / stop pair
    const headerRow3: any[] = [{}, {}, {}, {}];
    const shiftTotalHeaders = (totalLabel: string) => ([
      { text: 'Shift', style: 'tableSubHeader' },
      { text: totalLabel, style: 'tableSubHeader' },
    ]);
    metricPairs.forEach(pair => {
      headerRow3.push(...shiftTotalHeaders(pair.avgLabel ? 'Avg' : 'Total'));
    });
    if (showBeamCompletionDate) headerRow3.push({});
    stopColumns.forEach(() => {
      headerRow3.push(...shiftTotalHeaders('Total'));
      headerRow3.push(...shiftTotalHeaders('Total'));
    });
    headerRow3.push(...shiftTotalHeaders('Total'));
    headerRow3.push(...shiftTotalHeaders('Total'));
    body.push(headerRow3);

    const val = (value: any, digits?: number) => {
      if (value == null || value === '') return '-';
      if (digits != null && Number.isFinite(Number(value))) return this.num(value, digits);
      return value;
    };

    for (const item of reportData.list || []) {
      const dayStyle = 'contentCell';
      const boldStyle = { style: dayStyle, bold: true };
      const nightStyle = 'contentCellBg';
      const machines = item.list || [];

      machines.forEach((data: any, machineIndex: number) => {
        const day = data.day || {};
        const total = data.total || {};
        const dateCell = machineIndex === 0 ? [{ text: this.formatDate(item.reportDate), rowSpan: machines.length * 2, style: dayStyle }] : [{}];

        const dayRow: any[] = [
          ...dateCell,
          { text: data.machineCode || '-', rowSpan: 2, style: dayStyle },
          { text: data.qualityLabel || '-', rowSpan: 2, style: dayStyle },
          { text: 'Day', style: dayStyle },

          { text: val(day.pieceLengthM, 2), style: dayStyle },
          { text: val(total.pieceLengthM, 2), rowSpan: 2, ...boldStyle },

          { text: val(day.picksCurrentShift), style: dayStyle },
          { text: val(total.picksCurrentShift), rowSpan: 2, ...boldStyle },

          { text: val(day.efficiencyPercent, 1), style: dayStyle },
          { text: val(total.efficiencyPercent, 1), rowSpan: 2, ...boldStyle },

          { text: val(day.realEfficiencyPercent, 1), style: dayStyle },
          { text: val(total.realEfficiencyPercent, 1), rowSpan: 2, ...boldStyle },

          { text: val(day.speedRpm), style: dayStyle },
          { text: val(total.speedRpm), rowSpan: 2, ...boldStyle },

          { text: val(day.runTime), style: dayStyle },
          { text: val(total.runTime), rowSpan: 2, ...boldStyle },

          { text: val(day.beamLeft), style: dayStyle },
          { text: val(total.beamLeft), rowSpan: 2, ...boldStyle },
        ];

        const night = data.night || {};
        if (showBeamCompletionDate) {
          const beamDate = night.beamCompletionDate || day.beamCompletionDate || total.beamCompletionDate;
          dayRow.push({
            text: beamDate ? this.formatDate(beamDate) : '-',
            rowSpan: 2,
            style: dayStyle
          });
        }

        stopColumns.forEach(column => {
          dayRow.push(
            { text: val(day.stopsData?.[column.key]?.count, 0), style: dayStyle },
            { text: val(total.stopsData?.[column.key]?.count, 0), rowSpan: 2, ...boldStyle },
            { text: val(day.stopsData?.[column.key]?.duration), style: dayStyle },
            { text: val(total.stopsData?.[column.key]?.duration), rowSpan: 2, ...boldStyle },
          );
        });

        dayRow.push(
          { text: val(day.stopsData?.total?.count, 0), ...boldStyle },
          { text: val(total.stopsData?.total?.count, 0), rowSpan: 2, ...boldStyle },
          { text: val(day.stopsData?.total?.duration), ...boldStyle },
          { text: val(total.stopsData?.total?.duration), rowSpan: 2, ...boldStyle },
        );
        body.push(dayRow);

        const nightRow: any[] = [
          {},
          {},
          {},
          { text: 'Night', style: nightStyle },
          { text: val(night.pieceLengthM, 2), style: nightStyle },
          {},
          { text: val(night.picksCurrentShift), style: nightStyle },
          {},
          { text: val(night.efficiencyPercent, 1), style: nightStyle },
          {},
          { text: val(night.realEfficiencyPercent, 1), style: nightStyle },
          {},
          { text: val(night.speedRpm), style: nightStyle },
          {},
          { text: val(night.runTime), style: nightStyle },
          {},
          { text: val(night.beamLeft), style: nightStyle },
          {},
        ];
        if (showBeamCompletionDate) nightRow.push({});

        stopColumns.forEach(column => {
          nightRow.push(
            { text: val(night.stopsData?.[column.key]?.count, 0), style: nightStyle },
            {},
            { text: val(night.stopsData?.[column.key]?.duration), style: nightStyle },
            {},
          );
        });

        nightRow.push(
          { text: val(night.stopsData?.total?.count, 0), ...boldStyle },
          {},
          { text: val(night.stopsData?.total?.duration), ...boldStyle },
          {},
        );
        body.push(nightRow);
      });

      const subTtlCellStyle = 'subTotalCellBg';
      body.push([
        { text: '', style: subTtlCellStyle },
        ...this.colSpanCells(`${this.formatDate(item.reportDate)} - Full Day`, 3, { style: subTtlCellStyle }),
        ...this.colSpanCells(String(this.formatNum(item.prodMeter)), 2, { style: subTtlCellStyle }),
        ...this.colSpanCells(String(item.totalPicks ?? '-'), 2, { style: subTtlCellStyle }),
        ...this.colSpanCells(this.num(item.efficiency, 1), 2, { style: subTtlCellStyle }),
        ...this.colSpanCells(this.num(item.realEfficiency, 1), 2, { style: subTtlCellStyle }),
        ...this.colSpanCells(String(this.formatNum(item.avgSpeed)), 2, { style: subTtlCellStyle }),
        ...this.colSpanCells(`Avg: ${item.avgPicks ?? '-'}`, avgColspan, { style: subTtlCellStyle }, { alignment: 'left' }),
        ...this.colSpanCells(' ', stopSectionColspan, { style: subTtlCellStyle }),
      ]);
    }

    body.push([
      { text: ' ', colSpan: tableColspan },
      ...Array(tableColspan - 1).fill({})
    ]);

    body.push([
      ...this.colSpanCells('Total', 4, this.grandTotalFill, { alignment: 'center' }),
      ...this.colSpanCells(String(this.formatNum(reportData.avgProdMeter)), 2, this.grandTotalFill),
      ...this.colSpanCells(String(reportData.totalPicks ?? '-'), 2, this.grandTotalFill),
      ...this.colSpanCells(String(reportData.totalEfficiency ?? '-'), 2, this.grandTotalFill),
      ...this.colSpanCells(String(reportData.totalRealEfficiency ?? '-'), 2, this.grandTotalFill),
      ...this.colSpanCells(String(reportData.avgSpeed ?? '-'), 2, this.grandTotalFill),
      ...this.colSpanCells(`Total Avg: ${reportData.avgPicks ?? '-'}`, avgColspan, this.grandTotalFill, { alignment: 'left' }),
      ...this.colSpanCells(' ', stopSectionColspan, this.grandTotalFill),
    ]);

    return body;
  }

  protected buildQualityWiseTableBody(section: any, stopColumns: { key: string; label: string }[], tableColspan: number) {
    const body: any[] = [];
    const showBeamCompletionDate = !!section.showBeamCompletionDateColumn || this.hasBeamCompletionDate(section);
    const stopSectionColspan = stopColumns.length * 2 + 2;
    const fixedColCount = showBeamCompletionDate ? 11 : 10;
    const avgColspan = showBeamCompletionDate ? 3 : 2;

    const headerRow1: any[] = [
      { text: 'Date', rowSpan: 2, style: 'tableHeader' },
      { text: 'Shift', rowSpan: 2, style: 'tableHeader' },
      { text: 'Machine', rowSpan: 2, style: 'tableHeader' },
      { text: 'Prod. [Mtrs]', rowSpan: 2, style: 'tableHeader' },
      { text: 'Picks', rowSpan: 2, style: 'tableHeader' },
      { text: 'Eff. %', rowSpan: 2, style: 'tableHeader' },
      { text: 'Real Eff.%', rowSpan: 2, style: 'tableHeader' },
      { text: 'Speed', rowSpan: 2, style: 'tableHeader' },
      { text: 'Run Time', rowSpan: 2, style: 'tableHeader' },
      { text: 'Beam Left', rowSpan: 2, style: 'tableHeader' },
    ];
    if (showBeamCompletionDate) {
      headerRow1.push({ text: 'Beam Completion Date', rowSpan: 2, style: 'tableHeader' });
    }
    stopColumns.forEach(column => {
      headerRow1.push({ text: column.label, colSpan: 2, style: 'tableHeader' }, {});
    });
    headerRow1.push({ text: 'Total Stops', colSpan: 2, rowSpan: 2, style: 'tableHeader' }, {});
    body.push(headerRow1);

    const headerRow2: any[] = Array(fixedColCount).fill({});
    stopColumns.forEach(() => {
      headerRow2.push({ text: 'Count', style: 'tableSubHeader' });
      headerRow2.push({ text: 'Duration', style: 'tableSubHeader' });
    });
    headerRow2.push({}, {});
    body.push(headerRow2);

    for (const item of section.list || []) {
      let shiftIndex = 0;
      const isNight = this.isNightShiftGroup(item);
      const cellStyle = this.contentCellStyle(isNight);
      for (const data of item.list || []) {
        let cells = [{}, {}];
        if (shiftIndex === 0) {
          cells = [
            { text: this.formatDate(item.reportDate), rowSpan: item.list.length, style: cellStyle },
            { text: item.shiftLabel, rowSpan: item.list.length, style: cellStyle },
          ];
        }
        const row: any[] = [
          ...cells,
          { text: data.machineCode, style: cellStyle },
          { text: data.pieceLengthM, style: cellStyle },
          { text: data.picksCurrentShift, style: cellStyle },
          { text: data.efficiencyPercent, style: cellStyle },
          { text: data.realEfficiencyPercent ?? '-', style: cellStyle },
          { text: data.speedRpm ?? '0', style: cellStyle },
          { text: data.runTime || '-', style: cellStyle },
          { text: data.beamLeft, style: cellStyle },
        ];
        if (showBeamCompletionDate) {
          row.push({
            text: data.beamCompletionDate ? this.formatDate(data.beamCompletionDate) : '-',
            style: cellStyle
          });
        }
        stopColumns.forEach(column => {
          row.push({ text: this.getStopValue(data, column.key, 'count'), style: cellStyle });
          row.push({ text: this.getStopValue(data, column.key, 'duration'), style: cellStyle });
        });
        row.push(
          { text: data.stopsData?.total?.count ?? '-', style: cellStyle, bold: true },
          { text: data.stopsData?.total?.duration ?? '-', style: cellStyle, bold: true }
        );
        body.push(row);
        shiftIndex++;
      }

      const subTtlCellStyle = this.subTotalCellStyle(isNight);
      body.push([
        { text: '', style: subTtlCellStyle },
        { text: `${this.formatDate(item.reportDate)} - ${item.shiftLabel}`, colSpan: 2, style: subTtlCellStyle }, {},
        { text: this.formatNum(item.prodMeter), style: subTtlCellStyle },
        { text: item.totalPicks, style: subTtlCellStyle },
        { text: this.num(item.efficiency, 1), style: subTtlCellStyle },
        { text: this.num(item.realEfficiency, 1), style: subTtlCellStyle },
        { text: this.formatNum(item.avgSpeed), style: subTtlCellStyle },
        { text: `Avg: ${item.avgPicks}`, colSpan: avgColspan, alignment: 'left', style: subTtlCellStyle }, ...Array(avgColspan - 1).fill({}),
        { text: '', colSpan: stopSectionColspan, style: subTtlCellStyle }, ...Array(stopSectionColspan - 1).fill({})
      ]);
      if (item?.fullDay) {
        body.push([
          { text: '', style: subTtlCellStyle },
          { text: `${this.formatDate(item.fullDay.reportDate)} - ${item.fullDay.shiftLabel}`, colSpan: 2, style: subTtlCellStyle }, {},
          { text: this.formatNum(item.fullDay.prodMeter), style: subTtlCellStyle },
          { text: item.fullDay.totalPicks, style: subTtlCellStyle },
          { text: this.num(item.fullDay.efficiency, 1), style: subTtlCellStyle },
          { text: this.num(item.fullDay.realEfficiency, 1), style: subTtlCellStyle },
          { text: this.formatNum(item.fullDay.avgSpeed), style: subTtlCellStyle },
          { text: `Avg: ${item.fullDay.avgPicks}`, colSpan: avgColspan, alignment: 'left', style: subTtlCellStyle }, ...Array(avgColspan - 1).fill({}),
          { text: '', colSpan: stopSectionColspan, style: subTtlCellStyle }, ...Array(stopSectionColspan - 1).fill({})
        ]);
      }
    }

    body.push([
      { text: ' ', colSpan: tableColspan },
      ...Array(tableColspan - 1).fill({})
    ]);

    body.push([
      ...this.colSpanCells('Total', 3, this.grandTotalFill, { alignment: 'center' }),
      { text: this.formatNum(section.avgProdMeter), ...this.grandTotalFill },
      { text: section.totalPicks, ...this.grandTotalFill },
      { text: section.totalEfficiency, ...this.grandTotalFill },
      { text: section.totalRealEfficiency, ...this.grandTotalFill },
      { text: section.avgSpeed, ...this.grandTotalFill },
      ...this.colSpanCells(`Total Avg: ${section.avgPicks}`, avgColspan, this.grandTotalFill, { alignment: 'left' }),
      ...this.colSpanCells(' ', stopSectionColspan, this.grandTotalFill)
    ]);

    return body;
  }

  protected buildStoppageTableBody(reportData: any) {
    const body: any[] = [[
      { text: 'Date', style: 'tableHeader' },
      { text: 'Shift', style: 'tableHeader' },
      { text: 'Machine', style: 'tableHeader' },
      { text: 'Stop Reason', style: 'tableHeader' },
      { text: 'From', style: 'tableHeader' },
      { text: 'To', style: 'tableHeader' },
      { text: 'Stop Time', style: 'tableHeader' }
    ]];

    const rows = reportData.stoppageTableRows || reportData.list || [];
    rows.forEach((row: any) => {
      const cellStyle = row.groupEven ? 'contentCell' : 'contentCellBg';
      const tableRow: any[] = [];
      const hasMergeMeta = row.showDate !== undefined;

      if (hasMergeMeta) {
        if (row.showDate) {
          tableRow.push({ text: this.formatDate(row.reportDate), rowSpan: row.dateRowspan, style: cellStyle });
        } else {
          tableRow.push({});
        }

        if (row.showShift) {
          tableRow.push({ text: row.shiftLabel || '-', rowSpan: row.shiftRowspan, style: cellStyle });
        } else {
          tableRow.push({});
        }

        if (row.showMachine) {
          tableRow.push({ text: row.machineCode || '-', rowSpan: row.machineRowspan, style: cellStyle });
        } else {
          tableRow.push({});
        }
      } else {
        tableRow.push(
          { text: this.formatDate(row.reportDate), style: cellStyle },
          { text: row.shiftLabel || '-', style: cellStyle },
          { text: row.machineCode || '-', style: cellStyle }
        );
      }

      tableRow.push(
        { text: row.stopReason || '-', style: cellStyle },
        { text: this.formatDateTime(row.from), style: cellStyle },
        { text: this.formatDateTime(row.to), style: cellStyle },
        { text: row.stopTime || '-', style: cellStyle }
      );
      body.push(tableRow);
    });

    if (rows.length) {
      body.push([
        ...this.colSpanCells('Total Stops', 6, this.grandTotalFill, { alignment: 'right' }),
        { text: reportData.totalStops ?? 0, ...this.grandTotalFill }
      ]);
    }

    return body;
  }

  protected buildBeamLeftTableBody(reportData: any) {
    const body: any[] = [[
      { text: 'Machine Name', style: 'tableHeader' },
      { text: 'Start Date', style: 'tableHeader' },
      { text: 'Shift', style: 'tableHeader' },
      { text: 'End Date', style: 'tableHeader' },
      { text: 'Quality', style: 'tableHeader' },
      { text: 'Beam Length', style: 'tableHeader' },
      { text: 'Production Mtr', style: 'tableHeader' }
    ]];

    const rows = reportData.list || [];
    rows.forEach((row: any, index: number) => {
      const cellStyle = index % 2 === 0 ? 'contentCell' : 'contentCellBg';
      body.push([
        { text: row.machineName || '-', style: cellStyle },
        { text: this.formatDate(row.startDate), style: cellStyle },
        { text: row.shift || '-', style: cellStyle },
        { text: row.endDate ? this.formatDate(row.endDate) : '-', style: cellStyle },
        { text: formatQualityReed(row.quality, row.reed), style: cellStyle },
        { text: row.beamLength != null ? row.beamLength : '-', style: cellStyle },
        { text: row.productionMtr != null ? row.productionMtr : '-', style: cellStyle }
      ]);
    });

    if (rows.length) {
      body.push([
        ...this.colSpanCells('Total Production Mtr', 6, this.grandTotalFill, { alignment: 'right' }),
        { text: this.num(reportData.totalProductionMtr), ...this.grandTotalFill }
      ]);
    }

    return body;
  }

  protected buildBeamCompletionDateTableBody(reportData: any) {
    const body: any[] = [[
      { text: 'Machine', style: 'tableHeader' },
      { text: 'Quality', style: 'tableHeader' },
      { text: 'Beam Left (Mtrs)', style: 'tableHeader' },
      { text: 'Completion Date', style: 'tableHeader' },
      { text: 'Days Remaining', style: 'tableHeader' }
    ]];

    const rows = reportData.list || [];
    rows.forEach((row: any, index: number) => {
      const cellStyle = index % 2 === 0 ? 'contentCell' : 'contentCellBg';
      body.push([
        { text: row.machineCode || row.machineName || '-', style: cellStyle },
        { text: formatQualityReed(row.quality, row.reed), style: cellStyle },
        { text: this.num(row.beamLeft), style: cellStyle },
        { text: row.beamCompletionDate ? this.formatDate(row.beamCompletionDate) : '-', style: cellStyle },
        { text: row.estimatedDaysRemaining ?? '-', style: cellStyle }
      ]);
    });

    return body;
  }

  protected formatDateTime(dateStr: string): string {
    if (!dateStr) return '-';
    return moment(dateStr).format('DD-MMM-YYYY hh:mm:ss A');
  }

  protected num(value: any, toFixed: number = 2): string {
    return value != null ? Number(value).toFixed(toFixed) : '-';
  }
  protected formatDate(dateStr: string): string {
    if (!dateStr) return '-';
    return moment(dateStr).format('DD MMM YYYY');
  }
  private formatNum(value: any, toFixed: number = 2): number | string {
    if (typeof value !== 'number' || isNaN(value)) return '-';
    return Number(value.toFixed(toFixed));
  }
}