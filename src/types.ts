/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface CompanyInfo {
  name: string;
  address: string;
  taxNumber: string;
  regNumber: string;
  phone: string;
  email: string;
  bankName: string;
  accountNumber: string;
  iban: string;
  logo: string;
}

export interface ClientInfo {
  name: string;
  taxNumber: string;
  phone: string;
}

export interface QuoteItem {
  id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  discountValue: number;
  discountType: 'percent' | 'fixed';
  taxRate: number;
  image: string;
}

export interface Quote {
  id: string; // internal tracking
  offerNumber: string;
  date: string;
  expireDate: string;
  clientInfo: ClientInfo;
  items: QuoteItem[];
  notes: string;
  globalDiscountValue: number;
  globalDiscountType: 'percent' | 'fixed';
}

export interface Product {
  name: string;
  price: number;
}
