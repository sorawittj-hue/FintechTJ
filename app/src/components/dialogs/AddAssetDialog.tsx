import { motion, AnimatePresence } from 'framer-motion';
import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
    X,
    Briefcase,
    Bitcoin,
    Building2,
    Droplet,
    DollarSign,
    Plus,
    Search,
    Loader2
} from 'lucide-react';
import { usePortfolio, useSettings, usePrice } from '@/context/hooks';
import {
    fetchCommodityPrices,
    fetchCryptoPrices,
    fetchForexRates,
    fetchStockQuote,
} from '@/services/realDataService';
import { formatCurrency } from '@/lib/utils';

interface AddAssetDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AddAssetDialog({ isOpen, onClose }: AddAssetDialogProps) {
    const { t } = useTranslation();
    const { settings } = useSettings();
    const { convert } = usePrice();
    const { addAsset, assets, updateAsset, addTransaction } = usePortfolio();

    const userCurrency = settings.currency || 'USD';

    const [type, setType] = useState<'crypto' | 'stock' | 'commodity' | 'forex'>('crypto');
    const [symbol, setSymbol] = useState('');
    const [name, setName] = useState('');
    const [quantity, setQuantity] = useState('');
    const [avgPrice, setAvgPrice] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isFetchingPrice, setIsFetchingPrice] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);

    // ตรวจสอบ symbol ซ้ำ
    const existingAsset = useMemo(() => {
        if (!symbol) return null;
        return assets.find(a => a.symbol.toUpperCase() === symbol.toUpperCase());
    }, [symbol, assets]);

    const resetForm = () => {
        setType('crypto');
        setSymbol('');
        setName('');
        setQuantity('');
        setAvgPrice('');
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const fetchQuoteByType = async () => {
        const normalizedSymbol = symbol.toUpperCase();

        if (type === 'crypto') {
            const [price] = await fetchCryptoPrices([normalizedSymbol]);
            if (!price) return null;
            return {
                price: price.price,
                name: price.name || normalizedSymbol,
                change24h: price.change24h,
                change24hPercent: price.change24hPercent,
            };
        }

        if (type === 'stock') {
            const stock = await fetchStockQuote(normalizedSymbol);
            if (!stock) return null;
            return {
                price: stock.price,
                name: stock.name || normalizedSymbol,
                change24h: stock.change,
                change24hPercent: stock.changePercent,
            };
        }

        if (type === 'commodity') {
            const commodities = await fetchCommodityPrices();
            const commodity = commodities.find((item) => item.symbol.toUpperCase() === normalizedSymbol || item.name.toUpperCase().includes(normalizedSymbol));
            if (!commodity) return null;
            return {
                price: commodity.price,
                name: commodity.name,
                change24h: commodity.change24h,
                change24hPercent: commodity.change24hPercent,
            };
        }

        const forexRates = await fetchForexRates();
        const rate = forexRates.find((item) => item.symbol.toUpperCase() === normalizedSymbol || item.name.replace('/', '').toUpperCase() === normalizedSymbol);
        if (!rate) return null;
        return {
            price: rate.rate,
            name: rate.name,
            change24h: rate.change24h,
            change24hPercent: rate.change24hPercent,
        };
    };

    const fetchCurrentPrice = async () => {
        if (!symbol) {
            toast.error(t('addAssetDialog.enterSymbolFirst'));
            return;
        }
        
        setIsFetchingPrice(true);
        setFetchError(null);
        
        try {
            const quote = await fetchQuoteByType();
            if (quote) {
                // Price from API is in USD, convert to user currency for the input
                const convertedPrice = convert(quote.price, userCurrency);
                setAvgPrice(convertedPrice.toString());
                if (!name.trim()) {
                    setName(quote.name);
                }
                toast.success(t('addAssetDialog.fetchedPrice', { 
                    symbol: symbol.toUpperCase(), 
                    price: formatCurrency(convertedPrice, userCurrency) 
                }));
            } else {
                setFetchError(t('addAssetDialog.priceNotFound'));
                toast.warning(t('addAssetDialog.priceNotFound'));
            }
        } catch {
            setFetchError(t('addAssetDialog.cannotFetchPrice'));
            toast.error(t('addAssetDialog.cannotFetchPrice'));
        } finally {
            setIsFetchingPrice(false);
        }
    };

    const handleAddAsset = async () => {
        if (!symbol || !name || !quantity || !avgPrice) {
            toast.error(t('addAssetDialog.fillAllFields'));
            return;
        }

        const qtyNum = parseFloat(quantity);
        const pxNumInUserCurrency = parseFloat(avgPrice);

        if (isNaN(qtyNum) || isNaN(pxNumInUserCurrency)) {
            toast.error(t('addAssetDialog.qtyAndPriceMustBeNumber'));
            return;
        }

        if (qtyNum <= 0 || pxNumInUserCurrency <= 0) {
            toast.error(t('addAssetDialog.qtyAndPricePositive'));
            return;
        }

        // Convert back to USD for storage
        const pxNum = userCurrency === 'USD' ? pxNumInUserCurrency : pxNumInUserCurrency / (usePriceStore.getState().exchangeRates[userCurrency] || 1);

        // ตรวจสอบ symbol ซ้ำ
        const duplicateAsset = assets.find(a => a.symbol.toUpperCase() === symbol.toUpperCase());
        if (duplicateAsset) {
            toast.error(t('addAssetDialog.assetAlreadyExists', { symbol: symbol.toUpperCase() }));
            return;
        }

        setIsProcessing(true);

        try {
            let currentPrice = pxNum;
            let change24h = 0;
            let change24hPercent = 0;
            let resolvedName = name;
            
            try {
                const liveQuote = await fetchQuoteByType();
                if (liveQuote) {
                    currentPrice = liveQuote.price;
                    change24h = liveQuote.change24h;
                    change24hPercent = liveQuote.change24hPercent;
                    resolvedName = liveQuote.name || name;
                }
            } catch {
                // ถ้าดึงไม่ได้ ใช้ราคาเฉลี่ยที่กรอก
            }

            const totalValue = qtyNum * currentPrice;
            const change24hValue = totalValue * (change24hPercent / 100);
            const normalizedSymbol = symbol.toUpperCase();
            const usdCashAsset = assets.find((asset) => asset.symbol.toUpperCase() === 'USD');

            if (usdCashAsset && usdCashAsset.value >= totalValue) {
                const nextCashQuantity = usdCashAsset.quantity - totalValue;

                if (nextCashQuantity <= 0.000001) {
                    await updateAsset(usdCashAsset.id, {
                        quantity: 0,
                        avgPrice: 1,
                        currentPrice: 1,
                        value: 0,
                        change24h: 0,
                        change24hPercent: 0,
                        change24hValue: 0,
                    });
                } else {
                    await updateAsset(usdCashAsset.id, {
                        quantity: nextCashQuantity,
                        avgPrice: 1,
                        currentPrice: 1,
                        value: nextCashQuantity,
                        change24h: 0,
                        change24hPercent: 0,
                        change24hValue: 0,
                    });
                }
            }

            await addAsset({
                symbol: normalizedSymbol,
                name: resolvedName,
                type,
                quantity: qtyNum,
                avgPrice: pxNum,
                currentPrice,
                value: totalValue,
                change24h,
                change24hPercent,
                change24hValue,
                allocation: 0
            });

            await addTransaction({
                type: 'buy',
                amount: qtyNum * pxNum,
                asset: normalizedSymbol,
                symbol: normalizedSymbol,
                timestamp: new Date(),
                price: pxNum,
                quantity: qtyNum,
                fee: 0,
            });

            handleClose();
        } catch {
            toast.error(t('addAssetDialog.errorTryAgain'));
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 flex items-center justify-center z-50 p-4"
                    >
                        <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
                            {/* Header */}
                            <div className="relative p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-800 dark:to-slate-900 border-b border-gray-200 dark:border-slate-800">
                                <button
                                    onClick={handleClose}
                                    className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white dark:bg-slate-800 text-gray-500 hover:text-gray-900 dark:hover:text-white shadow-sm transition-colors"
                                >
                                    <X size={18} />
                                </button>
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#ee7d54] to-[#f59e0b] flex items-center justify-center shadow-lg shadow-[#ee7d54]/20">
                                        <Briefcase className="text-white" size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('addAssetDialog.title')}</h2>
                                        <p className="text-sm text-gray-500 dark:text-slate-400">{t('addAssetDialog.subtitle')}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Form */}
                            <div className="p-6 space-y-5">
                                {/* Type Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                        {t('addAssetDialog.assetType')}
                                    </label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {[
                                            { id: 'crypto', label: 'Crypto', icon: Bitcoin },
                                            { id: 'stock', label: 'Stock', icon: Building2 },
                                            { id: 'commodity', label: 'Commodity', icon: Droplet },
                                            { id: 'forex', label: 'Forex', icon: DollarSign },
                                        ].map((t) => (
                                            <button
                                                key={t.id}
                                                onClick={() => setType(t.id as typeof type)}
                                                className={`flex flex-col items-center gap-1.5 py-3 px-1 rounded-xl border-2 transition-all ${type === t.id
                                                    ? 'border-[#ee7d54] bg-orange-50 dark:bg-orange-500/10 text-[#ee7d54]'
                                                    : 'border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-800 text-gray-500 hover:border-gray-200 dark:hover:border-slate-700'
                                                    }`}
                                            >
                                                <t.icon size={18} />
                                                <span className="text-[10px] font-semibold">{t.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {existingAsset && (
                                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-xl">
                                        <p className="text-sm text-red-600 dark:text-red-400">
                                            {t('addAssetDialog.existingAssetWarning', { symbol: symbol.toUpperCase(), qty: existingAsset.quantity })}
                                        </p>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                            {t('addAssetDialog.symbol')}
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={symbol}
                                                onChange={(e) => {
                                                    setSymbol(e.target.value.toUpperCase());
                                                    setFetchError(null);
                                                }}
                                                placeholder="e.g. BTC"
                                                className="w-full px-4 py-2.5 pr-10 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-950 focus:outline-none focus:border-[#ee7d54] focus:ring-2 focus:ring-[#ee7d54]/20 transition-all font-medium uppercase dark:text-white"
                                            />
                                            <button
                                                onClick={fetchCurrentPrice}
                                                disabled={isFetchingPrice || !symbol}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-[#ee7d54] disabled:opacity-50 transition-colors"
                                                title={t('addAssetDialog.fetchCurrentPrice')}
                                            >
                                                {isFetchingPrice ? (
                                                    <Loader2 size={16} className="animate-spin" />
                                                ) : (
                                                    <Search size={16} />
                                                )}
                                            </button>
                                        </div>
                                        {fetchError && (
                                            <p className="text-xs text-red-500 mt-1">{fetchError}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                            {t('addAssetDialog.assetName')}
                                        </label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="e.g. Bitcoin"
                                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-950 focus:outline-none focus:border-[#ee7d54] focus:ring-2 focus:ring-[#ee7d54]/20 transition-all dark:text-white"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                            {t('addAssetDialog.quantity')}
                                        </label>
                                        <input
                                            type="number"
                                            value={quantity}
                                            onChange={(e) => setQuantity(e.target.value)}
                                            placeholder="0.00"
                                            step="any"
                                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-950 focus:outline-none focus:border-[#ee7d54] focus:ring-2 focus:ring-[#ee7d54]/20 transition-all dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                            Price ({userCurrency})
                                        </label>
                                        <input
                                            type="number"
                                            value={avgPrice}
                                            onChange={(e) => setAvgPrice(e.target.value)}
                                            placeholder="0.00"
                                            step="any"
                                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-950 focus:outline-none focus:border-[#ee7d54] focus:ring-2 focus:ring-[#ee7d54]/20 transition-all dark:text-white"
                                        />
                                    </div>
                                </div>

                                {/* Summary */}
                                <div className="bg-orange-50 dark:bg-orange-500/5 rounded-xl p-4 flex flex-col items-center justify-center border border-orange-100/50 dark:border-orange-500/20">
                                    <p className="text-xs text-orange-600 dark:text-orange-400 font-medium mb-1">{t('addAssetDialog.totalValue')}</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">
                                        {formatCurrency(parseFloat(quantity || '0') * parseFloat(avgPrice || '0'), userCurrency)}
                                    </p>
                                    <p className="text-[10px] text-gray-500 dark:text-slate-500 mt-1 uppercase tracking-wider font-bold">
                                        Qty: {quantity || '0'} × {formatCurrency(parseFloat(avgPrice || '0'), userCurrency)}
                                    </p>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-6 bg-gray-50 dark:bg-slate-800/50 border-t border-gray-100 dark:border-slate-800 flex gap-3">
                                <button
                                    onClick={handleClose}
                                    className="flex-1 py-3 px-4 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                                >
                                    {t('addAssetDialog.cancel')}
                                </button>
                                <button
                                    onClick={handleAddAsset}
                                    disabled={isProcessing || !symbol || !name || !quantity || !avgPrice || !!existingAsset}
                                    className="flex-[2] py-3 px-4 bg-gradient-to-r from-[#ee7d54] to-[#f59e0b] text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-[#ee7d54]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isProcessing ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <Plus size={18} />
                                            {t('addAssetDialog.addToPortfolio')}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

// Ensure usePriceStore is imported for manual conversion in handleAddAsset
import { usePriceStore } from '@/store/usePriceStore';
