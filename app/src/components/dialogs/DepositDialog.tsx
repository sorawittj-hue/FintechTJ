import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  X,
  Wallet,
  CreditCard,
  Banknote,
  ArrowRight,
  Shield,
  Zap
} from 'lucide-react';
import { usePortfolio } from '@/context/hooks';

interface DepositDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DepositDialog({ isOpen, onClose }: DepositDialogProps) {
  const { portfolio, addTransaction } = usePortfolio();
  const [amount, setAmount] = useState('');
  const [selectedAsset, setSelectedAsset] = useState('USD');
  const [paymentMethod, setPaymentMethod] = useState<'bank' | 'card' | 'crypto'>('bank');
  const [isProcessing, setIsProcessing] = useState(false);

  const quickAmounts = [1000, 5000, 10000, 25000];

  const handleDeposit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setIsProcessing(true);

    await new Promise(resolve => setTimeout(resolve, 2000));

    addTransaction('deposit', parseFloat(amount), selectedAsset);
    setIsProcessing(false);
    setAmount('');
    onClose();
  };

  const cryptoAssets = portfolio.assets.filter(a => a.type === 'crypto');

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
          >
            <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center">
                      <Wallet className="text-green-600" size={24} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">Deposit Funds</h2>
                      <p className="text-sm text-gray-500">Add money to your account</p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount (USD)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-8 pr-4 py-4 text-2xl font-bold border border-gray-200 rounded-2xl focus:outline-none focus:border-[#ee7d54]"
                    />
                  </div>
                  <div className="flex gap-2 mt-3">
                    {quickAmounts.map((q) => (
                      <button
                        key={q}
                        onClick={() => setAmount(q.toString())}
                        className="flex-1 py-2 px-3 bg-gray-100 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
                      >
                        ${q.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Method
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => setPaymentMethod('bank')}
                      className={`p-4 rounded-2xl border-2 transition-all ${paymentMethod === 'bank'
                          ? 'border-[#ee7d54] bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                      <Banknote className={`mx-auto mb-2 ${paymentMethod === 'bank' ? 'text-[#ee7d54]' : 'text-gray-400'}`} size={24} />
                      <p className="text-xs font-medium">Bank</p>
                    </button>
                    <button
                      onClick={() => setPaymentMethod('card')}
                      className={`p-4 rounded-2xl border-2 transition-all ${paymentMethod === 'card'
                          ? 'border-[#ee7d54] bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                      <CreditCard className={`mx-auto mb-2 ${paymentMethod === 'card' ? 'text-[#ee7d54]' : 'text-gray-400'}`} size={24} />
                      <p className="text-xs font-medium">Card</p>
                    </button>
                    <button
                      onClick={() => setPaymentMethod('crypto')}
                      className={`p-4 rounded-2xl border-2 transition-all ${paymentMethod === 'crypto'
                          ? 'border-[#ee7d54] bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                      <Zap className={`mx-auto mb-2 ${paymentMethod === 'crypto' ? 'text-[#ee7d54]' : 'text-gray-400'}`} size={24} />
                      <p className="text-xs font-medium">Crypto</p>
                    </button>
                  </div>
                </div>

                {paymentMethod === 'crypto' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Crypto to Receive
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {cryptoAssets.map((asset) => (
                        <button
                          key={asset.id}
                          onClick={() => setSelectedAsset(asset.symbol)}
                          className={`p-3 rounded-xl border-2 transition-all ${selectedAsset === asset.symbol
                              ? 'border-[#ee7d54] bg-orange-50'
                              : 'border-gray-200 hover:border-gray-300'
                            }`}
                        >
                          <p className="font-bold">{asset.symbol}</p>
                          <p className="text-xs text-gray-500">{asset.name}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="p-4 rounded-2xl bg-gray-50 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Amount</span>
                    <span className="font-medium">${parseFloat(amount || '0').toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Processing Fee (0.5%)</span>
                    <span className="font-medium">${(parseFloat(amount || '0') * 0.005).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm border-t border-gray-200 pt-2">
                    <span className="font-medium">Total</span>
                    <span className="font-bold text-[#ee7d54]">
                      ${(parseFloat(amount || '0') * 0.995).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-2xl bg-blue-50">
                  <Shield className="text-blue-500 flex-shrink-0 mt-0.5" size={18} />
                  <div className="text-sm text-blue-700">
                    <p className="font-medium">Secure Transaction</p>
                    <p className="text-blue-600">Your funds are protected by industry-leading security measures.</p>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-100">
                <button
                  onClick={handleDeposit}
                  disabled={isProcessing || !amount}
                  className="w-full py-4 bg-[#ee7d54] text-white rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-[#dd6d44] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Deposit ${parseFloat(amount || '0').toLocaleString()}
                      <ArrowRight size={20} />
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
