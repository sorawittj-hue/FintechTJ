import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { toast } from 'sonner';
import { 
  X, 
  Bell, 
  TrendingUp, 
  TrendingDown,
  Plus,
  Trash2,
  AlertTriangle
} from 'lucide-react';

interface AlertDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PriceAlert {
  id: string;
  asset: string;
  type: 'above' | 'below';
  price: number;
  enabled: boolean;
}

export function AlertDialog({ isOpen, onClose }: AlertDialogProps) {
  const [alerts, setAlerts] = useState<PriceAlert[]>([
    { id: '1', asset: 'BTC', type: 'above', price: 70000, enabled: true },
    { id: '2', asset: 'NVDA', type: 'below', price: 800, enabled: true },
    { id: '3', asset: 'ETH', type: 'above', price: 4000, enabled: false },
  ]);
  const [newAlert, setNewAlert] = useState({ asset: 'BTC', type: 'above', price: '' });

  const handleAddAlert = () => {
    if (!newAlert.price || parseFloat(newAlert.price) <= 0) {
      toast.error('Please enter a valid price');
      return;
    }

    const alert: PriceAlert = {
      id: Date.now().toString(),
      asset: newAlert.asset,
      type: newAlert.type as 'above' | 'below',
      price: parseFloat(newAlert.price),
      enabled: true,
    };

    setAlerts([...alerts, alert]);
    setNewAlert({ asset: 'BTC', type: 'above', price: '' });
    toast.success(`Alert set for ${newAlert.asset} at $${newAlert.price}`);
  };

  const handleToggleAlert = (id: string) => {
    setAlerts(alerts.map(a => 
      a.id === id ? { ...a, enabled: !a.enabled } : a
    ));
    toast.info('Alert updated');
  };

  const handleDeleteAlert = (id: string) => {
    setAlerts(alerts.filter(a => a.id !== id));
    toast.success('Alert removed');
  };

  const assets = ['BTC', 'ETH', 'NVDA', 'AAPL', 'MSFT', 'GOOGL', 'TSLA', 'SOL'];

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
                    <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center">
                      <Bell className="text-purple-600" size={24} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">Price Alerts</h2>
                      <p className="text-sm text-gray-500">Get notified when prices hit your targets</p>
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
                <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50 to-blue-50">
                  <h3 className="font-medium mb-4">Create New Alert</h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      <select
                        value={newAlert.asset}
                        onChange={(e) => setNewAlert({ ...newAlert, asset: e.target.value })}
                        className="px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-[#ee7d54]"
                      >
                        {assets.map(asset => (
                          <option key={asset} value={asset}>{asset}</option>
                        ))}
                      </select>
                      <select
                        value={newAlert.type}
                        onChange={(e) => setNewAlert({ ...newAlert, type: e.target.value })}
                        className="px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-[#ee7d54]"
                      >
                        <option value="above">Above</option>
                        <option value="below">Below</option>
                      </select>
                      <input
                        type="number"
                        value={newAlert.price}
                        onChange={(e) => setNewAlert({ ...newAlert, price: e.target.value })}
                        placeholder="Price"
                        className="px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-[#ee7d54]"
                      />
                    </div>
                    <button
                      onClick={handleAddAlert}
                      className="w-full py-3 bg-[#ee7d54] text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-[#dd6d44] transition-colors"
                    >
                      <Plus size={18} />
                      Create Alert
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-3">Active Alerts ({alerts.filter(a => a.enabled).length})</h3>
                  <div className="space-y-3">
                    {alerts.map((alert) => (
                      <motion.div
                        key={alert.id}
                        layout
                        className={`p-4 rounded-2xl border-2 transition-all ${
                          alert.enabled 
                            ? 'border-gray-200 bg-white' 
                            : 'border-gray-100 bg-gray-50 opacity-60'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleToggleAlert(alert.id)}
                              className={`w-12 h-6 rounded-full transition-colors ${
                                alert.enabled ? 'bg-[#ee7d54]' : 'bg-gray-300'
                              }`}
                            >
                              <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                                alert.enabled ? 'translate-x-6' : 'translate-x-0.5'
                              }`} />
                            </button>
                            <div>
                              <p className="font-bold">{alert.asset}</p>
                              <div className="flex items-center gap-2 text-sm">
                                {alert.type === 'above' ? (
                                  <TrendingUp size={14} className="text-green-500" />
                                ) : (
                                  <TrendingDown size={14} className="text-red-500" />
                                )}
                                <span className={alert.type === 'above' ? 'text-green-600' : 'text-red-600'}>
                                  {alert.type === 'above' ? 'Above' : 'Below'} ${alert.price.toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteAlert(alert.id)}
                            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-yellow-50 border border-yellow-200">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="text-yellow-600 flex-shrink-0 mt-0.5" size={18} />
                    <div className="text-sm text-yellow-700">
                      <p className="font-medium">Alert Tips</p>
                      <p className="text-yellow-600 mt-1">
                        Set alerts at realistic price levels. You'll receive notifications when the price crosses your target.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
