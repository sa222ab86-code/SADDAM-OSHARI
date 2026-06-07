import { QuoteItem } from '../types';

export const getRowSubtotal = (item: QuoteItem): number => {
  if (!item) return 0;
  const base = (item.price || 0) * (item.quantity || 0);
  const discount = item.discountType === 'percent' 
    ? base * ((item.discountValue || 0) / 100) 
    : (item.discountValue || 0);
  return Math.max(0, base - discount);
};

export const getRowTaxAmount = (item: QuoteItem): number => {
  if (!item) return 0;
  const subtotal = getRowSubtotal(item);
  return subtotal * ((item.taxRate || 0) / 100);
};

export const getRowTotal = (item: QuoteItem): number => {
  if (!item) return 0;
  return getRowSubtotal(item) + getRowTaxAmount(item);
};

export const getSubtotalBeforeTax = (items: QuoteItem[]): number => {
  return items.reduce((sum, item) => sum + getRowSubtotal(item), 0);
};

export const getGlobalDiscountAmount = (
  items: QuoteItem[], 
  globalDiscountValue: number, 
  globalDiscountType: 'percent' | 'fixed'
): number => {
  const sub = getSubtotalBeforeTax(items);
  return globalDiscountType === 'percent'
    ? sub * (globalDiscountValue / 100)
    : globalDiscountValue;
};

export const getSubtotalAfterGlobalDiscount = (
  items: QuoteItem[], 
  globalDiscountValue: number, 
  globalDiscountType: 'percent' | 'fixed'
): number => {
  return Math.max(0, getSubtotalBeforeTax(items) - getGlobalDiscountAmount(items, globalDiscountValue, globalDiscountType));
};

export const getVatTaxTotal = (
  items: QuoteItem[], 
  globalDiscountValue: number, 
  globalDiscountType: 'percent' | 'fixed'
): number => {
  const base = getSubtotalAfterGlobalDiscount(items, globalDiscountValue, globalDiscountType);
  return base * 0.15; // Standard 15% VAT
};

export const getGrandTotal = (
  items: QuoteItem[], 
  globalDiscountValue: number, 
  globalDiscountType: 'percent' | 'fixed'
): number => {
  return getSubtotalAfterGlobalDiscount(items, globalDiscountValue, globalDiscountType) + 
         getVatTaxTotal(items, globalDiscountValue, globalDiscountType);
};
