import React, { useState, useMemo } from 'react';
import { 
  Search, Plus, Trash2, Database, Upload, FileText, Check, AlertCircle, FileSpreadsheet 
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Product } from '../types';
import { ExcelImporter } from './ExcelImporter';

interface ProductCatalogTabProps {
  products: Product[];
  onAddProduct: (name: string, price: number) => void;
  onDeleteProduct: (name: string) => void;
  onDeleteAllProducts: () => void;
  onImportProducts: (newProducts: Product[]) => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export function ProductCatalogTab({
  products,
  onAddProduct,
  onDeleteProduct,
  onDeleteAllProducts,
  onImportProducts,
  showToast
}: ProductCatalogTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [newProdName, setNewProdName] = useState('');
  const [newProdPrice, setNewProdPrice] = useState<number | ''>('');
  const [showExcelModal, setShowExcelModal] = useState(false);

  // Export elements to excel
  const handleExportToExcel = () => {
    try {
      if (products.length === 0) {
        showToast("لا يوجد أي منتجات في قاعدة البيانات لتصديرها!", "error");
        return;
      }
      const dataToExport = products.map((p, idx) => ({
        "مستند": idx + 1,
        "اسم المنتج / الموديل": p.name,
        "السعر الحالي (ر.س)": p.price
      }));
      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "دليل المنتجات");
      XLSX.writeFile(wb, "دليل_المنتجات_الدائم.xlsx");
      showToast("✓ تم تصدير كافة الأصناف إلى ملف Excel المعتمد بنجاح!");
    } catch (err: any) {
      showToast(`فشل في التصدير: ${err.message}`, "error");
    }
  };

  // Filter products by search query
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) {
      return products;
    }
    return products.filter((p) => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim()) {
      showToast("يرجى كتابة اسم المنتج", "error");
      return;
    }
    const priceNum = Number(newProdPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      showToast("يرجى إدخال قيمة سعر صحيحة وموجبة", "error");
      return;
    }

    onAddProduct(newProdName.trim(), priceNum);
    setNewProdName('');
    setNewProdPrice('');
  };

  return (
    <div className="space-y-6">
      {/* Header Info Block */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-right">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-600" />
            <span>قاعدة البيانات ودليل المنتجات الدائم</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            الأصناف المسجلة هنا تظهر فورياً كاقتراحات إكمال تلقائي وقوائم منسدلة أثناء كتابة الأسماء في الفواتير.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-1.5 shrink-0">
          <button
            onClick={() => setShowExcelModal(true)}
            className="px-2.5 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100/80 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>استيراد إكسل</span>
          </button>

          {products.length > 0 && (
            <button
              onClick={handleExportToExcel}
              className="px-2.5 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100/80 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>تصدير إكسل</span>
            </button>
          )}
          
          {products.length > 0 && (
            <button
              onClick={onDeleteAllProducts}
              className="px-2.5 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100/80 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>حذف الكل</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Modern Form to Add New Custom Product */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 h-fit space-y-4">
          <h3 className="text-xs font-black text-slate-400 tracking-wider uppercase border-b border-slate-50 pb-2">إضافة صنف فردي جديد</h3>
          
          <form onSubmit={handleAddSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600 block">اسم المنتج أو رقم الموديل:</label>
              <input 
                type="text" 
                value={newProdName}
                onChange={(e) => setNewProdName(e.target.value)}
                placeholder="مثال: فستان سابع تركي، مشاية أطفال..."
                className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-400 focus:bg-white rounded-xl px-3 py-2 text-xs font-bold text-slate-800 transition-all outline-hidden"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600 block font-sans">سعر المنتج الافتراضي (ر.س):</label>
              <input 
                type="number" 
                step="0.01"
                value={newProdPrice}
                onChange={(e) => setNewProdPrice(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="0.00"
                className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-400 focus:bg-white rounded-xl px-3 py-2 text-xs font-bold text-slate-800 font-mono transition-all outline-hidden text-right"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-100 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>حفظ في دليل المنتجات</span>
            </button>
          </form>
        </div>

        {/* List & Search View area */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h3 className="text-xs font-black text-slate-400 tracking-wider uppercase">استعراض وتصفية المنتجات ({products.length})</h3>
            
            {/* Search Input Filter */}
            <div className="relative w-full sm:max-w-64">
              <input 
                type="text"
                placeholder="ابحث باسم المنتج أو الصنف هنا..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-450 focus:bg-white rounded-xl pr-9 pl-3 py-1.5 text-xs font-bold text-slate-800 transition-all outline-hidden"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {filteredProducts.length > 0 ? (
            <div className="border border-slate-150 rounded-2xl overflow-hidden shadow-xs">
              <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 text-xs">
                {filteredProducts.map((prod, idx) => (
                  <div key={idx} className="p-3 flex justify-between items-center group hover:bg-slate-50/70 transition-all">
                    <div className="space-y-1 text-right truncate pl-4">
                      <span className="font-bold text-slate-800 text-xs">{prod.name}</span>
                      <div className="flex gap-2 items-center text-[10px] text-slate-400 font-bold">
                        <span>قيمة السعر:</span>
                        <span className="font-mono text-emerald-700 font-extrabold bg-emerald-50 px-1.5 py-0.5 rounded-sm">{prod.price.toFixed(2)} ر.س</span>
                      </div>
                    </div>

                    <button
                      onClick={() => onDeleteProduct(prod.name)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all opacity-100 lg:opacity-0 lg:group-hover:opacity-100 cursor-pointer"
                      title="إزالة الصنف من القاعدة"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-50 border border-slate-100 rounded-2xl text-slate-400 flex flex-col items-center gap-2">
              <AlertCircle className="w-6 h-6 text-slate-350" />
              <p className="text-xs font-bold">لا يوجد نتائج تطابق بحثك الحالي</p>
              <p className="text-[10px] text-slate-400">امسح حقل التصفية أو أضف أصناف جديدة للبدء.</p>
            </div>
          )}
        </div>
      </div>

      {showExcelModal && (
        <ExcelImporter 
          onImport={onImportProducts}
          onClose={() => setShowExcelModal(false)}
          showToast={showToast}
        />
      )}
    </div>
  );
}
