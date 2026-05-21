import { useState } from 'react';

export interface YookassaPayload {
  amount: number;
  description: string;
  userEmail?: string;
  returnUrl: string;
  metadata?: Record<string, string>;
}

export interface YookassaResult {
  paymentId: string;
  paymentUrl: string;
  status: string;
}

export function useYookassa(apiUrl: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPayment = async (payload: YookassaPayload): Promise<YookassaResult | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: payload.amount,
          description: payload.description,
          user_email: payload.userEmail ?? '',
          return_url: payload.returnUrl,
          metadata: payload.metadata ?? {}
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Ошибка создания платежа');
      return {
        paymentId: data.paymentId ?? data.payment_id,
        paymentUrl: data.paymentUrl ?? data.payment_url,
        status: data.status,
      } as YookassaResult;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Неизвестная ошибка');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const pay = async (payload: YookassaPayload) => {
    const result = await createPayment(payload);
    if (result?.paymentUrl) {
      window.location.href = result.paymentUrl;
    }
    return result;
  };

  return { pay, createPayment, loading, error };
}