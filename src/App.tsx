import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Printer, 
  FileDown, 
  Send, 
  RefreshCw, 
  Settings, 
  Trash2, 
  Upload, 
  Calendar, 
  User, 
  FileText, 
  Phone, 
  MapPin, 
  Search, 
  Hash, 
  Tag, 
  Check, 
  AlertCircle,
  Database,
  Briefcase,
  Save,
  Users,
  ChevronDown,
  ChevronUp,
  X,
  FileSpreadsheet,
  Share2,
  Landmark,
  Copy,
  Mail,
  Scale
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

import { CompanyInfo, ClientInfo, QuoteItem, Quote, Product } from './types';
import { SaudiRiyalSymbol } from './components/SaudiRiyalSymbol';

// Helper calculations modules
import { 
  getRowSubtotal, 
  getRowTaxAmount, 
  getRowTotal,
  getSubtotalBeforeTax,
  getGlobalDiscountAmount,
  getSubtotalAfterGlobalDiscount,
  getVatTaxTotal,
  getGrandTotal 
} from './utils/calculations';

import { CompanyModal } from './components/CompanyModal';
import { WhatsAppModal } from './components/WhatsAppModal';
import { ProductCatalogTab } from './components/ProductCatalogTab';
import { HistoryArchiveTab } from './components/HistoryArchiveTab';

