
export type Page = 'landing' | 'searchResults' | 'propertyDetails' | 'confirmAndPay' | 'ownerDashboard' | 'tenantDashboard' | 'adminDashboard' | 'login' | 'signup' | 'paymentVerification' | 'myListings' | 'bookings' | 'payments' | 'messages';

export enum ListingStatus {
  Listed = 'Listed',
  Unlisted = 'Unlisted',
}

export interface Listing {
  id: string | number;
  name: string;
  details: string;
  imageUrl: string;
  location: string;
  status: ListingStatus;
  rating?: number;
  price?: string;
  priceValue?: number;
}

// Supabase property types
export interface Property {
  id: string;
  title: string;
  location: string;
  price_per_night: number;
  images: string[];
  rating?: number;
}

export enum StatChangeDirection {
    Increase = 'increase',
    Decrease = 'decrease',
}

export interface StatCardData {
    title: string;
    value: string;
    change?: string;
    changeDirection?: StatChangeDirection;
    changeColorClass?: string;
}