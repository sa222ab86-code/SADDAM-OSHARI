import React, { useState } from 'react';
import { X, Send, Phone, Clipboard, Check, Share2 } from 'lucide-react';

interface WhatsAppModalProps {
  onClose: () => void;
  onGenerateAndShare: (phone: string, mode: 'a4' | '80mm') => void;
  clientPhone: string;
}

export function WhatsAppModal({ onClose, onGenerateAndShare, clientPhone }: WhatsAppModalProps) {
  const [phoneNumber, setPhoneNumber] = useState(clientPhone || "");
  const [shareMode, setShareMode] = useState<'a4' | '80mm'>('a4');
  const [progress, setProgress] = useState(false);

  const handleShareClick = () => {
    setProgress(true);
    setTimeout(() => {
      onGenerateAndShare(phoneNumber, shareMode);
      setProgress(false);
      onClose();
    }, 450);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-linear-to-r from-slate-50 to-white">
          <div className="flex items-center gap-2 text-emerald-600">
            <Share2 className="w-5 h-5" />
            <h3 className="text-sm font-bold text-slate-800">مساعد مشاركة واتساب (WhatsApp)</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-right">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-600 block">رقم هاتف العميل:</label>
            <div className="relative">
              <input 
                type="tel" 
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="مثال: 0501234567"
                className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-400 focus:bg-white rounded-xl pr-9 pl-3 py-2 text-xs font-bold text-slate-800 font-mono transition-all outline-hidden text-right"
              />
              <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            </div>
            <p className="text-[9px] text-slate-400 tracking-tight">سيقوم النظام بتوجيهه تلقائياً لصيغة التداول الدولية لـ 966+ السعودية.</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-600 block">تنسيق مستند الفاتورة المرفق:</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setShareMode('a4')}
                className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                  shareMode === 'a4' 
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                }`}
              >
                المستند الرسمي (A4)
              </button>
              
              <button
                type="button"
                onClick={() => setShareMode('80mm')}
                className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                  shareMode === '80mm' 
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                }`}
              >
                الإيصال الحراري (80 مم)
              </button>
            </div>
          </div>

          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-[10px] text-emerald-800 flex gap-2 items-start leading-relaxed">
            <Check className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
            <span>
              <strong>توجيه ذكي:</strong> بعد الضغط على إرسال، سيتم توليد وتنزيل ملف الـ PDF الرسمي عالي الدقة تلقائياً على جهازكم، وستفتح محادثة واتساب العميل لكتابة ملخص عرض السعر وإمكانية إرفاق الملف يدوياً مباشرة وبسهولة.
            </span>
          </div>
        </div>

        <div className="flex gap-2 p-4 bg-slate-50 border-t border-slate-100">
          <button
            onClick={handleShareClick}
            disabled={progress}
            className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>{progress ? "جاري التوليد للطباعة..." : "إرسال ومشاركة عبر واتساب"}</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            إلغاء الأمر
          </button>
        </div>
      </div>
    </div>
  );
}
