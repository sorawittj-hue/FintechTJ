import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { toast } from 'sonner';
import {
    X,
    Briefcase,
    Bitcoin,
    Building2,
    Droplet,
    DollarSign,
    Plus
} from 'lucide-react';
import { usePortfolio } from '@/context/hooks';

interface AddAssetDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AddAssetDialog({ isOpen, onClose }: AddAssetDialogProps) {
    const { addAsset } = usePortfolio();

    const [type, setType] = useState<'crypto' | 'stock' | 'commodity'>('crypto');
    const [symbol, setSymbol] = useState('');
    const [name, setName] = useState('');
    const [quantity, setQuantity] = useState('');
    const [avgPrice, setAvgPrice] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

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

    const handleAddAsset = async () => {
        if (!symbol || !name || !quantity || !avgPrice) {
            toast.error('กรุณากรอกข้อมูลให้ครบถ้วน');
            return;
        }

        const qtyNum = parseFloat(quantity);
        const pxNum = parseFloat(avgPrice);

        if (qtyNum <= 0 || pxNum <= 0) {
            toast.error('จำนวนและราคาต้องมากกว่า 0');
            return;
        }

        setIsProcessing(true);

        // เลียนแบบการโหลด API
        await new Promise(resolve => setTimeout(resolve, 800));

        addAsset({
            symbol: symbol.toUpperCase(),
            name,
            type,
            quantity: qtyNum,
            avgPrice: pxNum,
            currentPrice: pxNum,
            value: qtyNum * pxNum,
            change24h: 0,
            change24hPercent: 0,
            change24hValue: 0,
            allocation: 0
        });

        toast.success(`เพิ่ม ${symbol.toUpperCase()} ลงในพอร์ตเรียบร้อยแล้ว`);
        setIsProcessing(false);
        handleClose();
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
                                                onClick={() => setType(t.id as 'crypto' | 'stock' | 'commodity')}
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

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            สัญลักษณ์ (Symbol)
                                        </label>
                                        <input
                                            type="text"
                                            value={symbol}
                                            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                                            placeholder="e.g. BTC"
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#ee7d54] focus:ring-2 focus:ring-[#ee7d54]/20 transition-all font-medium uppercase"
                                        />
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
                                    disabled={isProcessing || !symbol || !name || !quantity || !avgPrice}
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
