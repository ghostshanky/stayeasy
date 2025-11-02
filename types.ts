export type Page = 'landing' | 'searchResults' | 'propertyDetails' | 'confirmAndPay' | 'ownerDashboard' | 'tenantDashboard' | 'login' | 'signup';

export enum ListingStatus {
  Listed = 'Listed',
  Unlisted = 'Unlisted',
}

export interface Listing {
  id: number;
  name: string;
  details: string;
  imageUrl: string;
  location: string;
  status: ListingStatus;
  rating?: number;
  price?: string;
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
