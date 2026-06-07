import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Download, AlertCircle, Check, X, FileSpreadsheet } from 'lucide-react';
import { Product } from '../types';

interface MappedExcelItem {
  name: string;
  price: number;
}

interface ExcelImporterProps {
  onImport: (newProducts: Product[]) => void;
  onClose: () => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export function ExcelImporter({ onImport, onClose, showToast }: ExcelImporterProps) {
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [excelPreview, setExcelPreview] = useState<MappedExcelItem[]>([]);
  const [excelError, setExcelError] = useState<string | null>(null);

  const downloadExcelTemplate = () => {
    try {
      const ws_data = [
        ["اسم المنتج", "السعر"],
        ["طقم فستان سابع فاخر 1", 198],
        ["مشاية كيكو ذكية مريحة", 189],
        ["كرسي هزاز مريح ومثالي", 316]
      ];
      const ws = XLSX.utils.aoa_to_sheet(ws_data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "الأصناف");
      XLSX.writeFile(wb, "نموذج_استيراد_الأصناف.xlsx");
      showToast("✓ تم تنزيل نموذج الإكسل المعتمد بنجاح!");
    } catch (err: any) {
      showToast(`فشل تنزيل النموذج: ${err.message}`, "error");
    }
  };

  const handleExcelImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setExcelFile(file);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
        if (!rows || rows.length < 1) {
          setExcelError("الملف فارغ أو غير متوافق!");
          return;
        }

        let headerRowIdx = -1;
        for (let i = 0; i < Math.min(rows.length, 5); i++) {
          if (rows[i] && rows[i].length > 0 && rows[i].some(cell => typeof cell === 'string' && cell.trim().length > 0)) {
            headerRowIdx = i;
            break;
          }
        }

        if (headerRowIdx === -1) {
          setExcelError("تعذر العثور على صف العناوين أو رأس الأعمدة");
          return;
        }

        const headers = rows[headerRowIdx].map(h => String(h || '').trim().toLowerCase());
        
        let nameIdx = -1;
        let priceIdx = -1;

        headers.forEach((h, idx) => {
          if (/اسم|صنف|منتج|موديل|name|product|item|title/.test(h)) {
            if (nameIdx === -1) nameIdx = idx;
          } else if (/سعر|السعر|قيمة|قيمه|ربح|مبلغ|price|rate|cost|value/.test(h)) {
            if (priceIdx === -1) priceIdx = idx;
          }
        });

        if (nameIdx === -1) nameIdx = 0;
        if (priceIdx === -1) priceIdx = headers.length > 1 ? 1 : 0;

        const parsedItems: MappedExcelItem[] = [];

        for (let i = headerRowIdx + 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0) continue;

          const nVal = String(row[nameIdx] || '').trim();
          if (!nVal) continue;

          const pVal = parseFloat(String(row[priceIdx] || '0').replace(/[^0-9.]/g, '')) || 0;

          parsedItems.push({
            name: nVal,
            price: pVal
          });
        }

        if (parsedItems.length === 0) {
          setExcelError("لم نجد بيانات صالحة للاستيراد. تأكّد من تطابق عناوين الأعمدة.");
          setExcelPreview([]);
        } else {
          setExcelPreview(parsedItems);
          setExcelError(null);
          showToast(`✓ تم العثور على ${parsedItems.length} صنف وجاهز للاستيراد!`);
        }
      } catch (err: any) {
        setExcelError(`فشل في استيراد الملف: ${err.message}`);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleConfirmImport = () => {
    if (excelPreview.length === 0) return;
    onImport(excelPreview);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-linear-to-r from-slate-50 to-white">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">استيراد الأصناف من ملف إكسل (Excel)</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-center justify-between gap-3 text-right">
            <div>
              <p className="text-xs font-bold text-indigo-900 mb-0.5">هل تحتاج لمثال للتخطيط؟</p>
              <p className="text-[10px] text-indigo-700">نزّل هذا النموذج واملأ حقول الأصناف ثم أعد رفعه هنا ليتطابق فورياً بذكاء.</p>
            </div>
            <button
              onClick={downloadExcelTemplate}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1 shadow-sm cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تحميل النموذج</span>
            </button>
          </div>

          <div className="border-2 border-dashed border-slate-200 hover:border-slate-350 bg-slate-50 hover:bg-slate-100/50 rounded-xl transition-all p-6 text-center flex flex-col items-center justify-center gap-2 relative">
            <input 
              type="file" 
              accept=".xlsx, .xls" 
              onChange={handleExcelImportFile}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <div className="p-3 bg-white rounded-full shadow-xs text-slate-400">
              <FileSpreadsheet className="w-6 h-6 text-emerald-500" />
            </div>
            <div className="text-xs">
              <span className="font-bold text-indigo-600">اضغط لرفع الملف</span> أو قم بسحبه وإسقاطه هنا
            </div>
            <p className="text-[10px] text-slate-400">يدعم صيغ .xlsx و .xls فقط</p>
          </div>

          {excelError && (
            <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-800 text-xs flex gap-2 items-start text-right">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <span>{excelError}</span>
            </div>
          )}

          {excelFile && !excelError && (
            <div className="flex items-center gap-2 p-2 px-3 bg-slate-50 border border-slate-100 rounded-lg text-xs">
              <Check className="w-4 h-4 text-emerald-500" />
              <span className="font-bold text-slate-700">الملف المختار:</span>
              <span className="text-slate-500 font-mono text-[10px] font-bold">{excelFile.name}</span>
            </div>
          )}

          {excelPreview.length > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-800">معاينة الأصناف الجاهزة ({excelPreview.length}):</span>
                <span className="text-slate-400 text-[10px]">سيتم دمجها في قاعدة المنتجات الدائمة</span>
              </div>
              <div className="border border-slate-150 rounded-xl max-h-36 overflow-y-auto divide-y divide-slate-100 text-xs">
                {excelPreview.map((item, idx) => (
                  <div key={idx} className="p-2 flex justify-between items-center px-3 bg-slate-50/50">
                    <span className="font-bold text-slate-700 truncate max-w-[70%]">{item.name}</span>
                    <span className="font-bold text-emerald-700 font-mono">{item.price.toFixed(2)} ر.س</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 p-4 bg-slate-50 border-t border-slate-100">
          <button
            onClick={handleConfirmImport}
            disabled={excelPreview.length === 0}
            className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-xs font-bold transition-all shadow-md focus:ring-1 focus:ring-emerald-400 cursor-pointer"
          >
            تأكيد استيراد وحفظ {excelPreview.length > 0 ? excelPreview.length : ""} صنف
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            إلغاء المعالجة
          </button>
        </div>
      </div>
    </div>
  );
}
