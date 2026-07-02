import { Injectable } from '@angular/core';

import moment from 'moment';

import * as XLSX from 'xlsx';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
(pdfMake as any).vfs = pdfFonts['vfs'];
import { saveAs } from 'file-saver';
import { getStopColumnsForTypes, hasStopKey, MachineType } from '@src/app/models/machine.model';


@Injectable({
  providedIn: 'root'
})
export class ExportData {
  /**
   * EXPORT TO EXCEL (.xlsx) (using SheetJS)
   */
  exportTableToExcel(tableElement: HTMLTableElement, filename: string = 'shift-report.xlsx'): void {
    const ws: XLSX.WorkSheet = XLSX.utils.table_to_sheet(tableElement, {
      raw: true
    });
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([wbout], { type: 'application/octet-stream' }), filename);
  }

  /**
   * EXPORT TO PDF (using pdfMake)
   */
  exportTableToPDF(reportData: any): void {
    const title = reportData.reportTitle || 'Shift Report';
    const stopColumns = reportData.stopColumns || this.resolveStopColumns(reportData.list || []);
    const tableColspan = 8 + stopColumns.length * 2 + 2;
    const docDefinition: any = {
      pageOrientation: 'landscape',
      pageSize: 'A4',
      pageMargins: [16, 16, 16, 16],
      content: [
        { text: title, style: 'header' },
        {
          text: `Report Period: ${this.formatDate(reportData.fromDate)} to ${this.formatDate(reportData.toDate)}`,
          style: 'subHeader'
        },
        {
          table: {
            headerRows: 2,
            widths: Array(tableColspan).fill('auto'),
            body: this.buildTableBody(reportData, stopColumns, tableColspan)
          },
          // layout: 'lightHorizontalLines',
          width: 'auto',
          layout: {
            hLineWidth: () => 0.5,// horizontal line width
            vLineWidth: () => 0.5,// vertical line width
            hLineColor: '#bfbfbf',
            vLineColor: '#bfbfbf',
          }
        }
      ],
      styles: {
        header: { bold: true, alignment: 'center', margin: [0, 0, 0, 5], fontSize: 18 },
        subHeader: { alignment: 'center', margin: [0, 0, 0, 10] },
        tableHeader: { bold: true, fillColor: '#343a40', color: 'white', alignment: 'center' },
        tableSubHeader: { bold: true, fillColor: '#495057', color: 'white', alignment: 'center' },
        cellCenter: { alignment: 'center' },
        contentCell: { alignment: 'center', fontSize: 8 },
        contentCellBg: { alignment: 'center', fontSize: 8, fillColor: '#ededed' },
        subTotalCell: { bold: true, fontSize: 8, alignment: 'center' },
        subTotalCellBg: { bold: true, fontSize: 8, alignment: 'center', fillColor: '#ededed' },
        cellBold: { bold: true },
        grandTotalCell: { bold: true, fillColor: '#495057', color: 'white', }
      },
      defaultStyle: {
        fontSize: 10
      }
    };

    pdfMake.createPdf(docDefinition).open();
  }

  // helper methods for PDF export
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

  protected buildTableBody(reportData: any, stopColumns: { key: string; label: string }[], tableColspan: number) {
    const body: any[] = [];
    const stopSectionColspan = stopColumns.length * 2 + 2;

    const headerRow1: any[] = [
      { text: 'Date', rowSpan: 2, style: 'tableHeader' },
      { text: 'Shift', rowSpan: 2, style: 'tableHeader' },
      { text: 'Machine', rowSpan: 2, style: 'tableHeader' },
      { text: 'Prod. [Mtrs]', rowSpan: 2, style: 'tableHeader' },
      { text: 'Picks', rowSpan: 2, style: 'tableHeader' },
      { text: 'Eff. %', rowSpan: 2, style: 'tableHeader' },
      { text: 'Run Time', rowSpan: 2, style: 'tableHeader' },
      { text: 'Beam Left', rowSpan: 2, style: 'tableHeader' },
    ];
    stopColumns.forEach(column => {
      headerRow1.push({ text: column.label, colSpan: 2, style: 'tableHeader' }, {});
    });
    headerRow1.push({ text: 'Total Stops', colSpan: 2, rowSpan: 2, style: 'tableHeader' }, {});
    body.push(headerRow1);

    const headerRow2: any[] = Array(8).fill({});
    stopColumns.forEach(() => {
      headerRow2.push({ text: 'Count', style: 'tableSubHeader' });
      headerRow2.push({ text: 'Duration', style: 'tableSubHeader' });
    });
    headerRow2.push({}, {});
    body.push(headerRow2);

    // ---- Data Rows ----
    let groupIndex = 0;
    for (const item of reportData.list || []) {
      let shiftIndex = 0;
      const cellStyle = groupIndex % 2 === 0 ? 'contentCell' : 'contentCellBg';
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
          { text: data.runTime || '-', style: cellStyle },
          { text: data.beamLeft, style: cellStyle },
        ];
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

      const subTtlCellStyle = groupIndex % 2 === 0 ? 'subTotalCell' : 'subTotalCellBg';
      body.push([
        { text: this.formatDate(item.reportDate), colSpan: 2, style: subTtlCellStyle }, {},
        { text: item.shiftLabel, style: subTtlCellStyle },
        { text: this.num(item.prodMeter), style: subTtlCellStyle },
        { text: item.totalPicks, style: subTtlCellStyle },
        { text: this.num(item.efficiency, 1), style: subTtlCellStyle },
        { text: `Avg: ${item.avgPicks}`, colSpan: 2, alignment: 'left', style: subTtlCellStyle }, {},
        { text: '', colSpan: stopSectionColspan, style: subTtlCellStyle }, ...Array(stopSectionColspan - 1).fill({})
      ]);
      groupIndex++;
    }

    body.push([
      { text: ' ', colSpan: tableColspan },
      ...Array(tableColspan - 1).fill({})
    ]);

    body.push([
      { text: 'Total', colSpan: 3, alignment: 'center', style: 'grandTotalCell' }, {}, {},
      { text: reportData.avgProdMeter, style: 'grandTotalCell' },
      { text: reportData.totalPicks, style: 'grandTotalCell' },
      { text: reportData.totalEfficiency, style: 'grandTotalCell' },
      { text: `Total Avg: ${reportData.avgPicks}`, colSpan: 2, alignment: 'left', style: 'grandTotalCell' }, {},
      { text: '', colSpan: stopSectionColspan, style: 'grandTotalCell' }, ...Array(stopSectionColspan - 1).fill({})
    ]);

    return body;
  }
  protected num(value: any, toFixed: number = 2): string {
    return value != null ? Number(value).toFixed(toFixed) : '-';
  }
  protected formatDate(dateStr: string): string {
    if (!dateStr) return '-';
    return moment(dateStr).format('DD MMM YYYY');
  }
}