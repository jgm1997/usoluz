export type PriceClassification = "cheap" | "normal" | "expensive";

export interface PriceItem {
  datetime_utc: string;
  value_mwh: number;
  value_kwh: number;
  provider: string;
  classification: PriceClassification;
}

export interface DayPrices {
  date: string;
  provider: string;
  prices: PriceItem[];
  cheapest_hour: PriceItem;
  most_expensive_hour: PriceItem;
}

export interface CurrentPrice {
  datetime_utc: string;
  value_kwh: number;
  provider: string;
  classification: PriceClassification;
}
