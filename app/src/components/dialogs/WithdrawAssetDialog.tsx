import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { X, Minus, ArrowDownRight } from 'lucide-react';
import { usePortfolio, useSettings, usePrice } from '@/context/hooks';
import { formatCurrency } from '@/lib/utils';
import { usePriceStore } from '@/store/usePriceStore';

interface WithdrawAssetDialogProps {
    isOpen: boolean;
    onClose: () => void;
    assetId: string | null;
}

export function WithdrawAssetDialog({ isOpen, onClose, assetId }: WithdrawAssetDialogProps) {
    const { t } = useTranslation();
    const { settings } = useSettings();
    const { convert } = usePrice();
    const { assets, updateAsset, removeAsset, addAsset, addTransaction } = usePortfolio();

    const userCurrency = settings.currency || 'USD';

    const [quantity, setQuantity] = useState('');
    const [price, setPrice] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const asset = assets.find((a) => a.id === assetId);

    useEffect(() => {
        if (isOpen && asset) {
            // Asset currentPrice is in USD, convert to user currency for the input
            const convertedPrice = convert(asset.currentPrice, userCurrency);
            setPrice(convertedPrice.toString());
            setQuantity('');
        } else if (!isOpen) {
            setQuantity('');
            setPrice('');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, asset?.id, userCurrency]);

    const handleClose = () => {
        setQuantity('');
        onClose();
    };

    const handleWithdraw = async () => {
        if (!asset) return;

        if (!quantity || !price) {
            toast.error(t('withdrawDialog.fillAllFields'));
            return;
        }

        const withdrawQty = parseFloat(quantity);
        const withdrawPxInUserCurrency = parseFloat(price);

        if (withdrawQty <= 0 || withdrawPxInUserCurrency <= 0) {
            toast.error(t('withdrawDialog.qtyAndPricePositive'));
            return;
        }

        if (withdrawQty > asset.quantity) {
            toast.error(t('withdrawDialog.qtyExceeds', { max: asset.quantity }));
            return;
        }

        setIsProcessing(true);

        try {
            // Convert price back to USD for internal calculations/storage
            const withdrawPx = userCurrency === 'USD' ? withdrawPxInUserCurrency : withdrawPxInUserCurrency / (usePriceStore.getState().exchangeRates[userCurrency] || 1);
            
            const saleValue = withdrawQty * withdrawPx;
            const remainingQty = asset.quantity - withdrawQty;
            const usdCashAsset = assets.find((item) => item.symbol.toUpperCase() === 'USD');

            if (withdrawQty === asset.quantity) {
                await removeAsset(asset.id);
            } else {
                await updateAsset(asset.id, {
                    quantity: remainingQty,
                    value: remainingQty * asset.currentPrice,
                });
            }

            if (usdCashAsset) {
                const nextCashQuantity = usdCashAsset.quantity + saleValue;
                await updateAsset(usdCashAsset.id, {
                    quantity: nextCashQuantity,
                    avgPrice: 1,
                    currentPrice: 1,
                    value: nextCashQuantity,
                    change24h: 0,
                    change24hPercent: 0,
                    change24hValue: 0,
                });
            } else {
                await addAsset({
                    symbol: 'USD',
                    name: 'US Dollar Cash',
                    type: 'forex',
                    quantity: saleValue,
                    avgPrice: 1,
                    currentPrice: 1,
                    value: saleValue,
                    change24h: 0,
                    change24hPercent: 0,
                    change24hValue: 0,
                    allocation: 0,
                });
            }

            await addTransaction({
                type: 'sell',
                amount: saleValue,
                asset: asset.symbol,
                symbol: asset.symbol,
                timestamp: new Date(),
                price: withdrawPx,
                quantity: withdrawQty,
                fee: 0,
            });

            toast.success(t('withdrawDialog.soldSuccess', { qty: withdrawQty, symbol: asset.symbol }));
            handleClose();
        } catch {
            toast.error(t('common.error'));
        } finally {
            setIsProcessing(false);
        }
    };

    if (!isOpen || !asset) return null;

    const withdrawQtyNum = parseFloat(quantity || '0');
    const withdrawPxNum = parseFloat(price || '0');
    const estimatedReturn = withdrawQtyNum * withdrawPxNum;

    return (
        <AnimatePresence>
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
                style={{ pointerEvents: 'none' }}
            >
                <div
                    className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden pointer-events-auto border border-white/10"
                >
                    {/* Header */}
                    <div className="relative p-6 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 border-b border-red-100 dark:border-red-900/30">
                        <button
                            onClick={handleClose}
                            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white dark:bg-slate-800 text-gray-500 hover:text-gray-900 dark:hover:text-white shadow-sm transition-colors"
                        >
                            <X size={18} />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg shadow-red-500/20">
                                <ArrowDownRight className="text-white" size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('withdrawDialog.title')}</h2>
                                <p className="text-sm text-gray-500 dark:text-slate-400">{t('withdrawDialog.removeFromPortfolio', { symbol: asset.symbol })}</p>
                            </div>
                        </div>
                    </div>

                    {/* Form */}
                    <div className="p-6 space-y-5">
                        <div className="p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl flex justify-between items-center border border-gray-100 dark:border-slate-700">
                            <div>
                                <p className="text-xs text-gray-500 dark:text-slate-400">{t('withdrawDialog.asset')}</p>
                                <p className="font-bold text-lg dark:text-white">{asset.symbol}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-500 dark:text-slate-400">{t('withdrawDialog.availableQty')}</p>
                                <p className="font-semibold text-gray-900 dark:text-slate-200">{asset.quantity} {asset.symbol}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                    {t('withdrawDialog.withdrawQty')}
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={quantity}
                                        onChange={(e) => setQuantity(e.target.value)}
                                        placeholder="0.00"
                                        step="any"
                                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-950 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all font-medium dark:text-white"
                                    />
                                    <button
                                        onClick={() => setQuantity(asset.quantity.toString())}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs font-semibold text-red-600 bg-red-100 dark:bg-red-900/30 rounded-md hover:bg-red-200 dark:hover:bg-red-900/50"
                                    >
                                        MAX
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                    Price ({userCurrency})
                                </label>
                                <input
                                    type="number"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    placeholder="0.00"
                                    step="any"
                                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-950 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all dark:text-white"
                                />
                            </div>
                        </div>

                        <div className="p-4 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700">
                            <div className="flex justify-between items-center mb-1 text-sm">
                                <span className="text-gray-500 dark:text-slate-400">{t('withdrawDialog.estimatedValue')}</span>
                                <span className="font-bold text-gray-900 dark:text-white tabular-nums">
                                    {formatCurrency(estimatedReturn, userCurrency)}
                                </span>
                            </div>
                        </div>

                        <button
                            onClick={handleWithdraw}
                            disabled={isProcessing}
                            className="w-full py-3.5 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-lg shadow-red-500/20"
                        >
                            {isProcessing ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    {t('withdrawDialog.processing')}
                                </>
                            ) : (
                                <>
                                    <Minus size={18} />
                                    {t('withdrawDialog.confirmWithdraw')}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
