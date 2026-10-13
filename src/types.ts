export interface Product {
  id: string;
  name: string;
  buy_url: string;
  category: string;
  price?: string;
  description?: string;
  badge?: string;
  image: string;
  alt?: string;
  created_at?: number;
}
