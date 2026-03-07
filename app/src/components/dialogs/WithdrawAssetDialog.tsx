import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { X, Minus, ArrowDownRight } from 'lucide-react';
import { usePortfolio } from '@/context/hooks';

interface WithdrawAssetDialogProps {
    isOpen: boolean;
    onClose: () => void;
    assetId: string | null;
}

export function WithdrawAssetDialog({ isOpen, onClose, assetId }: WithdrawAssetDialogProps) {
    const { assets, updateAsset, removeAsset, addAsset, addTransaction } = usePortfolio();

    const [quantity, setQuantity] = useState('');
    const [price, setPrice] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const asset = assets.find((a) => a.id === assetId);

    useEffect(() => {
        if (isOpen && asset) {
            setPrice(asset.currentPrice.toString());
            setQuantity('');
        } else if (!isOpen) {
            setQuantity('');
            setPrice('');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, asset?.id]);

    const handleClose = () => {
        setQuantity('');
        onClose();
    };

    const handleWithdraw = async () => {
        if (!asset) return;

        if (!quantity || !price) {
            toast.error('กรุณากรอกข้อมูลให้ครบถ้วน');
            return;
        }

        const withdrawQty = parseFloat(quantity);
        const withdrawPx = parseFloat(price);

        if (withdrawQty <= 0 || withdrawPx <= 0) {
            toast.error('จำนวนและราคาต้องมากกว่า 0');
            return;
        }

        if (withdrawQty > asset.quantity) {
            toast.error(`จำนวนที่ถอนต้องไม่เกิน ${asset.quantity}`);
            return;
        }

        setIsProcessing(true);

        try {
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

            toast.success(`ขาย ${withdrawQty} ${asset.symbol} เรียบร้อยแล้ว`);
            handleClose();
        } finally {
            setIsProcessing(false);
        }
    };

    if (!isOpen || !asset) return null;

    const withdrawQty = parseFloat(quantity || '0');
    const withdrawPx = parseFloat(price || '0');
    const estimatedReturn = withdrawQty * withdrawPx;

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
                    className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden pointer-events-auto"
                >
                    {/* Header */}
                    <div className="relative p-6 bg-gradient-to-br from-red-50 to-orange-50 border-b border-red-100">
                        <button
                            onClick={handleClose}
                            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white text-gray-500 hover:text-gray-900 shadow-sm transition-colors"
                        >
                            <X size={18} />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg shadow-red-500/20">
                                <ArrowDownRight className="text-white" size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">ถอน/ขายสินทรัพย์</h2>
                                <p className="text-sm text-gray-500">นำ {asset.symbol} ออกจากพอร์ต</p>
                            </div>
                        </div>
                    </div>

                    {/* Form */}
                    <div className="p-6 space-y-5">
                        <div className="p-4 bg-gray-50 rounded-xl flex justify-between items-center">
                            <div>
                                <p className="text-xs text-gray-500">สินทรัพย์</p>
                                <p className="font-bold text-lg">{asset.symbol}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-500">จำนวนที่มีอยู่</p>
                                <p className="font-semibold text-gray-900">{asset.quantity} {asset.symbol}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    จำนวนที่ต้องการถอน
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={quantity}
                                        onChange={(e) => setQuantity(e.target.value)}
                                        placeholder="0.00"
                                        step="any"
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all font-medium"
                                    />
                                    <button
                                        onClick={() => setQuantity(asset.quantity.toString())}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs font-semibold text-red-600 bg-red-100 rounded-md hover:bg-red-200"
                                    >
                                        MAX
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    ราคาตอนที่ถอน (USD)
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
                                    <input
                                        type="number"
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                        placeholder="0.00"
                                        step="any"
                                        className="w-full pl-7 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                            <div className="flex justify-between items-center mb-1 text-sm">
                                <span className="text-gray-500">มูลค่าที่ถอน (โดยประมาณ)</span>
                                <span className="font-bold text-gray-900">${estimatedReturn.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
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
                                    กำลังดำเนินการ...
                                </>
                            ) : (
                                <>
                                    <Minus size={18} />
                                    ยืนยันการถอนสินทรัพย์
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
