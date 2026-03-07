import { motion, AnimatePresence } from 'framer-motion';
import { useState, useMemo } from 'react';
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
import { usePortfolio } from '@/context/hooks';
import {
    fetchCommodityPrices,
    fetchCryptoPrices,
    fetchForexRates,
    fetchStockQuote,
} from '@/services/realDataService';

interface AddAssetDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AddAssetDialog({ isOpen, onClose }: AddAssetDialogProps) {
    const { addAsset, assets, updateAsset, addTransaction } = usePortfolio();

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
            toast.error('กรุณากรอกสัญลักษณ์ก่อน');
            return;
        }
        
        setIsFetchingPrice(true);
        setFetchError(null);
        
        try {
            const quote = await fetchQuoteByType();
            if (quote) {
                setAvgPrice(quote.price.toString());
                if (!name.trim()) {
                    setName(quote.name);
                }
                toast.success(`ดึงราคา ${symbol.toUpperCase()} สำเร็จ: $${quote.price.toLocaleString()}`);
            } else {
                setFetchError('ไม่พบข้อมูลราคา กรุณากรอกราคาด้วยตนเอง');
                toast.warning('ไม่พบข้อมูลราคา กรุณากรอกราคาด้วยตนเอง');
            }
        } catch {
            setFetchError('ไม่สามารถดึงราคาได้ กรุณากรอกราคาด้วยตนเอง');
            toast.error('ไม่สามารถดึงราคาได้ กรุณากรอกราคาด้วยตนเอง');
        } finally {
            setIsFetchingPrice(false);
        }
    };

    const handleAddAsset = async () => {
        if (!symbol || !name || !quantity || !avgPrice) {
            toast.error('กรุณากรอกข้อมูลให้ครบถ้วน');
            return;
        }

        const qtyNum = parseFloat(quantity);
        const pxNum = parseFloat(avgPrice);

        if (isNaN(qtyNum) || isNaN(pxNum)) {
            toast.error('จำนวนและราคาต้องเป็นตัวเลข');
            return;
        }

        if (qtyNum <= 0 || pxNum <= 0) {
            toast.error('จำนวนและราคาต้องมากกว่า 0');
            return;
        }

        // ตรวจสอบ symbol ซ้ำ
        const duplicateAsset = assets.find(a => a.symbol.toUpperCase() === symbol.toUpperCase());
        if (duplicateAsset) {
            toast.error(`สินทรัพย์ ${symbol.toUpperCase()} มีอยู่ในพอร์ตแล้ว กรุณาใช้ฟังก์ชัน "เพิ่มจำนวน" แทน`);
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
            toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
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
                        <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
                            {/* Header */}
                            <div className="relative p-6 bg-gradient-to-br from-gray-50 to-gray-100 border-b border-gray-200">
                                <button
                                    onClick={handleClose}
                                    className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white text-gray-500 hover:text-gray-900 shadow-sm transition-colors"
                                >
                                    <X size={18} />
                                </button>
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#ee7d54] to-[#f59e0b] flex items-center justify-center shadow-lg shadow-[#ee7d54]/20">
                                        <Briefcase className="text-white" size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900">เพิ่มสินทรัพย์</h2>
                                        <p className="text-sm text-gray-500">บันทึกพอร์ตของคุณด้วยตนเอง</p>
                                    </div>
                                </div>
                            </div>

                            {/* Form */}
                            <div className="p-6 space-y-5">
                                {/* Type Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        ประเภทสินทรัพย์
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
                                                    ? 'border-[#ee7d54] bg-orange-50 text-[#ee7d54]'
                                                    : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'
                                                    }`}
                                            >
                                                <t.icon size={18} />
                                                <span className="text-[10px] font-semibold">{t.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {existingAsset && (
                                    <div className="p-3 bg-red-50 border border-red-100 rounded-xl">
                                        <p className="text-sm text-red-600">
                                            ⚠️ สินทรัพย์ {symbol.toUpperCase()} มีอยู่ในพอร์ตแล้ว ({existingAsset.quantity} หน่วย)
                                        </p>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            สัญลักษณ์ (Symbol)
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
                                                className="w-full px-4 py-2.5 pr-10 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#ee7d54] focus:ring-2 focus:ring-[#ee7d54]/20 transition-all font-medium uppercase"
                                            />
                                            <button
                                                onClick={fetchCurrentPrice}
                                                disabled={isFetchingPrice || !symbol}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-[#ee7d54] disabled:opacity-50 transition-colors"
                                                title="ดึงราคาปัจจุบัน"
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
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            ชื่อสินทรัพย์ (Name)
                                        </label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="e.g. Bitcoin"
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#ee7d54] focus:ring-2 focus:ring-[#ee7d54]/20 transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            จำนวน (Quantity)
                                        </label>
                                        <input
                                            type="number"
                                            value={quantity}
                                            onChange={(e) => setQuantity(e.target.value)}
                                            placeholder="0.00"
                                            step="any"
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#ee7d54] focus:ring-2 focus:ring-[#ee7d54]/20 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            ราคาเฉลี่ย (Avg Price USD)
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
                                            <input
                                                type="number"
                                                value={avgPrice}
                                                onChange={(e) => setAvgPrice(e.target.value)}
                                                placeholder="0.00"
                                                step="any"
                                                className="w-full pl-7 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#ee7d54] focus:ring-2 focus:ring-[#ee7d54]/20 transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Summary */}
                                <div className="bg-orange-50 rounded-xl p-4 flex flex-col items-center justify-center border border-orange-100/50">
                                    <p className="text-xs text-orange-600 font-medium mb-1">มูลค่ารวม (Total Value)</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        ${(parseFloat(quantity || '0') * parseFloat(avgPrice || '0')).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        จำนวน: {parseFloat(quantity || '0').toLocaleString()} × ราคา: ${parseFloat(avgPrice || '0').toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3">
                                <button
                                    onClick={handleClose}
                                    className="flex-1 py-3 px-4 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                                >
                                    ยกเลิก
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
                                            เพิ่มเข้าพอร์ต
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
