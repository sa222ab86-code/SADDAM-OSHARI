import React, { useState } from 'react';
import { X, Save, Upload, Briefcase, Landmark, ShieldCheck, Mail, MapPin, Hash, Phone } from 'lucide-react';
import { CompanyInfo } from '../types';

interface CompanyModalProps {
  company: CompanyInfo;
  onSave: (updated: CompanyInfo) => void;
  onClose: () => void;
}

export function CompanyModal({ company, onSave, onClose }: CompanyModalProps) {
  const [formData, setFormData] = useState<CompanyInfo>({ ...company });

  const handleChange = (field: keyof CompanyInfo, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) {
          handleChange('logo', evt.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-2">
      <div className="bg-white rounded-xl w-full max-w-3xl shadow-lg border border-slate-200 overflow-hidden">
        {/* رأس مضغوط */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-100">
          <div className="flex items-center gap-1.5">
            <Briefcase className="w-4 h-4 text-indigo-500" />
            <h3 className="text-xs font-bold text-slate-700">بيانات المنشأة</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[80vh] overflow-y-auto p-4 space-y-3">
          {/* شعار المنشأة - مصغر */}
          <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
            <div className="w-12 h-12 bg-white border border-slate-200 rounded-lg flex items-center justify-center shrink-0">
              {formData.logo ? (
                <img src={formData.logo} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <span className="text-slate-300 text-[9px]">شعار</span>
              )}
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-bold text-slate-600">شعار المنشأة</p>
              <div className="relative inline-block mt-1">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleLogoUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full"
                />
                <button
                  type="button"
                  className="px-2 py-1 bg-white border border-slate-200 rounded-md text-[9px] font-medium flex items-center gap-1"
                >
                  <Upload className="w-3 h-3" />
                  <span>رفع</span>
                </button>
              </div>
            </div>
          </div>

          {/* الحقول في شبكة مضغوطة 3 أعمدة */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {/* اسم المنشأة - عرض كامل */}
            <div className="md:col-span-3 space-y-0.5">
              <label className="text-[9px] font-bold text-slate-500 flex items-center gap-1">
                <Briefcase className="w-3 h-3" />
                <span>اسم المنشأة</span>
              </label>
              <input 
                type="text" 
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-medium"
                placeholder="مؤسسة المستقبل للتجارة"
              />
            </div>

            {/* عنوان المنشأة */}
            <div className="md:col-span-2 space-y-0.5">
              <label className="text-[9px] font-bold text-slate-500 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span>العنوان</span>
              </label>
              <input 
                type="text" 
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs"
              />
            </div>

            {/* الهاتف */}
            <div className="space-y-0.5">
              <label className="text-[9px] font-bold text-slate-500 flex items-center gap-1">
                <Phone className="w-3 h-3" />
                <span>الهاتف</span>
              </label>
              <input 
                type="text" 
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs"
              />
            </div>

            {/* الرقم الضريبي */}
            <div className="space-y-0.5">
              <label className="text-[9px] font-bold text-slate-500 flex items-center gap-1">
                <Hash className="w-3 h-3" />
                <span>الرقم الضريبي</span>
              </label>
              <input 
                type="text" 
                value={formData.taxNumber}
                onChange={(e) => handleChange('taxNumber', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-mono"
              />
            </div>

            {/* السجل التجاري */}
            <div className="space-y-0.5">
              <label className="text-[9px] font-bold text-slate-500 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                <span>السجل التجاري</span>
              </label>
              <input 
                type="text" 
                value={formData.regNumber}
                onChange={(e) => handleChange('regNumber', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-mono"
              />
            </div>

            {/* البريد الإلكتروني */}
            <div className="space-y-0.5">
              <label className="text-[9px] font-bold text-slate-500 flex items-center gap-1">
                <Mail className="w-3 h-3" />
                <span>البريد الإلكتروني</span>
              </label>
              <input 
                type="email" 
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs"
              />
            </div>

            {/* اسم البنك */}
            <div className="space-y-0.5">
              <label className="text-[9px] font-bold text-slate-500 flex items-center gap-1">
                <Landmark className="w-3 h-3" />
                <span>البنك</span>
              </label>
              <input 
                type="text" 
                value={formData.bankName}
                onChange={(e) => handleChange('bankName', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs"
              />
            </div>

            {/* رقم الحساب */}
            <div className="space-y-0.5">
              <label className="text-[9px] font-bold text-slate-500 flex items-center gap-1">
                <Landmark className="w-3 h-3" />
                <span>رقم الحساب</span>
              </label>
              <input 
                type="text" 
                value={formData.accountNumber}
                onChange={(e) => handleChange('accountNumber', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-mono"
              />
            </div>

            {/* الآيبان - عرض كامل */}
            <div className="md:col-span-3 space-y-0.5">
              <label className="text-[9px] font-bold text-slate-500 flex items-center gap-1">
                <Landmark className="w-3 h-3" />
                <span>رقم الآيبان (IBAN)</span>
              </label>
              <input 
                type="text" 
                value={formData.iban}
                onChange={(e) => handleChange('iban', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-mono"
              />
            </div>
          </div>
        </form>

        {/* أزرار الإجراءات مضغوطة */}
        <div className="flex gap-2 p-3 bg-slate-50 border-t border-slate-100">
          <button
            onClick={handleSubmit}
            className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1"
          >
            <Save className="w-3.5 h-3.5" />
            <span>حفظ</span>
          </button>
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-[11px] font-medium transition-all"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}