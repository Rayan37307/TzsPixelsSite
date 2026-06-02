import axios from 'axios';

const BASE_URL = 'https://api.bdcourier.com/courier-check';

export interface CourierSummary {
  total_parcel: number;
  success_parcel: number;
  cancelled_parcel: number;
  success_ratio: number;
}

export interface CourierReport {
  id: string;
  name: string;
  details: string;
  created_at: string;
  courierLogo: string;
  courierName: string;
}

export interface CourierData {
  summary: CourierSummary;
  reports: CourierReport[];
  couriers: Record<string, any>;
}

export function isConfigured(): boolean {
  return !!process.env.BDCOURIER_API_KEY;
}

// Normalize a phone number to Bangladeshi local format 01XXXXXXXXX (11 digits).
// Returns null if a valid local number can't be derived.
export function normalizeBdPhone(phone: string): string | null {
  if (!phone) return null;
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('880')) digits = digits.slice(3);
  if (digits.length === 10 && digits.startsWith('1')) digits = '0' + digits;
  if (digits.length === 11 && digits.startsWith('01')) return digits;
  return null;
}

export async function checkCourier(phone: string): Promise<CourierData> {
  const apiKey = process.env.BDCOURIER_API_KEY;
  if (!apiKey) {
    throw new Error('BDCourier not configured');
  }

  let response;
  try {
    response = await axios.post(
      BASE_URL,
      { phone },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );
  } catch (error: any) {
    console.error('[BDCourier] Request error:', error.response?.data || error.message);
    throw new Error(`BDCourier request failed: ${error.response?.data?.message || error.message}`);
  }

  const payload = response.data;
  if (!payload || payload.status !== 'success' || !payload.data) {
    throw new Error(`BDCourier returned non-success: ${payload?.message || 'unknown'}`);
  }

  const { summary, ...couriers } = payload.data;
  return {
    summary: {
      total_parcel: Number(summary?.total_parcel) || 0,
      success_parcel: Number(summary?.success_parcel) || 0,
      cancelled_parcel: Number(summary?.cancelled_parcel) || 0,
      success_ratio: Number(summary?.success_ratio) || 0,
    },
    reports: Array.isArray(payload.reports) ? payload.reports : [],
    couriers,
  };
}
