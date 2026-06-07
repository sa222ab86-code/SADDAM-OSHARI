import React, { useState, useMemo } from 'react';
import { Search, Calendar, FileText, User, Phone, Trash2, ArrowUpRight, AlertCircle, Copy, Upload, Download, FileSpreadsheet, History, RefreshCw } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Quote } from '../types';
import { getGrandTotal } from '../utils/calculations';

interface HistoryArchiveTabProps {
  quotesHistory: Quote[];
  onLoadQuote: (quote: Quote) => void;
  onDeleteHistoryItem: (id: string, e: React.MouseEvent) => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
  // Backup / Restore controls
  onBackupExport: () => void;
  onBackupImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  autoBackups: { timestamp: string; label: string; data: string }[];
  onRestoreAutoBackup: (snapshotData: string) => void;
  onClearAutoBackups: () => void;
}

export function HistoryArchiveTab({
  quotesHistory,
  onLoadQuote,
  onDeleteHistoryItem,
  showToast,
  onBackupExport,
  onBackupImport,
  autoBackups,
  onRestoreAutoBackup,
  onClearAutoBackups
}: HistoryArchiveTabProps) {
  // Search state filters
  const [historySearchName, setHistorySearchName] = useState("");
  const [historySearchPhone, setHistorySearchPhone] = useState("");
  const [historySearchNumber, setHistorySearchNumber] = useState("");
  const [historySearchDate, setHistorySearchDate] = useState("");

  // Filtered quotes based on filters
  const filteredHistory = useMemo(() => {
    return quotesHistory.filter(q => {
      const matchName = !historySearchName.trim() || 
        (q.clientInfo?.name || "").toLowerCase().includes(historySearchName.toLowerCase());
      const matchPhone = !historySearchPhone.trim() || 
        (q.clientInfo?.phone || "").includes(historySearchPhone.trim());
      const matchNumber = !historySearchNumber.trim() || 
        (q.offerNumber || "").toLowerCase().includes(historySearchNumber.toLowerCase());
      const matchDate = !historySearchDate || 
        q.date === historySearchDate;
      
      return matchName && matchPhone && matchNumber && matchDate;
    });
  }, [quotesHistory, historySearchName, historySearchPhone, historySearchNumber, historySearchDate]);

  const handleExportArchiveToExcel = () => {
    try {
      if (quotesHistory.length === 0) {
        showToast("لا يوجد أي عروض أسعار مؤرشفة لتصديرها!", "error");
        return;
      }
      const dataToExport = quotesHistory.map((q, idx) => {
        const grandTotal = getGrandTotal(q.items, q.globalDiscountValue, q.globalDiscountType);
        const itemNames = q.items ? q.items.map(it => `${it.name} (${it.quantity})`).join("، ") : "";
        return {
          "مسلسل": idx + 1,
          "رقم العرض المرجعي": `QT-${q.offerNumber}`,
          "التاريخ": q.date,
          "تاريخ الانتهاء": q.expireDate,
          "العميل": q.clientInfo?.name || "غير محدد",
          "الهاتف": q.clientInfo?.phone || "",
          "الرقم الضريبي الموحد للعميل": q.clientInfo?.taxNumber || "",
          "الأصناف والكميات": itemNames,
          "الخصم الإضافي": q.globalDiscountValue > 0 ? `${q.globalDiscountValue} (${q.globalDiscountType === 'percent' ? '%' : 'ر.س'})` : "لا يوجد",
          "صافي العرض بالضريبة (ر.س)": grandTotal
        };
      });
      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "سجلات الفواتير");
      XLSX.writeFile(wb, "أرشيف_عروض_الأسعار_المسجلة.xlsx");
      showToast("✓ تم تصدير أرشيف الفواتير المعتمد إلى Excel بنجاح!");
    } catch (err: any) {
      showToast(`فشل تصدير الأرشيف لـ Excel: ${err.message}`, "error");
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Filter Header Panel */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-100 text-right space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            <span>أرشيف وسجلات عروض الأسعار الصادرة</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            البحث والتصفية في معاملات عروض الأسعار المسجلة سابقاً، واسترداد تفاصيل المعاملات لإعادة تحريرها أو طباعتها.
          </p>
        </div>

        {/* Multi-Filter Search Inputs Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          <div className="relative">
            <input 
              type="text" 
              placeholder="البحث باسم العميل..."
              value={historySearchName}
              onChange={(e) => setHistorySearchName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-400 focus:bg-white rounded-xl pr-9 pl-3 py-1.5 text-xs font-bold text-slate-800 transition-all outline-hidden text-right"
            />
            <User className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          </div>

          <div className="relative">
            <input 
              type="text" 
              placeholder="البحث برقم الهاتف..."
              value={historySearchPhone}
              onChange={(e) => setHistorySearchPhone(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-400 focus:bg-white rounded-xl pr-9 pl-3 py-1.5 text-xs font-bold text-slate-800 font-mono transition-all outline-hidden text-right"
            />
            <Phone className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          </div>

          <div className="relative">
            <input 
              type="text" 
              placeholder="البحث برقم العرض (مثال: 0001)..."
              value={historySearchNumber}
              onChange={(e) => setHistorySearchNumber(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-400 focus:bg-white rounded-xl pr-9 pl-3 py-1.5 text-xs font-bold text-slate-800 transition-all outline-hidden text-right"
            />
            <FileText className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          </div>

          <div className="relative">
            <input 
              type="date" 
              value={historySearchDate}
              onChange={(e) => setHistorySearchDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-400 focus:bg-white rounded-xl pr-9 pl-3 py-1.5 text-xs font-bold text-slate-800 font-sans transition-all outline-hidden text-right"
            />
            <Calendar className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* بوابة إدارة البيانات والنسخ الاحتياطي الذكي */}
      <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 text-right space-y-2.5">
        <h3 className="text-xs font-black text-slate-500 uppercase tracking-wide flex items-center gap-1.5 pb-1 border-b border-slate-200">
          <History className="w-4 h-4 text-emerald-600" />
          <span>إدارة وحماية البيانات والنسخ الاحتياطي للبرنامج</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          
          {/* قسم استعادة النسخ الاحتياطي اليدوي والتصدير الشامل لـ Excel */}
          <div className="bg-white rounded-xl p-2.5 border border-slate-150 space-y-2">
            <span className="text-[10px] font-black text-slate-400 block pb-0.5 border-b border-slate-50">تصدير واستيراد قواعد البيانات الشاملة (JSON / Excel)</span>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={onBackupExport}
                className="py-1 px-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer shadow-xs"
              >
                <Download className="w-3 h-3" />
                <span>تصدير نسخة كاملة (.json)</span>
              </button>

              <button
                type="button"
                onClick={handleExportArchiveToExcel}
                className="py-1 px-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer border border-emerald-200"
              >
                <FileSpreadsheet className="w-3 h-3" />
                <span>تصدير عروض الأسعار لـ Excel</span>
              </button>
            </div>

            <div className="bg-slate-50 p-2 rounded-lg border border-slate-150 flex flex-col sm:flex-row items-center justify-between gap-1.5">
              <div className="text-right">
                <span className="text-[9px] font-bold text-slate-700 block">تغذية واستيراد ملف نسخة سابقة:</span>
                <p className="text-[8px] text-slate-400">تحميل ملف استرجاع الفواتير لتخطي الاستلام الافتراضي للبرنامج.</p>
              </div>
              <label className="relative inline-flex items-center justify-center py-1 px-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-md text-[9.5px] font-black cursor-pointer transition-all border border-slate-300">
                <Upload className="w-3 h-3 ml-1" />
                <span>اختر ملف النسخة (.json)</span>
                <input 
                  type="file" 
                  accept=".json"
                  onChange={onBackupImport}
                  className="hidden" 
                />
              </label>
            </div>
          </div>

          {/* قسم استرداد التاريخ التلقائي الفوري لمقر عينات الفترات المنقضية */}
          <div className="bg-white rounded-xl p-2.5 border border-slate-150 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center pb-0.5 border-b border-slate-50 mb-1">
                <span className="text-[10px] font-black text-slate-400 block">سجل نقاط الاسترجاع التلقائية المحمية (الاسترداد الفوري)</span>
                {autoBackups.length > 0 && (
                  <button 
                    onClick={onClearAutoBackups}
                    className="text-[8.5px] text-rose-500 hover:text-rose-700 font-bold"
                  >
                    تفريغ السجل
                  </button>
                )}
              </div>

              {autoBackups.length > 0 ? (
                <div className="max-h-24 overflow-y-auto divide-y divide-slate-50 space-y-0.5">
                  {autoBackups.map((bak, sidx) => (
                    <div key={sidx} className="py-0.5 flex justify-between items-center text-[10px] text-slate-600 gap-1.5 hover:bg-slate-50 px-1 rounded transition-all">
                      <div className="text-right truncate max-w-[200px]">
                        <span className="font-extrabold text-slate-800 text-[10px] leading-tight block truncate">{bak.label}</span>
                        <span className="text-[8.5px] text-slate-400 font-sans">{bak.timestamp}</span>
                      </div>
                      <button
                        onClick={() => onRestoreAutoBackup(bak.data)}
                        className="py-0.5 px-1 bg-emerald-50 text-emerald-800 border border-emerald-150 hover:bg-emerald-100 rounded text-[8.5px] font-black transition-all shrink-0 cursor-pointer"
                      >
                        استعادة 🔄
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-2.5 text-center text-slate-400 text-[9.5px] flex flex-col items-center justify-center gap-1 bg-slate-50 rounded-lg border border-dashed border-slate-150">
                  <RefreshCw className="w-3.5 h-3.5 text-slate-300 animate-spin" style={{ animationDuration: '6s' }} />
                  <span>لا توجد نسخ احتياطية تلقائية مسجلة حتى الآن.</span>
                  <span className="text-[8px] text-slate-400">يتم التخزين الاحتياطي التلقائي فوراً فور حفظك أي معاملة بالأرشيف أو تصفير المنشأة.</span>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {filteredHistory.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredHistory.map((quote) => {
            const grandTotalValue = getGrandTotal(quote.items, quote.globalDiscountValue, quote.globalDiscountType);
            const itemsCount = quote.items ? quote.items.reduce((sum, item) => sum + (item.quantity || 1), 0) : 0;
            
            return (
              <div 
                key={quote.id}
                onClick={() => onLoadQuote(quote)}
                className="bg-white rounded-2xl p-4 border border-slate-150 hover:border-indigo-300 hover:shadow-lg transition-all group cursor-pointer text-right flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-center bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <span className="bg-indigo-50 text-indigo-700 font-extrabold px-2.5 py-0.5 rounded-lg text-[10px] font-mono">
                      QT-{quote.offerNumber}
                    </span>
                    <span className="text-[10px] font-sans text-slate-400 font-bold flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-350" />
                      <span>{quote.date}</span>
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold block">العميل المستهدف:</span>
                    <span className="text-xs font-extrabold text-slate-800">{quote.clientInfo?.name || "عميل غير مسجل"}</span>
                    {quote.clientInfo?.phone && (
                      <span className="text-[10px] text-slate-500 font-mono block font-bold">{quote.clientInfo.phone}</span>
                    )}
                  </div>

                  <div className="flex justify-between items-center text-[11px] pt-1 border-t border-slate-50">
                    <span className="font-bold text-slate-400">إجمالي الأصناف:</span>
                    <span className="font-bold text-slate-700">{itemsCount} صنف</span>
                  </div>
                </div>

                <div className="flex justify-between items-end pt-4 mt-4 border-t border-slate-100">
                  <div className="text-right">
                    <span className="text-[9px] text-slate-400 font-black block">إجمالي العرض بعد الضريبة:</span>
                    <span className="text-sm font-black text-emerald-700 font-mono">
                      {grandTotalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ر.س
                    </span>
                  </div>

                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={(e) => onDeleteHistoryItem(quote.id, e)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                      title="حذف من السجلات"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    
                    <span className="p-1.5 bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white rounded-lg transition-all">
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center bg-white border border-slate-150 rounded-2xl text-slate-400 flex flex-col items-center gap-2">
          <AlertCircle className="w-8 h-8 text-slate-300" />
          <p className="text-sm font-bold">لم يعثر على عروض أسعار تناسب تصفيتك</p>
          <p className="text-xs text-slate-400">امسح مدخلات البحث أو احرص على حفظ عروض فور إنشائها لإضافتها للأرشيف.</p>
        </div>
      )}
    </div>
  );
}
