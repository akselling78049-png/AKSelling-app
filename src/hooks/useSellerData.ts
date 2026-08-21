import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { Product, Order, OrderItem, ReturnRecord, SellerBusinessProfile, SellerBankDetails } from '@/types';

interface SellerData {
  products: Product[];
  orders: (Order & { items?: OrderItem[] })[];
  returns: (ReturnRecord & { order?: Order })[];
  businessProfile: SellerBusinessProfile | null;
  bankDetails: SellerBankDetails | null;
  loading: boolean;
  reload: () => Promise<void>;
  reloadBusiness: () => Promise<void>;
}

export function useSellerData(): SellerData {
  const { profile } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<(Order & { items?: OrderItem[] })[]>([]);
  const [returns, setReturns] = useState<(ReturnRecord & { order?: Order })[]>([]);
  const [businessProfile, setBusinessProfile] = useState<SellerBusinessProfile | null>(null);
  const [bankDetails, setBankDetails] = useState<SellerBankDetails | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);

    const { data: productRows } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    setProducts((productRows ?? []) as Product[]);

    const { data: orderRows } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    let ordersWithItems: (Order & { items?: OrderItem[] })[] = [];
    if (orderRows && orderRows.length > 0) {
      const orderIds = orderRows.map((o) => o.id);
      const { data: itemRows } = await supabase
        .from('order_items')
        .select('*')
        .in('order_id', orderIds);

      const itemsByOrder = (itemRows ?? []).reduce<Record<string, OrderItem[]>>((acc, item) => {
        const key = (item as OrderItem).order_id;
        (acc[key] ??= []).push(item as OrderItem);
        return acc;
      }, {});

      ordersWithItems = orderRows.map((o) => ({ ...(o as Order), items: itemsByOrder[o.id] ?? [] }));
    }
    setOrders(ordersWithItems);

    const { data: returnRows } = await supabase
      .from('returns')
      .select('*, order:orders(*)')
      .order('created_at', { ascending: false });
    setReturns((returnRows ?? []) as (ReturnRecord & { order?: Order })[]);

    setLoading(false);
  }, []);

  const loadBusiness = useCallback(async () => {
    if (!profile?.id) return;
    const { data: biz } = await supabase
      .from('seller_business_profiles')
      .select('*')
      .eq('user_id', profile.id)
      .maybeSingle();
    setBusinessProfile(biz as SellerBusinessProfile | null);

    const { data: bank } = await supabase
      .from('seller_bank_details')
      .select('*')
      .eq('user_id', profile.id)
      .maybeSingle();
    setBankDetails(bank as SellerBankDetails | null);
  }, [profile?.id]);

  useEffect(() => {
    if (profile?.role === 'seller') {
      loadData();
      loadBusiness();
    }
  }, [profile?.role, loadData, loadBusiness]);

  return {
    products,
    orders,
    returns,
    businessProfile,
    bankDetails,
    loading,
    reload: loadData,
    reloadBusiness: loadBusiness,
  };
}