const DEFAULT_COMPANY: CompanyInfo = {
  name: "مؤسسة المستقبل للتجارة",
  address: "جدة - المملكة العربية السعودية",
  taxNumber: "310123456700003",
  regNumber: "1234567890",
  phone: "+966 500 000 000",
  email: "info@futurecorp.com.sa",
  bankName: "البنك الأهلي السعودي (SNB)",
  accountNumber: "SA9300000000123456789012",
  iban: "SA93 1000 0000 1234 5678 9012",
  logo: ""
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'editor' | 'database' | 'archive'>('editor');
  const [currencySymbolOpt, setCurrencySymbolOpt] = useState<'text' | 'traditional' | 'custom'>('custom');

  // Core configurations state
  const [company, setCompany] = useState<CompanyInfo>(DEFAULT_COMPANY);
  const [client, setClient] = useState<ClientInfo>({ name: "", taxNumber: "", phone: "" });
  const [savedClients, setSavedClients] = useState<ClientInfo[]>([]);
  const [showSavedClientsDropdown, setShowSavedClientsDropdown] = useState(false);
  
  // Invoice state data
  const [offerNumber, setOfferNumber] = useState<string>("26-0001");
  const [date, setDate] = useState<string>("");
  const [expireDate, setExpireDate] = useState<string>("");
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [notes, setNotes] = useState<string>("يسري هذا العرض لمدة 30 يوماً من تاريخ الإصدار. الأسعار تشمل ضريبة القيمة المضافة.");
  const [globalDiscountValue, setGlobalDiscountValue] = useState<number>(0);
  const [globalDiscountType, setGlobalDiscountType] = useState<'percent' | 'fixed'>('percent');

  // Autocomplete products list
  const [products, setProducts] = useState<Product[]>([]);
  const [activeSearchIndex, setActiveSearchIndex] = useState<number | null>(null);

  // Modals state
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [customPrintMode, setCustomPrintMode] = useState<'none' | 'a4' | '80mm'>('none');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [quotesHistory, setQuotesHistory] = useState<Quote[]>([]);
  const [autoBackups, setAutoBackups] = useState<{ timestamp: string; label: string; data: string }[]>([]);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Formatter functions
  const formatRiyal = (amount: number, forceText: boolean = false): React.ReactNode => {
    const formatted = (amount ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (forceText) {
      return `${formatted} ر.س`;
    }
    if (currencySymbolOpt === 'traditional') {
      return (
        <span className="inline-flex items-center gap-1 whitespace-nowrap font-mono font-bold">
          <span>{formatted}</span>
          <span className="text-slate-500 font-bold text-xs select-none">﷼</span>
        </span>
      );
    }
    if (currencySymbolOpt === 'custom') {
      return (
        <span className="inline-flex items-center gap-1 whitespace-nowrap font-mono font-bold text-slate-800">
          <span>{formatted}</span>
          <SaudiRiyalSymbol className="w-4 h-4 inline-block text-emerald-600 align-middle select-none shrink-0" style={{ transform: 'translateY(-1px)' }} />
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 whitespace-nowrap font-mono font-bold text-slate-800">
        <span>{formatted}</span>
        <span className="text-[10px] text-slate-500 font-bold select-none">ر.س</span>
      </span>
    );
  };

  // Toast notifier helper
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
  };

  // Generate blank spreadsheet raw record item
  const createEmptyItem = (): QuoteItem => ({
    id: Math.random().toString(36).substring(2, 9),
    name: "",
    description: "",
    price: 0,
    quantity: 1,
    discountValue: 0,
    discountType: 'percent',
    taxRate: 15,
    image: ""
  });

  // Load configuration and data drafts on startup
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const exp = new Date();
    exp.setDate(exp.getDate() + 30);
    const defaultExpire = exp.toISOString().split('T')[0];

    // Load company profile
    const savedCompany = localStorage.getItem('quote_company_data_v2');
    if (savedCompany) {
      try { setCompany(JSON.parse(savedCompany)); } catch (e) {}
    }

    // Load sequence number
    const savedOfferNum = localStorage.getItem('last_offer_number_v2');
    if (savedOfferNum) {
      setOfferNumber(savedOfferNum);
    } else {
      setOfferNumber("26-0001");
    }

    // Load clients directory list
    const savedClientsData = localStorage.getItem('quote_saved_clients_v2');
    if (savedClientsData) {
      try { setSavedClients(JSON.parse(savedClientsData)); } catch (e) {}
    } else {
      const defaultClients: ClientInfo[] = [
        { name: "مجموعة الشايع التجارية", taxNumber: "300123456700003", phone: "0501234567" },
        { name: "مستشفى الملك فيصل التخصصي", taxNumber: "310987654300003", phone: "0559876543" }
      ];
      setSavedClients(defaultClients);
      localStorage.setItem('quote_saved_clients_v2', JSON.stringify(defaultClients));
    }

    // Load permanent product directory database
    const savedProducts = localStorage.getItem('quote_products_db_v2');
    if (savedProducts) {
      try { setProducts(JSON.parse(savedProducts)); } catch (e) {}
    } else {
      setProducts([]);
    }

    // Load saved quote transactions archive
    const savedHistory = localStorage.getItem('quotes_history_v2');
    if (savedHistory) {
      try { setQuotesHistory(JSON.parse(savedHistory)); } catch (e) {}
    }

    // Load ongoing active draft values
    const savedDraft = localStorage.getItem('quote_current_draft_v2');
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        if (parsed.items && parsed.items.length > 0) {
          setItems(parsed.items);
        } else {
          setItems([createEmptyItem()]);
        }
        if (parsed.client) setClient(parsed.client);
        if (parsed.notes !== undefined) setNotes(parsed.notes);
        if (parsed.globalDiscountValue !== undefined) setGlobalDiscountValue(parsed.globalDiscountValue);
        if (parsed.globalDiscountType) setGlobalDiscountType(parsed.globalDiscountType);
        if (parsed.offerNumber) setOfferNumber(parsed.offerNumber);
        setDate(parsed.date || today);
        setExpireDate(parsed.expireDate || defaultExpire);
      } catch (e) {
        setItems([createEmptyItem()]);
        setDate(today);
        setExpireDate(defaultExpire);
      }
    } else {
      setItems([createEmptyItem()]);
      setDate(today);
      setExpireDate(defaultExpire);
    }

    // Load automatic backups list
    const savedAutoBackups = localStorage.getItem('quote_auto_backups_history');
    if (savedAutoBackups) {
      try {
        setAutoBackups(JSON.parse(savedAutoBackups));
      } catch (e) {}
    }
  }, []);

  // Sync draft to storage
  useEffect(() => {
    if (items.length === 0) return;
    const draft = {
      items,
      client,
      notes,
      globalDiscountValue,
      globalDiscountType,
      offerNumber,
      date,
      expireDate
    };
    localStorage.setItem('quote_current_draft_v2', JSON.stringify(draft));
  }, [items, client, notes, globalDiscountValue, globalDiscountType, offerNumber, date, expireDate]);

  // Handle toast notification timer
  useEffect(() => {
    if (notification) {
      const t = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(t);
    }
  }, [notification]);

  // Click outside autocomplete closer
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveSearchIndex(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Core Auto-Backup Snapshot generator
  const createAutoBackupSnapshot = (label: string, customState?: any) => {
    const backupData = {
      company: customState?.company || company,
      savedClients: customState?.savedClients || savedClients,
      products: customState?.products || products,
      quotesHistory: customState?.quotesHistory || quotesHistory,
      current_draft: {
        items: customState?.items || items,
        client: customState?.client || client,
        notes: customState?.notes !== undefined ? customState.notes : notes,
        globalDiscountValue: customState?.globalDiscountValue !== undefined ? customState.globalDiscountValue : globalDiscountValue,
        globalDiscountType: customState?.globalDiscountType || globalDiscountType,
        offerNumber: customState?.offerNumber || offerNumber,
        date: customState?.date || date,
        expireDate: customState?.expireDate || expireDate
      }
    };

    const newSnapshot = {
      timestamp: new Date().toLocaleString('ar-SA', { hour12: true }),
      label: label,
      data: JSON.stringify(backupData)
    };

    setAutoBackups(prev => {
      const filtered = prev.filter(s => s.label !== label);
      const updated = [newSnapshot, ...filtered].slice(0, 10);
      localStorage.setItem('quote_auto_backups_history', JSON.stringify(updated));
      return updated;
    });
  };

  const handleBackupExport = () => {
    try {
      const backupData = {
        backup_version: "2.0",
        timestamp: new Date().toISOString(),
        company,
        savedClients,
        products,
        quotesHistory,
        current_draft: {
          items,
          client,
          notes,
          globalDiscountValue,
          globalDiscountType,
          offerNumber,
          date,
          expireDate
        }
      };
      const str = JSON.stringify(backupData, null, 2);
      const blob = new Blob([str], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `نسخة_احتياطية_عرض_الأسعار_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast("✓ تم تصدير ملف النسخة الاحتياطية الشاملة بنجاح!");
    } catch (err: any) {
      showToast(`فشل في التصدير: ${err.message}`, "error");
    }
  };

  const handleBackupImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const content = evt.target?.result as string;
        const parsed = JSON.parse(content);
        
        if (!parsed || typeof parsed !== 'object') {
          showToast("الملف المقروء غير صالح أو فارغ!", "error");
          return;
        }

        createAutoBackupSnapshot("قبل استيراد ملف خارجي JSON");

        if (parsed.company) {
          setCompany(parsed.company);
          localStorage.setItem('quote_company_data_v2', JSON.stringify(parsed.company));
        }
        if (parsed.savedClients) {
          setSavedClients(parsed.savedClients);
          localStorage.setItem('quote_saved_clients_v2', JSON.stringify(parsed.savedClients));
        }
        if (parsed.products) {
          setProducts(parsed.products);
          localStorage.setItem('quote_products_db_v2', JSON.stringify(parsed.products));
        }
        if (parsed.quotesHistory) {
          setQuotesHistory(parsed.quotesHistory);
          localStorage.setItem('quotes_history_v2', JSON.stringify(parsed.quotesHistory));
        }
        if (parsed.current_draft) {
          const d = parsed.current_draft;
          if (d.items) setItems(d.items);
          if (d.client) setClient(d.client);
          if (d.notes !== undefined) setNotes(d.notes);
          if (d.globalDiscountValue !== undefined) setGlobalDiscountValue(d.globalDiscountValue);
          if (d.globalDiscountType) setGlobalDiscountType(d.globalDiscountType);
          if (d.offerNumber) setOfferNumber(d.offerNumber);
          if (d.date) setDate(d.date);
          if (d.expireDate) setExpireDate(d.expireDate);
        }

        showToast("✓ تم استرجاع وتعريف كافة بيانات البرنامج من الملف!", "success");
      } catch (err: any) {
        showToast(`فشل تحميل أو معالجة ملف النسخ الاحتياطي: ${err.message}`, "error");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleRestoreAutoBackup = (snapshotDataStr: string) => {
    try {
      const parsed = JSON.parse(snapshotDataStr);
      if (!parsed) return;
      
      createAutoBackupSnapshot("قبل الاسترجاع المباشر");

      if (parsed.company) {
        setCompany(parsed.company);
        localStorage.setItem('quote_company_data_v2', JSON.stringify(parsed.company));
      }
      if (parsed.savedClients) {
        setSavedClients(parsed.savedClients);
        localStorage.setItem('quote_saved_clients_v2', JSON.stringify(parsed.savedClients));
      }
      if (parsed.products) {
        setProducts(parsed.products);
        localStorage.setItem('quote_products_db_v2', JSON.stringify(parsed.products));
      }
      if (parsed.quotesHistory) {
        setQuotesHistory(parsed.quotesHistory);
        localStorage.setItem('quotes_history_v2', JSON.stringify(parsed.quotesHistory));
      }
      if (parsed.current_draft) {
        const d = parsed.current_draft;
        if (d.items) setItems(d.items);
        if (d.client) setClient(d.client);
        if (d.notes !== undefined) setNotes(d.notes);
        if (d.globalDiscountValue !== undefined) setGlobalDiscountValue(d.globalDiscountValue);
        if (d.globalDiscountType) setGlobalDiscountType(d.globalDiscountType);
        if (d.offerNumber) setOfferNumber(d.offerNumber);
        if (d.date) setDate(d.date);
        if (d.expireDate) setExpireDate(d.expireDate);
      }

      showToast("✓ تم تفعيل استرجاع النقطة التلقائية المختارة بنجاح!", "success");
    } catch (e: any) {
      showToast(`فشل استرجاع التماثل التلقائي: ${e.message}`, 'error');
    }
  };

  const handleClearAutoBackups = () => {
    setAutoBackups([]);
    localStorage.removeItem('quote_auto_backups_history');
    showToast("✓ تم تفريغ سجل الهيستوري الاحتياطي التلقائي بنجاح");
  };

  // Update item fields
  const handleUpdateItem = (id: string, field: keyof QuoteItem, value: any) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleAddItem = () => {
    setItems(prev => [...prev, createEmptyItem()]);
    showToast("تم إضافة صنف جديد بنجاح");
  };

  const handleDeleteItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
    showToast("تم حذف السطر من الجدول", "error");
  };

  // Image upload within lines
  const handleLineImageUpload = (id: string, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        handleUpdateItem(id, 'image', e.target.result as string);
        showToast("✓ تم إرفاق صورة السطر بنجاح!");
      }
    };
    reader.readAsDataURL(file);
  };

  // Autosave client in list
  const handleSaveCurrentClient = () => {
    if (!client.name.trim()) {
      showToast("اسم العميل فارغ حالياً!", "error");
      return;
    }
    const exists = savedClients.some(c => c.name.trim().toLowerCase() === client.name.trim().toLowerCase());
    let updated: ClientInfo[];
    if (exists) {
      updated = savedClients.map(c => c.name.trim().toLowerCase() === client.name.trim().toLowerCase() ? client : c);
      showToast("✓ تم تحديث بيانات العميل بنجاح", "success");
    } else {
      updated = [...savedClients, client];
      showToast("✓ تم تسجيل وحفظ العميل الجديد في القائمة", "success");
    }
    setSavedClients(updated);
    localStorage.setItem('quote_saved_clients_v2', JSON.stringify(updated));
  };

  const handleDeleteSavedClient = (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedClients.filter(c => c.name !== name);
    setSavedClients(updated);
    localStorage.setItem('quote_saved_clients_v2', JSON.stringify(updated));
    showToast("تم حذف العميل من القائمة", "error");
  };

  // Database additions / catalog actions
  const handleAddProductToDB = (name: string, price: number) => {
    const isExist = products.some(p => p.name.trim().toLowerCase() === name.trim().toLowerCase());
    if (isExist) {
      showToast("هذا الصنف متواجد مسبقاً بقائمة المنتجات!", "error");
      return;
    }
    const updated = [{ name, price }, ...products];
    setProducts(updated);
    localStorage.setItem('quote_products_db_v2', JSON.stringify(updated));
    showToast("✓ تم إضافة وحفظ الصنف الجديد");
  };

  const handleDeleteProductFromDB = (name: string) => {
    const updated = products.filter(p => p.name !== name);
    setProducts(updated);
    localStorage.setItem('quote_products_db_v2', JSON.stringify(updated));
    showToast("تم إزالة الصنف من القائمة والبحث", "error");
  };

  const handleDeleteAllCatalogProducts = () => {
    if (window.confirm("هذا الإجراء سيقوم بحذف وإفراغ كامل دليل المنتجات الدائم نهائياً. هل أنت متأكد؟")) {
      setProducts([]);
      localStorage.setItem('quote_products_db_v2', JSON.stringify([]));
      showToast("تم تصفير دليل المنتجات بأكمله", "success");
    }
  };

  const handleImportCatalogProducts = (newProducts: Product[]) => {
    const combined = [...products];
    let inserted = 0;
    newProducts.forEach(item => {
      const exists = combined.some(p => p.name.trim().toLowerCase() === item.name.trim().toLowerCase());
      if (!exists) {
        combined.unshift(item);
        inserted++;
      }
    });

    setProducts(combined);
    localStorage.setItem('quote_products_db_v2', JSON.stringify(combined));
    showToast(`✓ تم بنجاح دمج واستيراد ${inserted} منتج فريد لقاعدة البيانات!`, "success");
  };

  // Set New Quote Draft and increment code seq
  const handleResetAll = () => {
    createAutoBackupSnapshot("قبل إنشاء وتصفير العرض");

    let nextNum = "26-0001";
    const pattern = /^(\d+)-(\d+)$/;
    const match = offerNumber.match(pattern);
    if (match) {
      const year = match[1];
      const seq = (parseInt(match[2]) + 1).toString().padStart(4, '0');
      nextNum = `${year}-${seq}`;
    } else {
      nextNum = "26-0002";
    }

    setOfferNumber(nextNum);
    localStorage.setItem('last_offer_number_v2', nextNum);
    setClient({ name: "", taxNumber: "", phone: "" });
    setItems([createEmptyItem()]);
    setGlobalDiscountValue(0);
    setActiveSearchIndex(null);
    setShowSavedClientsDropdown(false);

    const today = new Date().toISOString().split('T')[0];
    setDate(today);
    const exp = new Date();
    exp.setDate(exp.getDate() + 30);
    setExpireDate(exp.toISOString().split('T')[0]);

    showToast("✓ تم تصفير الفاتورة وجاري إعداد عرض سعر رقم " + nextNum);
  };

  // Filter lists during row autocomplete
  const getFilteredProducts = (index: number) => {
    const nameStr = items[index]?.name || '';
    if (!nameStr.trim()) return [];
    return products.filter(p => p.name.toLowerCase().includes(nameStr.toLowerCase()));
  };

  const handleSelectProduct = (index: number, p: Product) => {
    setItems(prev => prev.map((item, idx) => idx === index ? { ...item, name: p.name, price: p.price } : item));
    setActiveSearchIndex(null);
    showToast(`تم إدراج: ${p.name}`);
  };

  // Save Transaction to Historical Records
  const handleSaveQuoteToHistory = () => {
    const newQuote: Quote = {
      id: Math.random().toString(36).substring(2, 9),
      offerNumber,
      date,
      expireDate,
      clientInfo: client,
      items,
      notes,
      globalDiscountValue,
      globalDiscountType
    };
    const updated = [newQuote, ...quotesHistory];
    
    createAutoBackupSnapshot(`حفظ المعاملة QT-${offerNumber} بالأرشيف`, { quotesHistory: updated });

    setQuotesHistory(updated);
    localStorage.setItem('quotes_history_v2', JSON.stringify(updated));
    showToast(`✓ تم حفظ عرض السعر QT-${offerNumber} بالأرشيف بنجاح!`, "success");
  };

  const handleLoadQuote = (quote: Quote) => {
    setOfferNumber(quote.offerNumber);
    setDate(quote.date);
    setExpireDate(quote.expireDate);
    setClient(quote.clientInfo || { name: "", taxNumber: "", phone: "" });
    setItems(quote.items || [createEmptyItem()]);
    setNotes(quote.notes || "");
    setGlobalDiscountValue(quote.globalDiscountValue || 0);
    setGlobalDiscountType(quote.globalDiscountType || 'percent');
    setActiveTab('editor');
    showToast(`✓ تم استرداد وعرض الفاتورة QT-${quote.offerNumber}`);
  };

  const handleDeleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("هل حقاً تود مسح عرض السعر هذا من سجلات الأرشيف؟")) {
      const updated = quotesHistory.filter(q => q.id !== id);
      setQuotesHistory(updated);
      localStorage.setItem('quotes_history_v2', JSON.stringify(updated));
      showToast("تم حذف المعاملة من الأرشيف", "error");
    }
  };

  // Direct Printing Mode
  const handlePrint = (mode: 'a4' | '80mm') => {
    setCustomPrintMode(mode);
    setTimeout(() => {
      window.print();
      setCustomPrintMode('none');
    }, 400);
  };

  // Programmatic PDF Generator
  const generatePDFBlob = async (mode: 'a4' | '80mm'): Promise<Blob> => {
    const prevMode = customPrintMode;
    setCustomPrintMode(mode);
    await new Promise(resolve => setTimeout(resolve, 350));

    const element = document.getElementById('printable-invoice-canvas');
    if (!element) {
      setCustomPrintMode(prevMode);
      throw new Error("Can't find canvas element");
    }

    try {
      const canvas = await html2canvas(element, {
        scale: 2.2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: mode === '80mm' ? 340 : 960
      });

      setCustomPrintMode(prevMode);
      const imgData = canvas.toDataURL('image/jpeg', 0.95);

      if (mode === '80mm') {
        const pWidth = 226; // approx 80mm
        const pHeight = (canvas.height * pWidth) / canvas.width;
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: [pWidth, pHeight] });
        pdf.addImage(imgData, 'JPEG', 0, 0, pWidth, pHeight, undefined, 'FAST');
        return pdf.output('blob');
      } else {
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
        const pWidth = pdf.internal.pageSize.getWidth();
        const pHeight = pdf.internal.pageSize.getHeight();
        const imgHeight = (canvas.height * pWidth) / canvas.width;

        pdf.addImage(imgData, 'JPEG', 0, 0, pWidth, imgHeight, undefined, 'FAST');
        return pdf.output('blob');
      }
    } catch (err) {
      setCustomPrintMode(prevMode);
      throw err;
    }
  };

  const handleDownloadPDFOnly = async (mode: 'a4' | '80mm') => {
    showToast("⏳ يجري الآن معالجة وتوليد ملف PDF عالي الجودة والوضوح...");
    try {
      const blob = await generatePDFBlob(mode);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `QT-${offerNumber}-${client.name || 'عميل'}-${mode === '80mm' ? 'حراري' : 'رسمي'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast("✓ تم تنزيل المستند عالي الوضوح بنجاح!");
    } catch (e) {
      showToast("⚠️ فشل توليد ملف الـ PDF. يرجى تجربة الطباعة مباشرة.", "error");
    }
  };

  // WhatsApp redirection engine
  const handleWhatsAppSharePDF = async (phone: string, mode: 'a4' | '80mm') => {
    showToast("⏳ يجري الآن معالجة ملف الفاتورة المعتمدة وتجهيز رابط الإرسال للمشترك...");
    
    // Open a blank window immediately before executing the async PDF generation
    // This maintains the "user click gesture" context so the browser won't trigger popup blockers!
    const newTab = window.open('about:blank', '_blank');

    try {
      const blob = await generatePDFBlob(mode === '80mm' ? '80mm' : 'a4');
      const filename = `QT-${offerNumber}-${client.name || 'عميل'}.pdf`;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      let sanitizedVal = phone.trim().replace(/[^0-9]/g, "");
      if (sanitizedVal.startsWith('05') && sanitizedVal.length === 10) {
        sanitizedVal = `966${sanitizedVal.substring(1)}`;
      } else if (sanitizedVal.startsWith('5') && sanitizedVal.length === 9) {
        sanitizedVal = `966${sanitizedVal}`;
      }

      const finalPriceStr = getGrandTotal(items, globalDiscountValue, globalDiscountType).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      let bodyText = `السلام عليكم ورحمة الله وبركاته،\n`;
      bodyText += `مرفق لكم طيه عرض السعر المعتمد رقم: *QT-${offerNumber}*\n`;
      bodyText += `مقدم من: *${company.name}*\n`;
      bodyText += `إجمالي المستحق الشامل للضريبة: *${finalPriceStr} ر.س*\n\n`;
      bodyText += `(💡 لقد تم توليد وتنزيل ملف الـ PDF الرسمي تلقائياً على جهازكم باسم "${filename}"؛ يرجى مشاركته كملف مرفق في واتساب للعميل).`;

      const encodedText = encodeURIComponent(bodyText);
      const hostUrl = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
        ? 'https://api.whatsapp.com/send' 
        : 'https://web.whatsapp.com/send';
      
      const whatsappApiTarget = sanitizedVal ? `${hostUrl}?phone=${sanitizedVal}&text=${encodedText}` : `${hostUrl}?text=${encodedText}`;

      if (newTab) {
        newTab.location.href = whatsappApiTarget;
      } else {
        window.open(whatsappApiTarget, '_blank');
      }
      showToast("✓ تم إعداد رابط مشاركة واتساب وتنزيل ملف الفاتورة المرفقة!");
    } catch (e) {
      if (newTab) {
        newTab.close();
      }
      showToast("⚠️ تعذر مشاركة واتساب يرجى المحاولة يدوياً.", "error");
    }
  };

  // Grand parameters calculations values reference
  const subtotalBeforeTaxValue = getSubtotalBeforeTax(items);
  const globalDiscountAmountValue = getGlobalDiscountAmount(items, globalDiscountValue, globalDiscountType);
  const subtotalAfterGlobalDiscountValue = getSubtotalAfterGlobalDiscount(items, globalDiscountValue, globalDiscountType);
  const vatTaxTotalValue = getVatTaxTotal(items, globalDiscountValue, globalDiscountType);
  const grandTotalValue = getGrandTotal(items, globalDiscountValue, globalDiscountType);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans select-none pb-12">
      {/* Dynamic Toast Notifications */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 p-3.5 px-6 rounded-2xl shadow-xl border flex items-center gap-2 text-xs font-bold text-right text-white select-none ${
              notification.type === 'error' 
                ? 'bg-rose-600 border-rose-500' 
                : 'bg-indigo-600 border-indigo-500'
            }`}
          >
            <Check className="w-4 h-4 shrink-0 bg-white/20 p-0.5 rounded-full" />
            <span>{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Top Header Block */}
      <header className="no-print bg-white border-b border-slate-200 sticky top-0 z-40 px-4 py-3 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-700 text-white rounded-xl shadow-md flex items-center justify-center">
              <Database className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-right">
              <h1 className="text-sm font-black text-slate-800">نظام عروض الأسعار والعمليات الحسابية المتكامل</h1>
              <p className="text-[10px] text-slate-400 font-bold mb-0">المملكة العربية السعودية • الفاتورة التقديرية وضريبة القيمة المضافة 15%</p>
            </div>
          </div>

          {/* Navigation view tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl items-center gap-1 shrink-0 border border-slate-200">
            <button
              onClick={() => { setActiveTab('editor'); }}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'editor' 
                  ? 'bg-white shadow-xs text-indigo-700 font-black' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              محرر عروض الأسعار
            </button>
            <button
              onClick={() => setActiveTab('database')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'database' 
                  ? 'bg-white shadow-xs text-indigo-700 font-black' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              دليل المنتجات الدائم ({products.length})
            </button>
            <button
              onClick={() => setActiveTab('archive')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'archive' 
                  ? 'bg-white shadow-xs text-indigo-700 font-black' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              أرشيف المعاملات ({quotesHistory.length})
            </button>
          </div>
        </div>
      </header>

      {/* Main Container Workspace Area */}
      <main className="max-w-7xl mx-auto w-full px-2 pt-2.5 sm:px-4 no-print">
        {activeTab === 'database' && (
          <ProductCatalogTab 
            products={products}
            onAddProduct={handleAddProductToDB}
            onDeleteProduct={handleDeleteProductFromDB}
            onDeleteAllProducts={handleDeleteAllCatalogProducts}
            onImportProducts={handleImportCatalogProducts}
            showToast={showToast}
          />
        )}

        {activeTab === 'archive' && (
          <HistoryArchiveTab 
            quotesHistory={quotesHistory}
            onLoadQuote={handleLoadQuote}
            onDeleteHistoryItem={handleDeleteHistoryItem}
            showToast={showToast}
            onBackupExport={handleBackupExport}
            onBackupImport={handleBackupImport}
            autoBackups={autoBackups}
            onRestoreAutoBackup={handleRestoreAutoBackup}
            onClearAutoBackups={handleClearAutoBackups}
          />
        )}

        {activeTab === 'editor' && (
          <div className="space-y-3.5">
            {/* Quick Actions Panel */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 bg-white p-2.5 px-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetAll}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 shadow-xs cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                  <span>تصفير وإنشاء عرض جديد</span>
                </button>
                <button
                  type="button"
                  onClick={handleSaveQuoteToHistory}
                  className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 shadow-xs cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>حفظ وحجز بالأرشيف</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsCompanyModalOpen(true)}
                  className="px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-205 text-slate-700 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 shadow-xs cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5 text-slate-500" />
                  <span>تغيير هويّة المنشأة</span>
                </button>
              </div>

              {/* Currency Selector Option */}
              <div className="flex items-center gap-2 bg-slate-50 p-1.5 px-3 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400">نمط عرض رمز العملة:</span>
                <div className="flex gap-1 items-center">
                  <button
                    onClick={() => { setCurrencySymbolOpt('custom'); showToast("تم تطبيق رمز الريال المعتمد الحديث"); }}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                      currencySymbolOpt === 'custom' 
                        ? 'bg-emerald-600 text-white font-extrabold shadow-sm' 
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    الرمز الجديد
                  </button>
                  <button
                    onClick={() => { setCurrencySymbolOpt('traditional'); showToast("تم تطبيق الرمز التقليدي (﷼)"); }}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                      currencySymbolOpt === 'traditional' 
                        ? 'bg-indigo-600 text-white font-extrabold shadow-sm' 
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    السنابل (﷼)
                  </button>
                  <button
                    onClick={() => { setCurrencySymbolOpt('text'); showToast("تم تطبيق النص الحرفي (ر.س)"); }}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                      currencySymbolOpt === 'text' 
                        ? 'bg-indigo-600 text-white font-extrabold shadow-sm' 
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    الكتابي (ر.س)
                  </button>
                </div>
              </div>
            </div>

            {/* Invoicing main fields bento grid - النسخة المعدلة */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 sm:gap-4 text-right">
              
              {/* Card 1: Customer client options */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs relative">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
                  <h3 className="text-xs font-black text-slate-400 tracking-wider uppercase flex items-center gap-1.5">
                    <User className="w-4 h-4 text-indigo-500" />
                    <span>بيانات العميل المستهدف</span>
                  </h3>
                  
                  {/* Saved Directory dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowSavedClientsDropdown(!showSavedClientsDropdown)}
                      className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[10px] font-extrabold transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Users className="w-3 h-3" />
                      <span>قائمة جهات الاتصال</span>
                    </button>

                    {showSavedClientsDropdown && (
                      <div className="absolute left-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl w-60 py-1 max-h-48 overflow-y-auto {z-35} z-50 text-right text-xs">
                        {savedClients.length === 0 ? (
                          <div className="p-2.5 text-center text-slate-400 font-bold italic">القائمة فارغة تماماً</div>
                        ) : (
                          savedClients.map((sc, idx) => (
                            <div 
                              key={idx}
                              onClick={() => { setClient(sc); setShowSavedClientsDropdown(false); showToast(`تم تحميل العميل: ${sc.name}`); }}
                              className="w-full text-right p-2.5 hover:bg-slate-50 flex justify-between items-center cursor-pointer transition-colors"
                            >
                              <div className="truncate pl-3">
                                <p className="font-extrabold text-slate-800">{sc.name}</p>
                                {sc.phone && <p className="text-[10px] text-slate-400 font-mono font-bold mt-0.5">{sc.phone}</p>}
                              </div>
                              
                              <button
                                type="button"
                                onClick={(e) => handleDeleteSavedClient(sc.name, e)}
                                className="p-1 text-slate-300 hover:text-rose-600 rounded-sm hover:bg-rose-50 transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500">اسم العميل بالكامل:</label>
                    <input 
                      type="text" 
                      value={client.name}
                      onChange={(e) => setClient(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="اسم المؤسسة، العميل، الشركة العامة..."
                      className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-400 focus:bg-white rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 outline-hidden transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500">الرقم الضريبي (إن وجد):</label>
                      <input 
                        type="text" 
                        value={client.taxNumber || ""}
                        onChange={(e) => setClient(prev => ({ ...prev, taxNumber: e.target.value }))}
                        placeholder="300000000000003"
                        className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-400 focus:bg-white rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 font-mono text-left outline-hidden transition-all"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500">رقم الهاتف الجوال:</label>
                      <input 
                        type="tel" 
                        value={client.phone || ""}
                        onChange={(e) => setClient(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="مثال: 0501234567"
                        className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-400 focus:bg-white rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 font-mono text-left outline-hidden transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveCurrentClient}
                    className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-[10px] font-extrabold transition-all flex items-center justify-center gap-1 cursor-pointer mt-2"
                  >
                    <Save className="w-3 h-3 text-slate-400" />
                    <span>تأكيد وتسجيل جهة الاتصال الفعّالة</span>
                  </button>
                </div>
              </div>

              {/* Card 2: Company Info - نسخة مبسطة ومخفية (تظهر فقط بالطباعة) */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-3">
                  <h3 className="text-[11px] font-black text-slate-400 uppercase flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
                    <span>بيانات المنشأة</span>
                  </h3>
                  <button
                    onClick={() => setIsCompanyModalOpen(true)}
                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[9px] font-bold transition-all cursor-pointer"
                  >
                    تعديل الهوية ✏️
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                    {company.logo ? (
                      <img src={company.logo} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                      <Briefcase className="w-5 h-5 text-slate-300" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-slate-800 truncate">{company.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold">الرقم الضريبي: {company.taxNumber || "310123456700003"}</p>
                    {company.regNumber && <p className="text-[9px] text-slate-400 font-medium">سجل تجاري: {company.regNumber}</p>}
                  </div>
                </div>
              </div>

              {/* Card 3: Offer details dates */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
                  <h3 className="text-xs font-black text-slate-400 tracking-wider uppercase flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-indigo-500" />
                    <span>تفاخر السجل والوثيقة</span>
                  </h3>
                  <div className="text-[10px] text-slate-400 font-mono font-bold">
                    رمز العرض المعتمد
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500">مسلسل رقم عرض السعر المرجعي:</label>
                    <div className="flex gap-1 items-center">
                      <span className="p-2 px-3 bg-slate-100 rounded-xl text-xs font-mono font-black text-slate-400 select-none">QT-</span>
                      <input 
                        type="text" 
                        value={offerNumber}
                        onChange={(e) => setOfferNumber(e.target.value)}
                        placeholder="26-0001"
                        className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-400 focus:bg-white rounded-xl px-3 py-1.5 text-xs font-black text-slate-800 font-mono text-left outline-hidden transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500">تاريخ إصدار العرض:</label>
                      <input 
                        type="date" 
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-400 focus:bg-white rounded-xl px-2 py-1.5 text-xs font-bold text-slate-800 font-sans outline-hidden transition-all text-right"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500">صلاحية العرض (تاريخ الانتهاء):</label>
                      <input 
                        type="date" 
                        value={expireDate}
                        onChange={(e) => setExpireDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-400 focus:bg-white rounded-xl px-2 py-1.5 text-xs font-bold text-slate-800 font-sans outline-hidden transition-all text-right"
                      />
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Dynamic Interactive Rows Spreadsheet Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden" ref={dropdownRef}>
              <div className="p-4 bg-slate-50/70 border-b border-slate-150 flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-indigo-650" />
                  <span className="text-xs font-black text-slate-700">بيانات وأسطر الفاتورة وجدول الأصناف ({items.length})</span>
                </div>
                
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-sm cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>إضافة صنف للجدول</span>
                </button>
              </div>

              {/* Rows Workspace Area */}
              <div className="p-4 overflow-x-auto">
                {items.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-2">
                    <AlertCircle className="w-7 h-7 text-slate-300" />
                    <p className="text-xs font-bold">جدول الأصناف فارغ حالياً.</p>
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold cursor-pointer"
                    >
                      أضف سطر جديد للبدء
                    </button>
                  </div>
                ) : (
                  <table className="w-full min-w-[760px] text-right border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-[10px] font-black text-slate-400 tracking-wide">
                        <th className="pb-3 text-center w-8">#</th>
                        <th className="pb-3 pr-2 w-48">اسم الصنف والموديل</th>
                        <th className="pb-3 pr-2 w-44">الوصف الاختياري</th>
                        <th className="pb-3 text-center w-24">السعر الفردي</th>
                        <th className="pb-3 text-center w-16">الكمية</th>
                        <th className="pb-3 text-center w-28">الخصم المباشر</th>
                        <th className="pb-3 text-center w-20">ضريبة 15%</th>
                        <th className="pb-3 text-center w-28">الإجمالي</th>
                        <th className="pb-3 text-center w-20">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.map((item, idx) => {
                        const rowSubtotal = getRowSubtotal(item);
                        const rowTaxAmount = getRowTaxAmount(item);
                        const rowTotal = getRowTotal(item);

                        return (
                          <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                            <td className="py-3 text-center font-bold text-slate-400">{idx + 1}</td>
                            
                            <td className="py-3 pr-2 relative">
                              <div className="space-y-1">
                                <input 
                                  type="text"
                                  value={item.name}
                                  onChange={(e) => {
                                    handleUpdateItem(item.id, 'name', e.target.value);
                                    setActiveSearchIndex(idx);
                                  }}
                                  onFocus={() => setActiveSearchIndex(idx)}
                                  placeholder="فستان تركي، موديل X..."
                                  className="w-full bg-slate-50 border border-slate-205 focus:border-indigo-400 focus:bg-white rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 outline-hidden transition-all text-right"
                                />

                                {/* Suggestion Autocomplete Menu */}
                                {activeSearchIndex === idx && (
                                  <div className="absolute right-2 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl w-72 max-h-48 overflow-y-auto z-50 text-right text-xs">
                                    {getFilteredProducts(idx).length > 0 ? (
                                      getFilteredProducts(idx).map((p, pIdx) => (
                                        <button
                                          key={pIdx}
                                          type="button"
                                          onClick={() => handleSelectProduct(idx, p)}
                                          className="w-full text-right p-2 hover:bg-slate-50 border-b border-slate-100 last:border-0 block font-bold text-slate-700"
                                        >
                                          <div className="flex justify-between items-center px-1">
                                            <span className="truncate">{p.name}</span>
                                            <span className="text-emerald-700 font-mono text-[9px] bg-emerald-50 px-1 py-0.5 rounded">{p.price.toFixed(2)} ر.س</span>
                                          </div>
                                        </button>
                                      ))
                                    ) : (
                                      <div className="p-2.5 text-slate-400 italic flex justify-between items-center">
                                        <span>لا يوجد صنف مطابق بالدليل</span>
                                        {item.name.trim() && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              handleAddProductToDB(item.name, item.price);
                                              setActiveSearchIndex(null);
                                            }}
                                            className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[9.5px] font-black hover:bg-indigo-100 transition-colors cursor-pointer"
                                          >
                                            تسجيل صنف جديد ➕
                                          </button>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </td>

                            <td className="py-3 pr-2">
                              <input 
                                type="text"
                                value={item.description}
                                onChange={(e) => handleUpdateItem(item.id, 'description', e.target.value)}
                                placeholder="المقاس، اللون، تفاصيل إضافية..."
                                className="w-full bg-slate-50 border border-slate-205 focus:border-indigo-400 focus:bg-white rounded-lg px-2.5 py-1.5 text-xs text-slate-600 outline-hidden transition-all text-right"
                              />
                            </td>

                            <td className="py-3">
                              <input 
                                type="number"
                                step="0.01"
                                value={item.price || ""}
                                onChange={(e) => handleUpdateItem(item.id, 'price', Number(e.target.value))}
                                placeholder="0.00"
                                className="w-full bg-slate-50 border border-slate-205 focus:border-indigo-400 focus:bg-white rounded-lg px-1.5 py-1.5 text-center text-xs font-bold text-slate-800 font-mono outline-hidden transition-all"
                              />
                            </td>

                            <td className="py-3">
                              <input 
                                type="number"
                                value={item.quantity || ""}
                                onChange={(e) => handleUpdateItem(item.id, 'quantity', Number(e.target.value))}
                                placeholder="1"
                                className="w-full bg-slate-50 border border-slate-205 focus:border-indigo-400 focus:bg-white rounded-lg px-1 py-1.5 text-center text-xs font-bold text-slate-800 font-mono outline-hidden transition-all"
                              />
                            </td>

                            <td className="py-3">
                              <div className="flex gap-1 items-center">
                                <input 
                                  type="number"
                                  value={item.discountValue || ""}
                                  onChange={(e) => handleUpdateItem(item.id, 'discountValue', Number(e.target.value))}
                                  placeholder="0"
                                  className="w-16 bg-slate-50 border border-slate-205 focus:border-indigo-400 focus:bg-white rounded-lg px-1.5 py-1.5 text-center text-xs font-bold text-slate-800 font-mono outline-hidden transition-all"
                                />
                                <select
                                  value={item.discountType}
                                  onChange={(e) => handleUpdateItem(item.id, 'discountType', e.target.value)}
                                  className="bg-slate-100 border border-slate-205 rounded-lg text-[10px] p-1 py-1.5 cursor-pointer font-bold text-slate-650"
                                >
                                  <option value="percent">%</option>
                                  <option value="fixed">ر.س</option>
                                </select>
                              </div>
                            </td>

                            <td className="py-3 text-center">
                              <span className="font-mono text-[11px] text-slate-500 font-extrabold bg-slate-50 p-1 px-1.5 rounded border border-slate-150">
                                {item.taxRate || 15}%
                              </span>
                            </td>

                            <td className="py-3 text-center">
                              <span className="font-bold text-slate-700 font-mono text-xs">
                                {formatRiyal(rowTotal)}
                              </span>
                            </td>

                            <td className="py-3 text-center">
                              <div className="flex justify-center items-center gap-1">
                                {/* Thumbnail inline image upload */}
                                <label className="p-1 text-slate-400 hover:text-indigo-650 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer relative" title="إرفاق صورة للموديل">
                                  {item.image ? (
                                    <img src={item.image} alt="row-thumb" className="w-5 h-5 object-contain rounded border border-indigo-200" />
                                  ) : (
                                    <Upload className="w-3.5 h-3.5" />
                                  )}
                                  <input 
                                    type="file" 
                                    accept="image/*"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) handleLineImageUpload(item.id, file);
                                    }}
                                    className="hidden" 
                                  />
                                </label>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteItem(item.id)}
                                  className="p-1 text-slate-400 hover:text-rose-650 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Invoicing notes, Copy bank details, and Calculation summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-right overflow-visible">
              
              {/* Left Column: terms, notes and simplified bank details */}
              <div className="space-y-4">
                
                {/* Custom Notes Section */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
                  <span className="text-[10px] font-black text-slate-400 block pb-1 border-b border-slate-50 uppercase tracking-widest">ملاحظات و شروط عرض الأسعار</span>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="قم بكتابة الملاحظات، شروط الدفع، فترات التسليم، الضمان..."
                    className="w-full bg-slate-50 border border-slate-205 focus:border-indigo-400 focus:bg-white rounded-xl p-3 text-xs font-bold text-slate-650 outline-hidden transition-all text-right resize-none"
                  />
                </div>

                {/* Bank Info - نسخة مبسطة جداً (تظهر التفاصيل الكاملة فقط بالطباعة) */}
                <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-xs space-y-1">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                      <Landmark className="w-3.5 h-3.5 text-indigo-505" />
                      <span className="text-[10px] font-black text-slate-400">بيانات الحساب البنكي للمؤسسة</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <div className="text-right">
                      <span className="text-[9px] font-bold text-slate-400 block leading-none">اسم البنك المعتمد:</span>
                      <span className="text-xs font-black text-slate-700 block mt-1">{company.bankName || "البنك الأهلي السعودي (SNB)"}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="text-left font-mono">
                        <span className="text-[8px] font-bold text-slate-400 block leading-none">IBAN الأيبان للمبيعات:</span>
                        <span className="text-[10px] font-black text-slate-700 block mt-1">{company.iban || "SA93 1000 0000 1234 5678 9012"}</span>
                      </div>
                      <button
                        onClick={() => { 
                          navigator.clipboard.writeText(company.iban || "SA9310000000123456789012"); 
                          showToast("تم نسخ رقم الأيبان IBAN بنجاح!"); 
                        }}
                        className="p-1.5 bg-white border border-slate-200 hover:border-indigo-400 text-slate-400 hover:text-indigo-650 rounded-lg transition-all cursor-pointer"
                        title="نسخ الآيبان"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>

              </div>

              {/* Right Column: Calculations totals financial receipt dashboard */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs h-fit space-y-4">
                <span className="text-[10px] font-black text-slate-400 block pb-1 border-b border-slate-50 uppercase tracking-widest">ملخص البيانات والعمليات الحسابية الشاملة</span>
                
                <div className="space-y-3 text-xs">
                  {/* Subtotal before discounts / taxes */}
                  <div className="flex justify-between items-center text-slate-500 font-bold">
                    <span>المجموع الفرعي الإجمالي للأصناف:</span>
                    <span className="font-mono text-slate-700">{formatRiyal(subtotalBeforeTaxValue)}</span>
                  </div>

                  {/* Progressive Global discount section inside panel */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 bg-slate-50/50 p-2.5 rounded-xl border border-slate-150">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-bold block leading-none">خصم إضافي شامل (اختياري):</span>
                      <p className="text-[9px] text-slate-400 font-medium mt-1">يطبق الخصم الإجمالي على إجمالي قيمة الأصناف قبل الضريبة.</p>
                    </div>

                    <div className="flex gap-1 items-center shrink-0 w-full sm:w-auto">
                      <input 
                        type="number"
                        value={globalDiscountValue || ""}
                        onChange={(e) => setGlobalDiscountValue(Number(e.target.value))}
                        placeholder="0"
                        className="w-16 bg-white border border-slate-205 focus:border-indigo-400 rounded-lg px-2 py-1 text-center font-bold font-mono text-xs outline-hidden shrink-0"
                      />
                      <select
                        value={globalDiscountType}
                        onChange={(e) => setGlobalDiscountType(e.target.value as 'percent' | 'fixed')}
                        className="bg-white border border-slate-205 rounded-lg text-[10px] p-1 font-bold text-slate-650 cursor-pointer"
                      >
                        <option value="percent">% نسبة مئوية</option>
                        <option value="fixed">ر.س مبلغ ثابث</option>
                      </select>
                    </div>
                  </div>

                  {globalDiscountValue > 0 && (
                    <div className="flex justify-between items-center text-rose-600 font-bold bg-rose-50/40 p-2 rounded-lg text-[11px]">
                      <span>قيمة الخصم الشامل المقتطعة:</span>
                      <span className="font-mono font-bold">- {formatRiyal(globalDiscountAmountValue)}</span>
                    </div>
                  )}

                  {/* Net after general discount */}
                  <div className="flex justify-between items-center text-slate-650 font-bold pt-1">
                    <span>الوعاء الخاضع للضريبة (المجموع الصافي):</span>
                    <span className="font-mono text-slate-800">{formatRiyal(subtotalAfterGlobalDiscountValue)}</span>
                  </div>

                  {/* VAT calculation */}
                  <div className="flex justify-between items-center text-slate-650 font-bold bg-slate-50/30 p-2 rounded-lg">
                    <span className="flex items-center gap-1">
                      <span>ضريبة القيمة المضافة الموحدة:</span>
                      <span className="bg-indigo-550/10 text-indigo-750 font-bold px-1.5 py-0.2 rounded-sm text-[10px]">15%</span>
                    </span>
                    <span className="font-mono text-slate-800 font-black">{formatRiyal(vatTaxTotalValue)}</span>
                  </div>

                  <hr className="border-slate-100" />

                  {/* Final net amount */}
                  <div className="flex justify-between items-center bg-indigo-50/50 p-3 rounded-2xl border border-indigo-100">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-bold block leading-none">إجمالي القيمة المستحقة النهائية:</span>
                      <span className="text-[9px] text-slate-400 font-bold mt-1">يشمل ضريبة القيمة المضافة المحددة قانونياً</span>
                    </div>
                    <span className="text-lg font-black text-emerald-700 font-mono">
                      {formatRiyal(grandTotalValue)}
                    </span>
                  </div>
                </div>

                {/* Production downloads and direct layouts generation panel */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleDownloadPDFOnly('a4')}
                      className="py-2.5 bg-slate-900 hover:bg-slate-850 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <FileDown className="w-4 h-4 text-sky-400" />
                      <span>تنزيل وثيقة (A4 PDF)</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => handleDownloadPDFOnly('80mm')}
                      className="py-2.5 bg-slate-900 hover:bg-slate-850 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <FileDown className="w-4 h-4 text-emerald-400" />
                      <span>تنزيل إيصال (80 مم)</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handlePrint('a4')}
                      className="py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-extrabold transition-all flex items-center justify-center gap-1 cursor-pointer border border-slate-200"
                    >
                      <Printer className="w-3.5 h-3.5 text-slate-500" />
                      <span>طباعة A4 مباشر</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => handlePrint('80mm')}
                      className="py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-extrabold transition-all flex items-center justify-center gap-1 cursor-pointer border border-slate-200"
                    >
                      <Printer className="w-3.5 h-3.5 text-slate-500" />
                      <span>طباعة 80 مم حراري</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsWhatsAppModalOpen(true)}
                      className="py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100/80 rounded-lg text-[10px] font-black transition-all flex items-center justify-center gap-1 cursor-pointer border border-emerald-200"
                    >
                      <Send className="w-3.5 h-3.5 text-emerald-600" />
                      <span>مشاركة واتساب</span>
                    </button>
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}
      </main>

      {/* MODALS MODIFICATIONS PORTALS */}
      {isCompanyModalOpen && (
        <CompanyModal
          company={company}
          onSave={(updated) => {
            setCompany(updated);
            localStorage.setItem('quote_company_data_v2', JSON.stringify(updated));
            showToast("✓ تم حفظ هوية وإعدادات المنشأة بنجاح!");
          }}
          onClose={() => setIsCompanyModalOpen(false)}
        />
      )}

      {isWhatsAppModalOpen && (
        <WhatsAppModal 
          clientPhone={client.phone || ""}
          onGenerateAndShare={handleWhatsAppSharePDF}
          onClose={() => setIsWhatsAppModalOpen(false)}
        />
      )}

      {/* ========================================================= */}
      {/* HIDDEN INVOICE CANVAS FOR EXPORTING & CAPTURING & DIRECT PRINTING */}
      {/* ========================================================= */}
      <div className={`print:block ${customPrintMode === 'none' ? 'hidden' : 'block'} print-only`} style={{ direction: 'rtl' }}>
        <div id="printable-invoice-canvas" className="bg-white text-slate-905 w-full mx-auto" style={{ padding: '0px' }}>
          
          {/* A4 FORMAT LAYOUT TEMPLATE */}
          {(customPrintMode === 'none' || customPrintMode === 'a4') && (
            <div className="p-10 font-sans max-w-[800px] mx-auto text-right space-y-6" style={{ minHeight: '1050px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                
                {/* Header: Company Profile letterhead logo */}
                <div className="flex justify-between items-start border-b-2 border-slate-250 pb-6">
                  <div className="space-y-1.5">
                    <h1 className="text-xl font-black text-slate-900">{company.name}</h1>
                    <p className="text-xs text-slate-500 font-bold">{company.address}</p>
                    {company.regNumber && <p className="text-xs text-slate-500 font-medium">رقم السجل التجاري: DR. {company.regNumber}</p>}
                    {company.taxNumber && <p className="text-xs text-slate-500 font-medium">الرقم الضريبي الموحد للمنشأة: {company.taxNumber}</p>}
                    {company.phone && <p className="text-xs text-slate-500">الهاتف: {company.phone}</p>}
                    {company.email && <p className="text-xs text-slate-500">البريد الإلكتروني: {company.email}</p>}
                  </div>

                  <div className="flex flex-col items-center gap-2">
                    {company.logo ? (
                      <img src={company.logo} alt="Company Logo" className="max-w-36 max-h-20 object-contain rounded border border-slate-100 p-1" />
                    ) : (
                      <div className="w-16 h-16 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center">
                        <Briefcase className="w-8 h-8 text-slate-300" />
                      </div>
                    )}
                    <span className="text-[13px] bg-slate-100 text-slate-800 font-black px-3 py-1 rounded-md mt-1 block">عرض سعر معتمد</span>
                  </div>
                </div>

                {/* Sub-Header: Client detail and Quote meta dates */}
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-150 mt-4 text-xs">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold block">مقدم إلى العميل المستهدف:</span>
                    <span className="text-sm font-black text-slate-800 block">{client.name || "السادة الكرام / عميل معتمد"}</span>
                    {client.taxNumber && <p className="text-xs text-slate-600 font-mono">الرقم الضريبي للمشترك: {client.taxNumber}</p>}
                    {client.phone && <p className="text-xs text-slate-600">الهاتف: {client.phone}</p>}
                  </div>

                  <div className="space-y-1 text-left font-mono">
                    <p className="text-sm font-black text-slate-900 text-left">رقم الحجز: <span className="text-indigo-750">QT-{offerNumber}</span></p>
                    <p className="text-xs text-slate-500 text-left">التاريخ: {date || new Date().toISOString().split('T')[0]}</p>
                    <p className="text-xs text-slate-500 text-left">صلاحية العرض: {expireDate || 'يسري لمدة 30 يوماً'}</p>
                  </div>
                </div>

                {/* Items Formal Grid Table */}
                <table className="w-full text-right border-collapse text-xs mt-6">
                  <thead>
                    <tr className="border-b-2 border-slate-300 bg-slate-100 font-black text-slate-700">
                      <th className="p-2.5 text-center w-8">#</th>
                      {items.some(it => it.image) && <th className="p-2.5 text-center w-12">صورة</th>}
                      <th className="p-2.5 pr-2">اسم الصنف والموديل</th>
                      <th className="p-2.5 text-center w-24">السعر الفردي</th>
                      <th className="p-2.5 text-center w-12">الكمية</th>
                      <th className="p-2.5 text-center w-20">الخصم المباشر</th>
                      <th className="p-2.5 text-center w-16">ضريبة 15%</th>
                      <th className="p-2.5 text-center w-24">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 border-b-2 border-slate-300">
                    {items.map((item, idx) => {
                      const rowSubtotal = getRowSubtotal(item);
                      const rowTaxAmount = getRowTaxAmount(item);
                      const rowTotal = getRowTotal(item);

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/20">
                          <td className="p-2.5 text-center font-bold text-slate-400">{idx + 1}</td>
                          
                          {items.some(it => it.image) && (
                            <td className="p-2 text-center">
                              {item.image ? (
                                <img src={item.image} alt="row-thumb" className="w-8 h-8 object-contain rounded border border-slate-205 py-0.5" />
                              ) : (
                                <span className="text-slate-300 text-[9px]">-</span>
                              )}
                            </td>
                          )}

                          <td className="p-2.5 font-bold text-slate-800">
                            <span className="block leading-relaxed">{item.name || "صنف غير مسجل الاسم"}</span>
                            {item.description && <span className="text-[10px] text-slate-400 font-bold block mt-0.5">{item.description}</span>}
                          </td>

                          <td className="p-2.5 text-center font-mono">{item.price?.toFixed(2) || "0.00"} ر.س</td>
                          <td className="p-2.5 text-center font-mono font-bold text-slate-700">{item.quantity || 1}</td>
                          <td className="p-2.5 text-center font-mono">
                            {item.discountValue > 0 
                              ? `${item.discountValue} ${item.discountType === 'percent' ? '%' : 'ر.س'}` 
                              : "لا يوجد"
                            }
                          </td>
                          <td className="p-2.5 text-center font-mono">{rowTaxAmount.toFixed(2)} ر.س</td>
                          <td className="p-2.5 text-center font-mono font-black text-slate-850">{rowTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ر.س</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Subtotals & calculations output bottom template */}
                <div className="flex justify-between items-start pt-6 gap-6 text-xs">
                  <div className="flex-1 space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 block pb-1 border-b border-slate-150 font-sans">ملاحظات وشروط البيع:</span>
                    <p className="text-[11px] text-slate-600 leading-relaxed font-semibold whitespace-pre-line">{notes || "شروط عامة: يسري هذا العرض لمدة 30 يوماً من تاريخ الإصدار."}</p>
                  </div>

                  <div className="w-[300px] divide-y divide-slate-150 space-y-2 text-right">
                    <div className="flex justify-between pb-1.5 font-bold text-slate-500">
                      <span>مجموع الأصناف الصافي:</span>
                      <span className="font-mono">{subtotalBeforeTaxValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ر.س</span>
                    </div>

                    {globalDiscountValue > 0 && (
                      <div className="flex justify-between py-1.5 font-bold text-rose-600">
                        <span>الخصم الإضافي الإجمالي:</span>
                        <span className="font-mono">- {globalDiscountAmountValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ر.س</span>
                      </div>
                    )}

                    <div className="flex justify-between py-1.5 font-bold text-slate-650">
                      <span>الوعاء الخاضع للضريبة:</span>
                      <span className="font-mono">{subtotalAfterGlobalDiscountValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ر.س</span>
                    </div>

                    <div className="flex justify-between py-1.5 font-black text-slate-700 bg-slate-50 px-2 rounded-lg mt-1 border border-slate-150">
                      <span>ضريبة القيمة المضافة 15%:</span>
                      <span className="font-mono">{vatTaxTotalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ر.س</span>
                    </div>

                    <div className="flex justify-between pt-2.5 font-black text-slate-900 bg-indigo-50/40 p-2 rounded-lg">
                      <span className="text-[11px] font-bold">المبلغ الشامل النهائي:</span>
                      <span className="text-sm font-black font-mono text-emerald-800">{grandTotalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ر.س</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Bank accounts section and policy letterhead base footer */}
              <div className="border-t-2 border-slate-200 pt-6 mt-10">
                <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50/50 p-4 rounded-xl border border-dashed border-slate-250">
                  <div className="space-y-1 text-right">
                    <span className="text-[9px] font-black text-slate-400 block mb-1">تفاصيل الحوالة وقنوات السداد:</span>
                    <p className="font-bold text-slate-600">البنك المعتمد: {company.bankName || "البنك الأهلي السعودي (SNB)"}</p>
                    {company.accountNumber && <p className="font-bold text-slate-600 font-mono">رقم الحساب البنكي للمبيعات: {company.accountNumber}</p>}
                    {company.iban && <p className="font-black text-slate-700 font-mono">IBAN رقم الأيبان: {company.iban}</p>}
                  </div>

                  <div className="space-y-1 text-left flex flex-col justify-end">
                    <p className="text-[10px] text-indigo-850 font-black">شاكرين ومقدرين حسن تعاونكم معنا وثقتكم الغالية بمنتجاتنا.</p>
                    <p className="text-[9px] text-slate-400 font-bold">هذا المستند تم توليده رقمياً من نظام الفوترة المعتمد ولا يتطلب توقيع ورقي.</p>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* 80mm THERMAL RECEIPT FORMAT TEMPLATE */}
          {(customPrintMode === 'none' || customPrintMode === '80mm') && (
            <div className="p-4 font-sans text-right text-slate-900 max-w-[340px] mx-auto text-[11px] space-y-4" style={{ lineBreak: 'anywhere' }}>
              
              {/* Receipt Header details */}
              <div className="space-y-1 text-center border-b border-dashed border-slate-300 pb-3">
                <h2 className="text-sm font-black text-slate-900">{company.name}</h2>
                <p className="text-[9px] text-slate-500 font-bold">{company.address}</p>
                {company.taxNumber && <p className="text-[9px] text-slate-500 font-mono">ضريبة: {company.taxNumber}</p>}
                {company.regNumber && <p className="text-[9px] text-slate-500 font-mono">سجل: {company.regNumber}</p>}
                {company.phone && <p className="text-[9px] text-slate-550">تلفون: {company.phone}</p>}
                
                <span className="inline-block border border-slate-800 font-black text-[10px] px-2 py-0.5 mt-2 rounded">فاتورة عرض سعر حراري</span>
              </div>

              {/* Dates & Client Meta layout thermal */}
              <div className="space-y-1 text-[10px] border-b border-dashed border-slate-200 pb-2">
                <p className="font-mono"><strong>رقم العرض:</strong> QT-{offerNumber}</p>
                <p><strong>التاريخ:</strong> {date || new Date().toISOString().split('T')[0]}</p>
                <p><strong>العميل:</strong> {client.name || "عميل نقدي"}</p>
                {client.phone && <p className="font-mono"><strong>هاتف العميل:</strong> {client.phone}</p>}
                {client.taxNumber && <p className="font-mono"><strong>ضريبية المشترك:</strong> {client.taxNumber}</p>}
              </div>

              {/* Items lists for thermal print receipts */}
              <div className="space-y-1.5 border-b border-dashed border-slate-200 pb-2.5">
                <div className="flex justify-between items-center text-[9px] font-black text-slate-400 border-b border-slate-100 pb-1">
                  <span>الصنف</span>
                  <span>الإجمالي (شامل)</span>
                </div>

                {items.map((item, idx) => {
                  const rowTotal = getRowTotal(item);
                  return (
                    <div key={item.id} className="text-[10px] space-y-0.5">
                      <div className="flex justify-between items-start font-bold">
                        <span className="truncate max-w-[180px]">{idx + 1}. {item.name || "صنف افتراضي"}</span>
                        <span className="font-mono text-left">{rowTotal.toFixed(2)} ر.س</span>
                      </div>
                      <div className="text-[8.5px] text-slate-400 font-medium font-mono flex gap-1.5 items-center mr-2">
                        <span>{item.quantity || 1} حبة</span>
                        <span>×</span>
                        <span>{item.price?.toFixed(2) || "0.00"} ر.س</span>
                        {item.discountValue > 0 && (
                          <span className="text-rose-500">خصم: {item.discountValue}{item.discountType === 'percent' ? '%' : 'ر.س'}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Calculations summaries thermal blocks */}
              <div className="space-y-1 text-[10px]">
                <div className="flex justify-between font-bold text-slate-500">
                  <span>الإجمالي الصافي:</span>
                  <span className="font-mono">{subtotalBeforeTaxValue.toFixed(2)} ر.س</span>
                </div>

                {globalDiscountValue > 0 && (
                  <div className="flex justify-between font-bold text-rose-600">
                    <span>الخصم الخاص:</span>
                    <span className="font-mono">- {globalDiscountAmountValue.toFixed(2)} ر.س</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-650">
                  <span>المجموع الخاضع للضريبة:</span>
                  <span className="font-mono">{subtotalAfterGlobalDiscountValue.toFixed(2)} ر.س</span>
                </div>

                <div className="flex justify-between text-slate-650">
                  <span>ضريبة القيمة المضافة 15%:</span>
                  <span className="font-mono">{vatTaxTotalValue.toFixed(2)} ر.s</span>
                </div>

                <div className="flex justify-between font-black text-slate-900 border-t border-slate-405 pt-1.5 text-xs">
                  <span>المستحق النهائي:</span>
                  <span className="font-mono font-black">{grandTotalValue.toFixed(2)} ر.س</span>
                </div>
              </div>

              {/* Notes & financial banks thermal base layout */}
              <div className="text-[8.5px] text-slate-500 text-center space-y-1.5 border-t border-dashed border-slate-300 pt-3">
                <p className="font-semibold whitespace-pre-line leading-relaxed">{notes}</p>
                
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 space-y-0.5 text-right font-sans">
                  <p className="font-bold">تفاصيل الحساب البنكي المعتمد:</p>
                  <p>{company.bankName || "البنك الأهلي السعودي (SNB)"}</p>
                  <p className="font-mono">IBAN الأيبان: {company.iban}</p>
                </div>

                <p className="font-bold text-slate-400 mt-2">شكراً لثقتكم الغالية بنا • طبعت رقمياً</p>
              </div>

            </div>
          )}

        </div>
      </div>

    </div>
  );
}
