import { Injectable } from '@angular/core';

import moment from 'moment';

import * as XLSX from 'xlsx';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
(pdfMake as any).vfs = pdfFonts.vfs;
import { saveAs } from 'file-saver';


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
            widths: [
              ...Array(20).fill('auto'), // 20 columns
              // 50, 40, 50, 50, 40, 40, 50, 40, // first 8 cols
              // 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, // next 9 cols
              // 40, 40 // total stops cols
            ],
            body: this.buildTableBody(reportData)
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
  protected buildTableBody(reportData: any) {
    const body: any[] = [];

    // ---- Header Row 1 ----
    body.push([
      { text: 'Date', rowSpan: 2, style: 'tableHeader' },
      { text: 'Shift', rowSpan: 2, style: 'tableHeader' },
      { text: 'Machine', rowSpan: 2, style: 'tableHeader' },
      { text: 'Prod. [Mtrs]', rowSpan: 2, style: 'tableHeader' },
      { text: 'Picks', rowSpan: 2, style: 'tableHeader' },
      { text: 'Eff. %', rowSpan: 2, style: 'tableHeader' },
      { text: 'Run Time', rowSpan: 2, style: 'tableHeader' },
      { text: 'Beam Left', rowSpan: 2, style: 'tableHeader' },

      { text: 'Warp', colSpan: 2, style: 'tableHeader' }, {},
      { text: 'Weft', colSpan: 2, style: 'tableHeader' }, {},
      { text: 'Feeder', colSpan: 2, style: 'tableHeader' }, {},
      { text: 'Manual', colSpan: 2, style: 'tableHeader' }, {},
      { text: 'Other', colSpan: 2, style: 'tableHeader' }, {},
      { text: 'Total Stops', colSpan: 2, rowSpan: 2, style: 'tableHeader' }, {}
    ]);

    // ---- Header Row 2 ----
    body.push([
      {}, {}, {}, {}, {}, {}, {}, {},
      { text: 'Count', style: 'tableSubHeader' },
      { text: 'Duration', style: 'tableSubHeader' },
      { text: 'Count', style: 'tableSubHeader' },
      { text: 'Duration', style: 'tableSubHeader' },
      { text: 'Count', style: 'tableSubHeader' },
      { text: 'Duration', style: 'tableSubHeader' },
      { text: 'Count', style: 'tableSubHeader' },
      { text: 'Duration', style: 'tableSubHeader' },
      { text: 'Count', style: 'tableSubHeader' },
      { text: 'Duration', style: 'tableSubHeader' },
      {}, {}
    ]);

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
        body.push([
          ...cells,
          { text: data.machineCode, style: cellStyle },
          { text: data.pieceLengthM, style: cellStyle },
          { text: data.picksCurrentShift, style: cellStyle },
          { text: data.efficiencyPercent, style: cellStyle },
          { text: data.runTime || '-', style: cellStyle },
          { text: data.beamLeft, style: cellStyle },

          { text: data.stopsData?.warp?.count ?? '-', style: cellStyle },
          { text: data.stopsData?.warp?.duration ?? '-', style: cellStyle },
          { text: data.stopsData?.weft?.count ?? '-', style: cellStyle },
          { text: data.stopsData?.weft?.duration ?? '-', style: cellStyle },
          { text: data.stopsData?.feeder?.count ?? '-', style: cellStyle },
          { text: data.stopsData?.feeder?.duration ?? '-', style: cellStyle },
          { text: data.stopsData?.manual?.count ?? '-', style: cellStyle },
          { text: data.stopsData?.manual?.duration ?? '-', style: cellStyle },
          { text: data.stopsData?.other?.count ?? '-', style: cellStyle },
          { text: data.stopsData?.other?.duration ?? '-', style: cellStyle },
          { text: data.stopsData?.total?.count ?? '-', style: cellStyle, bold: true },
          { text: data.stopsData?.total?.duration ?? '-', style: cellStyle, bold: true }
        ]);
        shiftIndex++;
      }

      // ---- Shift summary row ----
      const subTtlCellStyle = groupIndex % 2 === 0 ? 'subTotalCell' : 'subTotalCellBg';
      body.push([
        // { text: '', style: subTtlCellStyle },
        // { text: `${this.formatDate(item.reportDate)} - ${item.shiftLabel}`, colSpan: 2, style: subTtlCellStyle }, {},
        { text: this.formatDate(item.reportDate), colSpan: 2, style: subTtlCellStyle }, {},
        { text: item.shiftLabel, style: subTtlCellStyle },
        { text: this.num(item.prodMeter), style: subTtlCellStyle },
        { text: item.totalPicks, style: subTtlCellStyle },
        { text: this.num(item.efficiency, 1), style: subTtlCellStyle },
        { text: `Avg: ${item.avgPicks}`, colSpan: 2, alignment: 'left', style: subTtlCellStyle }, {},
        { text: '', colSpan: 12, style: subTtlCellStyle }, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}
      ]);
      groupIndex++;
    }

    // ---- Empty row ----
    body.push([
      { text: ' ', colSpan: 20 },
      {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}
    ]);

    // ---- Grand total row ----
    body.push([
      { text: 'Total', colSpan: 3, alignment: 'center', style: 'grandTotalCell' }, {}, {},
      { text: reportData.avgProdMeter, style: 'grandTotalCell' },
      { text: reportData.totalPicks, style: 'grandTotalCell' },
      { text: reportData.totalEfficiency, style: 'grandTotalCell' },
      { text: `Total Avg: ${reportData.avgPicks}`, colSpan: 2, alignment: 'left', style: 'grandTotalCell' }, {},
      { text: '', colSpan: 12, style: 'grandTotalCell' }, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}
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