import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  X,
  Wallet,
  CreditCard,
  Banknote,
  ArrowRight,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { usePortfolio } from '@/context/hooks';

interface WithdrawDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WithdrawDialog({ isOpen, onClose }: WithdrawDialogProps) {
  const { portfolio, addTransaction } = usePortfolio();
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'bank' | 'card'>('bank');
  const [isProcessing, setIsProcessing] = useState(false);
  const [bankAccount, setBankAccount] = useState('');
  const [routingNumber, setRoutingNumber] = useState('');

  const maxWithdraw = portfolio.totalValue * 0.9;

  const quickAmounts = [
    { label: '25%', value: portfolio.totalValue * 0.25 },
    { label: '50%', value: portfolio.totalValue * 0.50 },
    { label: '75%', value: portfolio.totalValue * 0.75 },
    { label: 'Max', value: maxWithdraw },
  ];

  const handleWithdraw = async () => {
    const withdrawAmount = parseFloat(amount);

    if (!amount || withdrawAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (withdrawAmount > maxWithdraw) {
      toast.error(`Maximum withdraw amount is $${maxWithdraw.toLocaleString()} (90% of portfolio)`);
      return;
    }

    if (!bankAccount || !routingNumber) {
      toast.error('Please enter bank account details');
      return;
    }

    setIsProcessing(true);

    await new Promise(resolve => setTimeout(resolve, 2500));

    addTransaction('withdraw', withdrawAmount, 'USD');
    setIsProcessing(false);
    setAmount('');
    setBankAccount('');
    setRoutingNumber('');
    onClose();
  };

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
                    <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center">
                      <Wallet className="text-red-600" size={24} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">Withdraw Funds</h2>
                      <p className="text-sm text-gray-500">Transfer money to your bank</p>
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
                <div className="p-4 rounded-2xl bg-yellow-50 border border-yellow-200">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="text-yellow-600 flex-shrink-0 mt-0.5" size={18} />
                    <div>
                      <p className="font-medium text-yellow-800">Withdrawal Limit</p>
                      <p className="text-sm text-yellow-700">
                        You can withdraw up to <span className="font-bold">${maxWithdraw.toLocaleString()}</span> (90% of portfolio)
                      </p>
                    </div>
                  </div>
                </div>

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
                        key={q.label}
                        onClick={() => setAmount(q.value.toFixed(2))}
                        className="flex-1 py-2 px-3 bg-gray-100 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
                      >
                        {q.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Available balance: ${portfolio.totalValue.toLocaleString()}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Withdraw to
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setPaymentMethod('bank')}
                      className={`p-4 rounded-2xl border-2 transition-all ${paymentMethod === 'bank'
                          ? 'border-[#ee7d54] bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                      <Banknote className={`mx-auto mb-2 ${paymentMethod === 'bank' ? 'text-[#ee7d54]' : 'text-gray-400'}`} size={24} />
                      <p className="text-xs font-medium">Bank Account</p>
                    </button>
                    <button
                      onClick={() => setPaymentMethod('card')}
                      className={`p-4 rounded-2xl border-2 transition-all ${paymentMethod === 'card'
                          ? 'border-[#ee7d54] bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                      <CreditCard className={`mx-auto mb-2 ${paymentMethod === 'card' ? 'text-[#ee7d54]' : 'text-gray-400'}`} size={24} />
                      <p className="text-xs font-medium">Debit Card</p>
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bank Account Number
                    </label>
                    <input
                      type="text"
                      value={bankAccount}
                      onChange={(e) => setBankAccount(e.target.value)}
                      placeholder="Enter account number"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#ee7d54]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Routing Number
                    </label>
                    <input
                      type="text"
                      value={routingNumber}
                      onChange={(e) => setRoutingNumber(e.target.value)}
                      placeholder="Enter routing number"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#ee7d54]"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-gray-50 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Amount</span>
                    <span className="font-medium">${parseFloat(amount || '0').toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Withdrawal Fee ($15)</span>
                    <span className="font-medium">$15.00</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Processing Time</span>
                    <span className="font-medium">1-3 Business Days</span>
                  </div>
                  <div className="flex justify-between text-sm border-t border-gray-200 pt-2">
                    <span className="font-medium">You'll Receive</span>
                    <span className="font-bold text-green-600">
                      ${(parseFloat(amount || '0') - 15).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-2xl bg-blue-50">
                  <Clock className="text-blue-500 flex-shrink-0 mt-0.5" size={18} />
                  <div className="text-sm text-blue-700">
                    <p className="font-medium">Processing Time</p>
                    <p className="text-blue-600">Withdrawals typically take 1-3 business days to process and appear in your account.</p>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-100">
                <button
                  onClick={handleWithdraw}
                  disabled={isProcessing || !amount}
                  className="w-full py-4 bg-red-500 text-white rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Withdraw ${parseFloat(amount || '0').toLocaleString()}
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
