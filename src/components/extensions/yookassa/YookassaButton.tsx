import React from 'react';
import { useYookassa, YookassaPayload } from './useYookassa';
import Icon from '@/components/ui/icon';

interface YookassaButtonProps extends YookassaPayload {
  apiUrl: string;
  buttonText?: string;
  className?: string;
  disabled?: boolean;
}

export function YookassaButton({
  apiUrl,
  buttonText = 'Оплатить',
  className = '',
  disabled = false,
  ...payload
}: YookassaButtonProps) {
  const { pay, loading, error } = useYookassa(apiUrl);

  return (
    <div className="flex flex-col gap-2 w-full">
      <button
        onClick={() => pay(payload)}
        disabled={disabled || loading}
        className={`flex items-center justify-center gap-2 w-full py-3 px-6 rounded-2xl font-bold text-white transition-all active:scale-95 disabled:opacity-50 ${className}`}
        style={{ background: 'linear-gradient(135deg, #5B45FF, #8C58FF)' }}
      >
        {loading ? (
          <>
            <Icon name="Loader2" size={18} className="animate-spin" />
            Подождите...
          </>
        ) : (
          <>
            <Icon name="CreditCard" size={18} />
            {buttonText}
          </>
        )}
      </button>
      {error && (
        <p className="text-red-400 text-xs text-center">{error}</p>
      )}
    </div>
  );
}
