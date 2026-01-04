import React, { useState, useEffect } from 'react';
import { ArrowRightLeft, Coins, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CurrencyWidgetProps {
    rate?: number;
    currencyCode: string; // e.g. "JPY"
}

export const CurrencyWidget: React.FC<CurrencyWidgetProps> = ({ rate: initialRate, currencyCode }) => {
    const [amount, setAmount] = useState<string>('');
    const [exchangeRate, setExchangeRate] = useState<number>(initialRate || 0.21);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch rate logic
    useEffect(() => {
        const fetchRate = async () => {
            if (!currencyCode || currencyCode.length !== 3 || currencyCode === 'CUR') return;

            setIsLoading(true);
            try {
                // Fetch TWD base
                const res = await fetch(`https://open.er-api.com/v6/latest/TWD`);
                const data = await res.json();

                // 1 TWD = X Target => 1 Target = 1/X TWD
                const rateToTarget = data.rates[currencyCode.toUpperCase()];
                if (rateToTarget) {
                    const priceInTwd = 1 / rateToTarget;
                    setExchangeRate(priceInTwd);
                }
            } catch (e) {
                console.error("Rate fetch failed", e);
            } finally {
                setIsLoading(false);
            }
        };

        fetchRate();
    }, [currencyCode]);

    const targetVal = amount ? parseFloat(amount) : 1000;
    const calculated = (targetVal * exchangeRate).toFixed(0);

    return (
        <div className="h-full p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-lg shadow-slate-200 flex flex-col relative overflow-hidden group">
            {/* Loading Indicator */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {isLoading && <RefreshCw className="animate-spin text-slate-500" size={10} />}
            </div>

            <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5 text-slate-300 text-[10px] font-bold uppercase tracking-wider">
                    <Coins size={12} />
                    <span>匯率計算</span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                    1 {currencyCode} ≈ {exchangeRate.toFixed(3)} TWD
                </div>
            </div>

            <div className="flex-1 flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-0.5">
                        <span className="text-xs font-medium text-slate-500">{currencyCode === 'JPY' ? '¥' : '$'}</span>
                        <input
                            type="text"
                            inputMode="decimal"
                            value={amount ? parseFloat(amount).toLocaleString() : ''}
                            onChange={(e) => {
                                const val = e.target.value.replace(/,/g, '');
                                if (!isNaN(Number(val)) && val !== '') {
                                    setAmount(val);
                                } else if (val === '') {
                                    setAmount('');
                                }
                            }}
                            placeholder="1,000"
                            className={cn(
                                "w-full bg-transparent border-none font-bold placeholder-slate-700 text-white focus:outline-none p-0 tracking-tight font-mono transition-all duration-200",
                                (amount?.length || 0) >= 8 ? "text-lg" :
                                    (amount?.length || 0) >= 6 ? "text-xl" :
                                        "text-2xl"
                            )}
                        />
                    </div>
                </div>

                <ArrowRightLeft size={14} className="text-slate-600 shrink-0" />

                <div className="flex-1 min-w-0 text-right">
                    <div className="flex items-baseline justify-end gap-0.5">
                        <span className="text-xs font-medium text-slate-500">NT$</span>
                        <span className={cn(
                            "font-bold text-emerald-400 tracking-tight truncate font-mono transition-all duration-200",
                            calculated.length >= 8 ? "text-lg" :
                                calculated.length >= 6 ? "text-xl" :
                                    "text-2xl"
                        )}>
                            {calculated}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};
