import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import { parseExcelWorkbook } from '../lib/excel-parser';

describe('Excel Parser', () => {
    it('should split tables by empty rows in a single sheet', () => {
        // Create a mock workbook with one sheet and two tables separated by an empty row
        const data = [
            ['Name', 'Age'],
            ['Alice', 25],
            [], // Empty row
            ['Product', 'Price'],
            ['Apple', 1.5]
        ];
        
        const worksheet = XLSX.utils.aoa_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
        const buffer = XLSX.write(workbook, { type: 'buffer' });
        
        const result = parseExcelWorkbook(buffer);
        
        expect(result.length).toBe(1);
        expect(result[0].tables.length).toBe(2);
        
        expect(result[0].tables[0].columns[0].name).toBe('Name');
        expect(result[0].tables[0].rows[0]['Name']).toBe('Alice');
        
        expect(result[0].tables[1].columns[0].name).toBe('Product');
        expect(result[0].tables[1].rows[0]['Product']).toBe('Apple');
    });

    it('should handle multiple sheets', () => {
         const workbook = XLSX.utils.book_new();
         XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([['A'], [1]]), 'Sheet1');
         XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([['B'], [2]]), 'Sheet2');
         const buffer = XLSX.write(workbook, { type: 'buffer' });

         const result = parseExcelWorkbook(buffer);
         expect(result.length).toBe(2);
         expect(result[0].sheetName).toBe('Sheet1');
         expect(result[1].sheetName).toBe('Sheet2');
    });
});
