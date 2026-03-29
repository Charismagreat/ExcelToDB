'use client';

import React, { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { toPng } from 'html-to-image';
import { ColumnDefinition, TableData } from '@/lib/excel-parser';
import { RecommendationTable } from '@/lib/ai-vision';
import { uploadExcelAction, analyzeExcelScreenshotAction } from '@/app/actions';
import { isSubtotalRow } from '@/lib/data-utils';
import { Upload, Check, AlertCircle, FileText, ChevronRight, Save, Camera, Sparkles, Image as ImageIcon, Loader2, RotateCcw, Info, GripVertical, Trash2, Edit3 } from 'lucide-react';

interface SelectedField {
    id: string;      // 원본 엑셀 컬럼명
    name: string;    // 사용자 커스텀 컬럼명
    isActive: boolean;
    isRequired: boolean;
    type: string;    // 데이터 타입 (string, number 등)
}

interface ExtendedTableData extends TableData {
    originalSheetName: string;
    rawRows: any[][];
    headerRowIndex: number;
}

export default function UploadWorkflow({ userId }: { userId: string }) {
  const [step, setStep] = useState<'upload' | 'analyzing' | 'select' | 'processing'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [previewTables, setPreviewTables] = useState<ExtendedTableData[]>([]);
  const [selectedFields, setSelectedFields] = useState<Record<string, SelectedField[]>>({}); // tableName -> array of field objects
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recommendations, setRecommendations] = useState<RecommendationTable[]>([]);
  const [excelHtml, setExcelHtml] = useState<string>('');
  
  // Drag and Drop state
  const [dragInfo, setDragInfo] = useState<{ tableName: string; index: number } | null>(null);

  const previewRef = useRef<HTMLDivElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setStep('analyzing');
    setIsAnalyzing(true);
    setFile(selectedFile);

    try {
        const buffer = await selectedFile.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        
        const tables: ExtendedTableData[] = [];
        let combinedHtml = `
            <style>
                .preview-container { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
                .sheet-section { padding: 40px; border-bottom: 2px solid #ccc; background: white; }
                .sheet-title { font-size: 24px; font-weight: bold; margin-bottom: 20px; color: #333; border-left: 8px solid #2563eb; padding-left: 15px; }
                table { border-collapse: collapse; width: 100%; border: 1px solid #ddd; }
                th, td { border: 1px solid #ddd; padding: 12px 15px; text-align: left; }
                th { background-color: #f8fafc; font-weight: bold; color: #1e293b; }
                tr:nth-child(even) { background-color: #f1f5f9; }
            </style>
            <div class="preview-container">
        `;
        
        workbook.SheetNames.forEach(sheetName => {
            const sheet = workbook.Sheets[sheetName];
            const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
            
            const limitedSheet = { ...sheet };
            const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1:Z50');
            range.e.r = Math.min(range.e.r, 50); 
            limitedSheet['!ref'] = XLSX.utils.encode_range(range);
            
            const html = XLSX.utils.sheet_to_html(limitedSheet, { header: '', footer: '' });
            combinedHtml += `
                <div class="sheet-section">
                    <div class="sheet-title">Sheet: ${sheetName}</div>
                    ${html}
                </div>
            `;

            if (rawRows.length > 0) {
                let maxCols = 0;
                let headerRowIndex = 0;
                for (let i = 0; i < Math.min(rawRows.length, 10); i++) {
                    // 집계 행은 헤더로 간주하지 않음
                    if (isSubtotalRow(rawRows[i])) continue;
                    
                    const cols = rawRows[i].filter(c => c !== null && c !== undefined && c !== '').length;
                    if (cols > maxCols) {
                        maxCols = cols;
                        headerRowIndex = i;
                    }
                }

                const header = (rawRows[headerRowIndex] as any[]).map(h => h?.toString().trim() || '').filter(h => !!h);
                tables.push({
                    name: sheetName,
                    originalSheetName: sheetName,
                    columns: header.map(h => ({ name: h, type: 'string' })),
                    rows: [],
                    rawRows,
                    headerRowIndex
                });
            }
        });

        combinedHtml += '</div>';

        setPreviewTables(tables);
        setExcelHtml(combinedHtml);

        setTimeout(async () => {
            if (previewRef.current) {
                try {
                    const dataUrl = await toPng(previewRef.current, {
                        backgroundColor: '#ffffff',
                        width: 1200,
                        cacheBust: true,
                        quality: 0.95,
                        style: { opacity: '1', visibility: 'visible' }
                    });

                    if (dataUrl.length < 5000) throw new Error('렌더링 실패');

                    const response = await fetch(dataUrl);
                    const blob = await response.blob();
                    const generatedImage = new File([blob], 'excel_preview.png', { type: 'image/png' });

                    const formDataForAI = new FormData();
                    formDataForAI.append('image', generatedImage);
                    const result = await analyzeExcelScreenshotAction(formDataForAI);
                    
                    setRecommendations(result.recommendedTables);
                    applyRecommendation(tables, result.recommendedTables);
                    
                    setStep('select');
                } catch (err) {
                    console.error('AI Analysis Error:', err);
                    alert('AI 분석 결과가 명확하지 않습니다. 수동으로 필드를 선택해 주세요.');
                    setStep('select');
                } finally {
                    setIsAnalyzing(false);
                }
            } else {
                setStep('select');
                setIsAnalyzing(false);
            }
        }, 1500);

    } catch (error: any) {
        console.error('File parsing error:', error);
        alert('엑셀 파일을 읽는 중 오류가 발생했습니다.');
        setStep('upload');
        setIsAnalyzing(false);
    }
  };

  const applyRecommendation = (tables: ExtendedTableData[], recs: RecommendationTable[]) => {
    const newSelection: Record<string, SelectedField[]> = {};
    const updatedTables = [...tables];

    tables.forEach((table, idx) => {
        const rec = recs.find(r => r.tableName === table.name || r.tableName.includes(table.name)) || 
                    recs.find(r => table.name.includes(r.tableName));

        // 1. 실제 헤더 찾기 (이전과 동일)
        let bestRowIndex = table.headerRowIndex;
        if (rec) {
            let maxMatches = 0;
            for (let i = 0; i < Math.min(table.rawRows.length, 25); i++) {
                // 집계 행은 헤더로 간주하지 않음
                if (isSubtotalRow(table.rawRows[i])) continue;

                const row = table.rawRows[i].map(c => c?.toString().trim().toLowerCase() || '');
                const matches = rec.columns.filter(aiCol => {
                    const aiLower = aiCol.name.toLowerCase();
                    return row.some(rowCol => rowCol.includes(aiLower) || aiLower.includes(rowCol));
                }).length;

                if (matches > maxMatches) {
                    maxMatches = matches;
                    bestRowIndex = i;
                }
            }
        }

        const newHeaderRow = table.rawRows[bestRowIndex] || [];
        const newHeaderNames = newHeaderRow.map(h => h?.toString().trim() || '').filter(h => !!h);
        
        updatedTables[idx] = {
            ...table,
            headerRowIndex: bestRowIndex,
            columns: newHeaderNames.map(h => ({ name: h, type: 'string' }))
        };

        // 2. 기본 데이터ID 필드 추가
        const fields: SelectedField[] = [
            { id: '__data_id__', name: '데이터ID', isActive: true, isRequired: true, type: 'string' }
        ];

        // 3. 엑셀 컬럼들을 필드 객체로 변환
        newHeaderNames.forEach(h => {
            // AI 추천 목록에서 해당 컬럼과 유사한 필드 찾기
            const colRec = rec?.columns.find(c => 
              h.toLowerCase().includes(c.name.toLowerCase()) || 
              c.name.toLowerCase().includes(h.toLowerCase())
            );

            // 데이터 기반 타입 추론: 실제 데이터 행들(최대 10개)을 검사
            const originalColIdx = newHeaderRow.findIndex(cell => cell?.toString().trim() === h);
            
            let numberCount = 0;
            let dateCount = 0;
            let totalCount = 0;
            const dateRegex = /^\d{2,4}[-./ ]\d{1,2}[-./ ]\d{1,2}/; // yyyy-mm-dd, yy.mm.dd etc
            const dateKeywordRegex = /(일|날짜|Date|Time|Period|시각|일자|만기)/i;
            const currencyKeywordRegex = /(단가|금액|비용|가격|Price|Amount|원|달러|Fee|Cost|수입|지출)/i;

            for (let i = 1; i <= 20; i++) {
                const dataRow = table.rawRows[bestRowIndex + i];
                if (!dataRow) break;
                
                // 집계 행은 타입 추론에서 제외
                if (isSubtotalRow(dataRow)) continue;
                
                const val = dataRow[originalColIdx];
                if (val !== undefined && val !== null && val !== '') {
                    totalCount++;
                    const stringVal = val.toString().trim();
                    
                    // 1. 명시적 날짜 형식 체크
                    if (val instanceof Date || dateRegex.test(stringVal)) {
                        dateCount++;
                    } else if (typeof val === 'number') {
                        // 2. 엑셀 숫자 날짜 체크 (보통 40000~60000 사이 값임 - 2010년~2060년 사이)
                        if (val > 30000 && val < 60000 && dateKeywordRegex.test(h)) {
                            dateCount += 0.8; // 높은 확률로 날짜
                        }
                        numberCount++;
                    } else {
                        // 3. 텍스트 내 숫자 또는 통화 기호 체크
                        const numericVal = stringVal.replace(/[,₩$¥€]/g, '').trim();
                        if (!isNaN(Number(numericVal)) && numericVal !== '') {
                            numberCount++;
                        }
                    }
                }
            }

            // 키워드가 통화/날짜 관련인지 여부
            const isDateKeywordFound = dateKeywordRegex.test(h);
            const isCurrencyKeywordFound = currencyKeywordRegex.test(h);
            const isNumericRatio = totalCount > 0 && (numberCount / totalCount) > 0.8;

            let inferredType = 'string';
            if ((totalCount > 0 && (dateCount / totalCount) > 0.6) || (isDateKeywordFound && dateCount > 0)) {
                inferredType = 'date';
            } else if (isCurrencyKeywordFound && isNumericRatio) {
                inferredType = 'currency';
            } else if (isNumericRatio) {
                inferredType = 'number';
            } else if (colRec) {
                inferredType = colRec.type;
            }

            fields.push({
                id: h,
                name: h,
                isActive: !!colRec || (idx === 0),
                isRequired: colRec ? colRec.isRequired : true,
                type: inferredType
            });
        });

        newSelection[table.name] = fields;
    });

    setPreviewTables(updatedTables);
    setSelectedFields(newSelection);
  };

  const toggleField = (tableName: string, fieldId: string) => {
    // 데이터ID 필드는 해제할 수 없음
    if (fieldId === '__data_id__') return;

    setSelectedFields(prev => {
        const currentFields = [...(prev[tableName] || [])];
        const updated = currentFields.map(f => 
            f.id === fieldId ? { ...f, isActive: !f.isActive } : f
        );
        return { ...prev, [tableName]: updated };
    });
  };

  const toggleRequired = (tableName: string, fieldId: string) => {
    // 데이터ID는 항상 필수
    if (fieldId === '__data_id__') return;

    setSelectedFields(prev => {
        const currentFields = [...(prev[tableName] || [])];
        const updated = currentFields.map(f => 
            f.id === fieldId ? { ...f, isRequired: !f.isRequired } : f
        );
        return { ...prev, [tableName]: updated };
    });
  };

  const updateFieldType = (tableName: string, fieldId: string, type: string) => {
    setSelectedFields(prev => {
        const currentFields = [...(prev[tableName] || [])];
        const updated = currentFields.map(f => 
            f.id === fieldId ? { ...f, type } : f
        );
        return { ...prev, [tableName]: updated };
    });
  };

  const updateTableName = (idx: number, newName: string) => {
    setPreviewTables(prev => {
        const oldName = prev[idx].name;
        const next = [...prev];
        next[idx] = { ...next[idx], name: newName };

        // selectedFields의 키도 함께 업데이트하여 필드 목록 유실 방지
        setSelectedFields(fieldsPrev => {
            if (!fieldsPrev[oldName]) return fieldsPrev;
            const updated = { ...fieldsPrev };
            updated[newName] = updated[oldName];
            delete updated[oldName];
            return updated;
        });

        return next;
    });
  };

  const updateFieldName = (tableName: string, fieldId: string, newName: string) => {
    setSelectedFields(prev => {
        const currentFields = [...(prev[tableName] || [])];
        const updated = currentFields.map(f => 
            f.id === fieldId ? { ...f, name: newName } : f
        );
        return { ...prev, [tableName]: updated };
    });
  };

  // Drag and Drop handlers
  const onDragStart = (tableName: string, index: number) => {
    setDragInfo({ tableName, index });
  };

  const onDragOver = (e: React.DragEvent, tableName: string, index: number) => {
    e.preventDefault();
    if (!dragInfo || dragInfo.tableName !== tableName || dragInfo.index === index) return;

    setSelectedFields(prev => {
        const fields = [...(prev[tableName] || [])];
        const draggedItem = fields[dragInfo.index];
        fields.splice(dragInfo.index, 1);
        fields.splice(index, 0, draggedItem);
        
        setDragInfo({ tableName, index }); // Update current index to prevent flickering
        return { ...prev, [tableName]: fields };
    });
  };

  const onDragEnd = () => {
    setDragInfo(null);
  };

  const handleConfirm = async () => {
    if (!file) return;
    setStep('processing');
    
    const finalConfigs = previewTables.map(t => {
        const fields = selectedFields[t.name] || [];
        return {
            sheetName: t.originalSheetName,
            tableName: t.name,
            headerRowIndex: t.headerRowIndex,
            // 활성화된 필드만, 사용자 지정 이름과 함께 전달
            selectedFields: fields.filter(f => f.isActive).map(f => ({
                id: f.id,
                name: f.name,
                isRequired: f.isRequired,
                type: f.type
            }))
        };
    });
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('configsJson', JSON.stringify(finalConfigs));
    
    try {
        await uploadExcelAction(formData, userId);
        window.location.reload();
    } catch (error) {
        alert('업로드 중 오류가 발생했습니다.');
        setStep('select');
    }
  };

  return (
    <div className="w-full relative">
      <div 
        ref={previewRef}
        className="fixed top-0 left-0 w-[1200px] bg-white pointer-events-none -z-[100] overflow-visible"
        style={{ opacity: 0.01 }}
        dangerouslySetInnerHTML={{ __html: excelHtml }}
      />

      {step === 'upload' && (
        <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-2xl bg-white hover:bg-blue-50 hover:border-blue-400 transition-all cursor-pointer group">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-full mb-4 group-hover:scale-110 transition-transform">
                <Upload size={28} />
            </div>
            <p className="mb-2 text-sm text-gray-700 font-bold">엑셀 파일을 선택하거나 여기로 끌어오세요</p>
            <p className="text-xs text-gray-500">AI가 자동으로 구조를 분석하여 최적의 필드를 추천합니다.</p>
          </div>
          <input type="file" className="hidden" accept=".xlsx,.xls,.csv" onChange={handleFileChange} />
        </label>
      )}

      {step === 'analyzing' && (
        <div className="bg-white p-20 border rounded-3xl shadow-xl animate-in fade-in zoom-in duration-500 max-w-2xl mx-auto text-center">
            <div className="flex flex-col items-center mb-10">
                <div className="p-4 bg-indigo-100 text-indigo-600 rounded-2xl mb-6 shadow-sm">
                    <Sparkles size={40} className="animate-pulse" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-3">AI가 엑셀 구조를 분석 중입니다</h3>
                <p className="text-gray-600 leading-relaxed mb-8">
                    Gemini AI가 엑셀의 시각적 형태를 파악하여 서비스 구성에 가장 적합한 데이터 필드를 찾고 있습니다.<br/>
                    잠시만 기다려 주세요.
                </p>
                <div className="w-full max-w-xs bg-gray-100 h-2 rounded-full overflow-hidden relative">
                    <div className="bg-indigo-600 h-full absolute top-0 animate-[loading_2s_ease-in-out_infinite]" style={{ width: '40%' }}></div>
                </div>
            </div>
        </div>
      )}

      {step === 'select' && (
        <div className="bg-white p-8 border rounded-3xl shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-8 border-b">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl shadow-lg ring-4 ring-blue-50">
                <Sparkles size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-gray-900 tracking-tight">필드 구성 및 순서 편집</h3>
                <p className="text-gray-500 mt-1">
                    AI가 추천한 필드입니다. 필드명을 수정하거나 드래그하여 순서를 바꿀 수 있습니다.
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={() => applyRecommendation(previewTables, recommendations)}
                className="flex items-center gap-2 px-5 py-3 text-gray-600 font-bold rounded-xl hover:bg-gray-100 transition-colors border-2 border-gray-100"
              >
                <RotateCcw size={18} />
                추천대로 초기화
              </button>
              <button 
                onClick={handleConfirm}
                className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all active:scale-95 group"
              >
                <Save size={18} />
                DB 생성 및 데이터 연동
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div className="space-y-16">
            {previewTables.map((table, tIdx) => {
              const tableFields = selectedFields[table.name] || [];
              const activeCount = tableFields.filter(f => f.isActive).length;

              return (
                <div key={tIdx} className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${tIdx * 100}ms` }}>
                  <div className="flex items-center justify-between mb-6 px-2">
                      <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-600 text-white rounded-lg shadow-md">
                              <FileText size={20} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 group">
                                <input 
                                  type="text" 
                                  value={table.name} 
                                  onChange={(e) => updateTableName(tIdx, e.target.value)}
                                  className="font-black text-xl text-gray-900 bg-transparent border-b-2 border-transparent focus:border-blue-500 outline-none w-full md:w-80 transition-all"
                                  placeholder="테이블명 입력"
                                />
                                <Edit3 size={14} className="text-gray-300 opacity-0 group-hover:opacity-100" />
                            </div>
                            <p className="text-xs font-bold text-gray-400 mt-0.5">총 {tableFields.length}개 필드 중 {activeCount}개 활성화</p>
                          </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full">
                          <Info size={14} />
                          드래그하여 순서를 변경하세요
                      </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    {tableFields.map((field, fIdx) => (
                        <div
                          key={field.id}
                          draggable
                          onDragStart={() => onDragStart(table.name, fIdx)}
                          onDragOver={(e) => onDragOver(e, table.name, fIdx)}
                          onDragEnd={onDragEnd}
                          className={`
                            flex items-center gap-4 p-4 rounded-2xl border-2 transition-all group
                            ${field.isActive ? 'bg-white border-blue-100 shadow-sm' : 'bg-gray-50 border-transparent opacity-60'}
                            ${dragInfo?.tableName === table.name && dragInfo?.index === fIdx ? 'opacity-30 border-dashed border-blue-400' : ''}
                          `}
                        >
                          {/* Drag Handle */}
                          <div className="cursor-grab active:cursor-grabbing text-gray-300 group-hover:text-gray-400 transition-colors">
                            <GripVertical size={20} />
                          </div>

                          {/* Checkbox */}
                          <button 
                            onClick={() => toggleField(table.name, field.id)}
                            className={`
                                w-6 h-6 rounded-lg flex items-center justify-center transition-all
                                ${field.isActive ? 'bg-blue-600 text-white' : 'border-2 border-gray-300 hover:border-blue-400'}
                                ${field.id === '__data_id__' ? 'cursor-not-allowed' : ''}
                            `}
                          >
                            {field.isActive && <Check size={14} strokeWidth={4} />}
                          </button>

                          {/* Field Name Input */}
                          <div className="flex flex-col flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                  <input 
                                    type="text" 
                                    value={field.name}
                                    onChange={(e) => updateFieldName(table.name, field.id, e.target.value)}
                                    onDragStart={(e) => e.stopPropagation()} // 입력 중 드래그 방지
                                    placeholder="필드명 입력"
                                    className={`
                                        bg-transparent font-black text-sm outline-none border-b-2 border-transparent focus:border-blue-400 focus:bg-white focus:px-2 py-1 transition-all w-full md:w-64
                                        ${field.isActive ? 'text-gray-900' : 'text-gray-400'}
                                    `}
                                  />
                                  <Edit3 size={12} className="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider truncate">
                                  {field.id === '__data_id__' ? 'Auto Generated' : `Source: ${field.id}`}
                              </span>
                          </div>

                          {/* Tags & Controls */}
                          <div className="hidden sm:flex items-center gap-3">
                              {/* Type Select */}
                              <select 
                                value={field.type} 
                                onChange={(e) => updateFieldType(table.name, field.id, e.target.value)}
                                className={`
                                    text-[10px] font-black bg-gray-100 border-none rounded-md px-2 py-1.5 outline-none text-gray-500 transition-all
                                    ${field.isActive ? 'hover:bg-blue-50 hover:text-blue-600' : ''}
                                `}
                              >
                                  <option value="string">STRING</option>
                                  <option value="number">NUMBER</option>
                                  <option value="date">DATE</option>
                                  <option value="currency">CURRENCY</option>
                              </select>

                              {/* Required Toggle */}
                              <button 
                                onClick={() => toggleRequired(table.name, field.id)}
                                className={`
                                    flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black transition-all
                                    ${field.isRequired ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-gray-100 text-gray-400 border border-transparent'}
                                    ${field.id === '__data_id__' ? 'cursor-not-allowed opacity-50' : 'hover:scale-105 active:scale-95'}
                                `}
                              >
                                  <AlertCircle size={12} />
                                  {field.isRequired ? '필수' : '선택'}
                              </button>

                              {field.id === '__data_id__' && (
                                  <span className="text-[10px] font-black text-white bg-indigo-500 px-3 py-1.5 rounded-full shadow-sm">DEFAULT_ID</span>
                              )}
                              {recommendations.some(r => r.columns.some(c => c.name === field.id)) && (
                                  <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full flex items-center gap-1">
                                      <Sparkles size={10} /> AI_REC
                                  </span>
                              )}
                          </div>
                        </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="mt-16 bg-blue-50 p-10 rounded-[32px] flex flex-col items-center text-center">
              <div className="p-4 bg-blue-600 text-white rounded-2xl shadow-xl mb-6">
                <DatabaseIcon size={32} />
              </div>
              <h4 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">설정이 완료되었나요?</h4>
              <p className="text-gray-600 mb-8 max-w-lg">
                  최종 구성을 바탕으로 귀사의 비즈니스에 최적화된 데이터베이스를 구축합니다.<br/>
                  저장 후 즉시 데이터 조회 및 관리가 가능합니다.
              </p>
              <button 
                onClick={handleConfirm}
                className="flex items-center gap-3 px-16 py-5 bg-blue-600 text-white text-xl font-black rounded-2xl hover:bg-blue-700 shadow-2xl shadow-blue-300 transition-all hover:-translate-y-1 active:scale-95 group"
              >
                데이터베이스 구축 시작하기
                <ChevronRight size={24} className="group-hover:translate-x-1 transition-transform" />
              </button>
          </div>
        </div>
      )}

      {step === 'processing' && (
        <div className="flex flex-col items-center justify-center p-20 bg-white border rounded-3xl shadow-2xl text-center animate-in fade-in zoom-in duration-500">
          <div className="relative w-24 h-24 mb-8">
              <div className="absolute inset-0 border-8 border-blue-100 rounded-full"></div>
              <div className="absolute inset-0 border-8 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center text-blue-600">
                  <DatabaseIcon size={32} />
              </div>
          </div>
          <h3 className="text-3xl font-black text-gray-900 mb-3 tracking-tighter">데이터베이스 최적화 중...</h3>
          <p className="text-gray-500 max-w-sm mx-auto leading-relaxed">
              선택하신 필드 정보를 기반으로 서비스 운영을 위한 고성능 데이터 스키마를 구성하고 있습니다.
          </p>
        </div>
      )}

      <style jsx>{`
        @keyframes loading {
          0% { left: -40%; }
          100% { left: 100%; }
        }
      `}</style>
    </div>
  );
}

function DatabaseIcon({ size }: { size: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
            <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
        </svg>
    )
}
