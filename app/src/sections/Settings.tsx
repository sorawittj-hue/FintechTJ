/**
 * Settings - Comprehensive App Configuration
 * 
 * Features:
 * - Profile Management
 * - API Keys (Binance, CoinGecko, etc.)
 * - Trading Preferences
 * - Notifications
 * - Appearance (Theme, Language)
 * - Data Management (Export, Import, Backup)
 * - OpenClaw Integration
 * - Security
 * - Danger Zone
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Settings as SettingsIcon,
  User,
  Bell,
  Shield,
  Palette,
  Globe,
  Smartphone,
  Key,
  Moon,
  Sun,
  Monitor,
  ChevronRight,
  LogOut,
  Trash2,
  Download,
  Upload,
  Mail,
  Languages,
  Zap,
  ShieldCheck,
  Activity,
  RotateCcw,
  Eye,
  EyeOff,
  Copy,
  Check,
  AlertTriangle,
  Database,
  HardDrive,
  Cloud,
  Link,
  KeyRound,
  Eye as EyeIcon,
  Lock,
  Fingerprint,
  Timer,
  TrendingUp,
  DollarSign,
  Percent,
  BarChart3,
  RefreshCw,
  Server,
  Wifi,
  WifiOff,
  Plus,
  X,
  Save,
  ExternalLink,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '@/store/useSettingsStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.05 } },
};

// ==================== TYPES ====================

interface APIKey {
  id: string;
  name: string;
  key: string;
  secret?: string;
  status: 'active' | 'inactive' | 'error';
  lastUsed?: string;
}

interface NotificationChannel {
  id: string;
  name: string;
  enabled: boolean;
  icon: React.ReactNode;
}

// ==================== COMPONENTS ====================

function SectionCard({ children, title, description, icon: Icon, color = 'orange' }: {
  children: React.ReactNode;
  title: string;
  description?: string;
  icon?: React.ElementType;
  color?: string;
}) {
  const colorMap: Record<string, string> = {
    orange: 'bg-orange-100 text-orange-600',
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    red: 'bg-red-100 text-red-600',
    purple: 'bg-purple-100 text-purple-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    pink: 'bg-pink-100 text-pink-600',
    indigo: 'bg-indigo-100 text-indigo-600',
    cyan: 'bg-cyan-100 text-cyan-600',
  };

  return (
    <motion.div
      variants={fadeInUp}
      className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden"
    >
      <div className="p-6 border-b border-gray-100 flex items-center gap-4">
        {Icon && (
          <div className={`w-12 h-12 rounded-2xl ${colorMap[color]} flex items-center justify-center`}>
            <Icon size={24} />
          </div>
        )}
        <div>
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          {description && <p className="text-sm text-gray-500">{description}</p>}
        </div>
      </div>
      <div className="p-6">{children}</div>
    </motion.div>
  );
}

function Toggle({ enabled, onChange, color = 'orange' }: { enabled: boolean; onChange: () => void; color?: string }) {
  const colorClasses: Record<string, string> = {
    orange: 'bg-orange-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
  };

  return (
    <button
      onClick={onChange}
      className={`relative w-14 h-7 rounded-full transition-all ${enabled ? colorClasses[color] : 'bg-gray-300'}`}
    >
      <div class className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all ${enabled ? 'left-8' : 'left-1'}`} />
    </button>
  );
}

function APIKeyRow({ apiKey, onDelete }: { apiKey: APIKey; onDelete: (id: string) => void }) {
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(apiKey.key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const statusColors = {
    active: 'bg-green-100 text-green-700',
    inactive: 'bg-gray-100 text-gray-700',
    error: 'bg-red-100 text-red-700',
  };

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
          <KeyRound size={18} className="text-white" />
        </div>
        <div>
          <p className="font-bold text-gray-900">{apiKey.name}</p>
          <p className="text-xs text-gray-500 font-mono">
            {showKey ? apiKey.key : '••••••••' + apiKey.key.slice(-4)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className={`px-2 py-1 rounded-full text-xs font-bold ${statusColors[apiKey.status]}`}>
          {apiKey.status}
        </span>
        <button onClick={() => setShowKey(!showKey)} className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
          {showKey ? <EyeOff size={16} className="text-gray-500" /> : <Eye size={16} className="text-gray-500" />}
        </button>
        <button onClick={handleCopy} className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
          {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} className="text-gray-500" />}
        </button>
        <button onClick={() => onDelete(apiKey.id)} className="p-2 hover:bg-red-100 rounded-lg transition-colors">
          <Trash2 size={16} className="text-red-500" />
        </button>
      </div>
    </div>
  );
}

function SettingRow({ icon: Icon, label, description, children, color = 'gray' }: {
  icon?: React.ElementType;
  label: string;
  description?: string;
  children: React.ReactNode;
  color?: string;
}) {
  const colorMap: Record<string, string> = {
    orange: 'bg-orange-100 text-orange-600',
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    red: 'bg-red-100 text-red-600',
    purple: 'bg-purple-100 text-purple-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    gray: 'bg-gray-100 text-gray-600',
  };

  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-4">
        {Icon && (
          <div className={`w-10 h-10 rounded-xl ${colorMap[color]} flex items-center justify-center`}>
            <Icon size={18} />
          </div>
        )}
        <div>
          <p className="font-bold text-gray-900">{label}</p>
          {description && <p className="text-xs text-gray-500">{description}</p>}
        </div>
      </div>
      <div>{children}</div>
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label }: {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl transition-all ${
        active
          ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/30'
          : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      <Icon size={20} className={active ? 'text-white' : 'text-gray-400'} />
      <span className="font-semibold">{label}</span>
    </button>
  );
}

// ==================== MAIN COMPONENT ====================

export function Settings() {
  const { t, i18n } = useTranslation();
  const { settings, updateSettings, exportData, clearCache, resetToDefaults } = useSettingsStore();
  const [activeTab, setActiveTab] = useState('general');

  // API Keys state
  const [apiKeys, setApiKeys] = useState<APIKey[]>([
    { id: '1', name: 'Binance API', key: 'demo_key_1234abcd', status: 'active', lastUsed: '2 min ago' },
    { id: '2', name: 'CoinGecko Pro', key: 'cg_demo_key_5678efgh', status: 'active', lastUsed: '5 min ago' },
  ]);
  const [showAddKey, setShowAddKey] = useState(false);
  const [newKey, setNewKey] = useState({ name: '', key: '', secret: '' });

  // Profile state
  const [profile, setProfile] = useState({
    name: 'คุณเจ',
    email: 'sorawit@addin.co.th',
    phone: '+66 81 234 5678',
  });

  // Trading preferences
  const [tradingPrefs, setTradingPrefs] = useState({
    defaultPair: 'BTCUSD',
    defaultTimeframe: '1h',
    defaultOrderType: 'limit',
    defaultLeverage: 1,
    riskPerTrade: 2,
    maxOpenTrades: 5,
  });

  // Notification channels
  const [channels, setChannels] = useState<NotificationChannel[]>([
    { id: 'telegram', name: 'Telegram', enabled: true, icon: <span>📱</span> },
    { id: 'email', name: 'Email', enabled: true, icon: <Mail size={16} /> },
    { id: 'browser', name: 'Browser Push', enabled: true, icon: <Bell size={16} /> },
    { id: 'sms', name: 'SMS', enabled: false, icon: <Smartphone size={16} /> },
  ]);

  const tabs = [
    { id: 'general', label: 'ทั่วไป', icon: SettingsIcon },
    { id: 'profile', label: 'โปรไฟล์', icon: User },
    { id: 'api', label: 'API Keys', icon: Key },
    { id: 'trading', label: 'การเทรด', icon: TrendingUp },
    { id: 'notifications', label: 'แจ้งเตือน', icon: Bell },
    { id: 'appearance', label: 'หน้าตา', icon: Palette },
    { id: 'data', label: 'ข้อมูล', icon: Database },
    { id: 'security', label: 'ความปลอดภัย', icon: Shield },
    { id: 'danger', label: 'โซนอันตราย', icon: AlertTriangle },
  ];

  const handleAddAPIKey = () => {
    if (!newKey.name || !newKey.key) {
      toast.error('กรุณากรอกข้อมูลให้ครบ');
      return;
    }
    setApiKeys([...apiKeys, { id: Date.now().toString(), ...newKey, status: 'active' }]);
    setNewKey({ name: '', key: '', secret: '' });
    setShowAddKey(false);
    toast.success('เพิ่ม API Key สำเร็จ');
  };

  const handleDeleteAPIKey = (id: string) => {
    setApiKeys(apiKeys.filter(k => k.id !== id));
    toast.success('ลบ API Key สำเร็จ');
  };

  const handleExport = () => {
    const data = {
      settings,
      profile,
      apiKeys: apiKeys.map(k => ({ name: k.name, status: k.status })),
      tradingPrefs,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fintechtj-settings-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Export สำเร็จ');
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target?.result as string);
            if (data.profile) setProfile(data.profile);
            if (data.tradingPrefs) setTradingPrefs(data.tradingPrefs);
            toast.success('Import สำเร็จ');
          } catch {
            toast.error('ไฟล์ไม่ถูกต้อง');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-black text-gray-900">ตั้งค่า</h1>
          <p className="text-gray-500 mt-1">จัดการความชอบและการตั้งค่าแอป</p>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:w-72 flex-shrink-0"
          >
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-3 sticky top-8">
              <div className="space-y-1">
                {tabs.map((tab) => (
                  <TabButton
                    key={tab.id}
                    active={activeTab === tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    icon={tab.icon}
                    label={tab.label}
                  />
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => toast.success('ออกจากระบบแล้ว')}
                  className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-red-500 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={20} />
                  <span className="font-semibold">ออกจากระบบ</span>
                </button>
              </div>
            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            key={activeTab}
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            exit="exit"
            className="flex-1 space-y-6"
          >
            {/* ========== GENERAL ========== */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <SectionCard title="ทั่วไป" description="การตั้งค่าพื้นฐานของแอป" icon={SettingsIcon}>
                  <div className="space-y-4">
                    <SettingRow icon={Languages} label="ภาษา" description="เลือกภาษาที่ใช้แสดงผล">
                      <select
                        value={i18n.language?.substring(0, 2) || 'th'}
                        onChange={(e) => i18n.changeLanguage(e.target.value)}
                        className="px-4 py-2 rounded-xl border border-gray-200 bg-white font-medium"
                      >
                        <option value="th">🇹🇭 ไทย</option>
                        <option value="en">🇺🇸 English</option>
                      </select>
                    </SettingRow>

                    <SettingRow icon={Globe} label="สกุลเงินหลัก" description="ใช้แสดงราคาและมูลค่า">
                      <select
                        value={settings.currency}
                        onChange={(e) => updateSettings({ currency: e.target.value })}
                        className="px-4 py-2 rounded-xl border border-gray-200 bg-white font-medium"
                      >
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="THB">THB (฿)</option>
                        <option value="JPY">JPY (¥)</option>
                      </select>
                    </SettingRow>

                    <SettingRow icon={Timer} label="อัพเดทข้อมูล" description="ความถี่ในการดึงข้อมูลใหม่">
                      <select
                        value={settings.refreshInterval}
                        onChange={(e) => updateSettings({ refreshInterval: Number(e.target.value) })}
                        className="px-4 py-2 rounded-xl border border-gray-200 bg-white font-medium"
                      >
                        <option value={5000}>ทุก 5 วินาที</option>
                        <option value={10000}>ทุก 10 วินาที</option>
                        <option value={30000}>ทุก 30 วินาที</option>
                        <option value={60000}>ทุก 1 นาที</option>
                      </select>
                    </SettingRow>
                  </div>
                </SectionCard>

                <SectionCard title="ตำแหน่ง" description="ข้อมูลตำแหน่งสำหรับข้อมูลเศรษฐกิจ" icon={Globe} color="blue">
                  <div className="space-y-4">
                    <SettingRow icon={Activity} label="Timezone" description="เขตเวลาสำหรับข้อมูล">
                      <select className="px-4 py-2 rounded-xl border border-gray-200 bg-white font-medium">
                        <option value="Asia/Bangkok">Asia/Bangkok (GMT+7)</option>
                        <option value="UTC">UTC (GMT+0)</option>
                        <option value="America/New_York">US Eastern</option>
                      </select>
                    </SettingRow>
                  </div>
                </SectionCard>
              </div>
            )}

            {/* ========== PROFILE ========== */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <SectionCard title="ข้อมูลโปรไฟล์" description="ข้อมูลส่วนตัวและการติดต่อ" icon={User} color="orange">
                  <div className="space-y-6">
                    {/* Avatar */}
                    <div className="flex items-center gap-6 p-6 bg-gray-50 rounded-2xl">
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white text-3xl font-black">
                        {profile.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <p className="text-xl font-bold text-gray-900">{profile.name}</p>
                        <p className="text-gray-500">{profile.email}</p>
                        <Badge className="mt-2 bg-orange-100 text-orange-700 border-orange-200">Pro Member</Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">ชื่อ</label>
                        <Input
                          value={profile.name}
                          onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                          className="rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">อีเมล</label>
                        <Input
                          value={profile.email}
                          onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                          className="rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">เบอร์โทร</label>
                        <Input
                          value={profile.phone}
                          onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                          className="rounded-xl"
                        />
                      </div>
                    </div>

                    <Button className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl px-6">
                      <Save size={18} className="mr-2" />
                      บันทึกการเปลี่ยนแปลง
                    </Button>
                  </div>
                </SectionCard>
              </div>
            )}

            {/* ========== API KEYS ========== */}
            {activeTab === 'api' && (
              <div className="space-y-6">
                <SectionCard title="API Keys" description="จัดการ API keys สำหรับเชื่อมต่อบริการต่างๆ" icon={Key} color="purple">
                  <div className="space-y-4">
                    {apiKeys.map((apiKey) => (
                      <APIKeyRow key={apiKey.id} apiKey={apiKey} onDelete={handleDeleteAPIKey} />
                    ))}

                    {showAddKey ? (
                      <div className="p-6 bg-gray-50 rounded-2xl space-y-4">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-gray-900">เพิ่ม API Key ใหม่</p>
                          <button onClick={() => setShowAddKey(false)} className="p-2 hover:bg-gray-200 rounded-lg">
                            <X size={18} className="text-gray-500" />
                          </button>
                        </div>
                        <Input
                          placeholder="ชื่อบริการ (เช่น Binance)"
                          value={newKey.name}
                          onChange={(e) => setNewKey({ ...newKey, name: e.target.value })}
                          className="rounded-xl"
                        />
                        <Input
                          placeholder="API Key"
                          value={newKey.key}
                          onChange={(e) => setNewKey({ ...newKey, key: e.target.value })}
                          className="rounded-xl font-mono"
                        />
                        <Input
                          placeholder="API Secret (ถ้ามี)"
                          value={newKey.secret}
                          onChange={(e) => setNewKey({ ...newKey, secret: e.target.value })}
                          className="rounded-xl font-mono"
                        />
                        <Button onClick={handleAddAPIKey} className="bg-purple-500 hover:bg-purple-600 text-white rounded-xl w-full">
                          <Plus size={18} className="mr-2" />
                          เพิ่ม API Key
                        </Button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowAddKey(true)}
                        className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-2xl text-gray-500 hover:border-purple-400 hover:text-purple-600 transition-colors"
                      >
                        <Plus size={20} />
                        <span className="font-medium">เพิ่ม API Key ใหม่</span>
                      </button>
                    )}
                  </div>
                </SectionCard>

                {/* OpenClaw Integration */}
                <SectionCard title="OpenClaw Integration" description="เชื่อมต่อ AI agent ของคุณ" icon={Server} color="cyan">
                  <div className="space-y-4">
                    <SettingRow icon={Wifi} label="OpenClaw Gateway" description="URL ของ OpenClaw server">
                      <div className="flex items-center gap-2">
                        <Input
                          value="http://localhost:3000"
                          disabled
                          className="w-48 rounded-xl bg-gray-100"
                        />
                        <div className="w-3 h-3 rounded-full bg-red-500" title="Offline" />
                      </div>
                    </SettingRow>

                    <div className="flex items-center gap-3">
                      <Button variant="outline" className="rounded-xl">
                        <Link size={16} className="mr-2" />
                        เชื่อมต่อใหม่
                      </Button>
                      <Button variant="outline" className="rounded-xl">
                        <ExternalLink size={16} className="mr-2" />
                        เปิด Dashboard
                      </Button>
                    </div>
                  </div>
                </SectionCard>
              </div>
            )}

            {/* ========== TRADING ========== */}
            {activeTab === 'trading' && (
              <div className="space-y-6">
                <SectionCard title="การตั้งค่าการเทรด" description="ค่าเริ่มต้นสำหรับการเทรด" icon={TrendingUp} color="green">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">คู่เทรดเริ่มต้น</label>
                        <select
                          value={tradingPrefs.defaultPair}
                          onChange={(e) => setTradingPrefs({ ...tradingPrefs, defaultPair: e.target.value })}
                          className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-white font-medium"
                        >
                          <option value="BTCUSD">BTC/USD</option>
                          <option value="ETHUSD">ETH/USD</option>
                          <option value="SOLUSD">SOL/USD</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">Timeframe เริ่มต้น</label>
                        <select
                          value={tradingPrefs.defaultTimeframe}
                          onChange={(e) => setTradingPrefs({ ...tradingPrefs, defaultTimeframe: e.target.value })}
                          className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-white font-medium"
                        >
                          <option value="1m">1 นาที</option>
                          <option value="5m">5 นาที</option>
                          <option value="15m">15 นาที</option>
                          <option value="1h">1 ชั่วโมง</option>
                          <option value="4h">4 ชั่วโมง</option>
                          <option value="1d">1 วัน</option>
                        </select>
                      </div>
                    </div>

                    <SettingRow icon={Percent} label="Leverage เริ่มต้น" description="Leverage สำหรับ futures">
                      <select
                        value={tradingPrefs.defaultLeverage}
                        onChange={(e) => setTradingPrefs({ ...tradingPrefs, defaultLeverage: Number(e.target.value) })}
                        className="px-4 py-2 rounded-xl border border-gray-200 bg-white font-medium"
                      >
                        {[1, 2, 5, 10, 20, 50, 100].map(v => (
                          <option key={v} value={v}>{v}x</option>
                        ))}
                      </select>
                    </SettingRow>

                    <SettingRow icon={Shield} label="Risk ต่อ Order" description="เปอร์เซ็นต์ของพอร์ตที่ยอมรับความเสี่ยง">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={tradingPrefs.riskPerTrade}
                          onChange={(e) => setTradingPrefs({ ...tradingPrefs, riskPerTrade: Number(e.target.value) })}
                          className="w-20 px-4 py-2 rounded-xl border border-gray-200 bg-white font-medium text-center"
                          min={0.5}
                          max={10}
                          step={0.5}
                        />
                        <span className="text-gray-500 font-medium">%</span>
                      </div>
                    </SettingRow>

                    <SettingRow icon={BarChart3} label="Max Open Trades" description="จำนวน position สูงสุดที่เปิดได้พร้อมกัน">
                      <input
                        type="number"
                        value={tradingPrefs.maxOpenTrades}
                        onChange={(e) => setTradingPrefs({ ...tradingPrefs, maxOpenTrades: Number(e.target.value) })}
                        className="w-20 px-4 py-2 rounded-xl border border-gray-200 bg-white font-medium text-center"
                        min={1}
                        max={20}
                      />
                    </SettingRow>
                  </div>
                </SectionCard>
              </div>
            )}

            {/* ========== NOTIFICATIONS ========== */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <SectionCard title="ช่องแจ้งเตือน" description="เลือกช่องทางที่ต้องการรับการแจ้งเตือน" icon={Bell} color="yellow">
                  <div className="space-y-4">
                    {channels.map((channel) => (
                      <SettingRow key={channel.id} icon={() => channel.icon as React.ReactElement} label={channel.name}>
                        <Toggle
                          enabled={channel.enabled}
                          onChange={() => setChannels(channels.map(c =>
                            c.id === channel.id ? { ...c, enabled: !c.enabled } : c
                          ))}
                          color="green"
                        />
                      </SettingRow>
                    ))}
                  </div>
                </SectionCard>

                <SectionCard title="ประเภทการแจ้งเตือน" description="เลือกประเภทการแจ้งเตือนที่ต้องการ" icon={Zap} color="orange">
                  <div className="space-y-4">
                    <SettingRow icon={TrendingUp} label="Price Alerts" description="แจ้งเตือนเมื่อราคาถึงเป้าหมาย">
                      <Toggle enabled={true} onChange={() => {}} color="green" />
                    </SettingRow>
                    <SettingRow icon={DollarSign} label="Portfolio Changes" description="แจ้งเตือนเมื่อพอร์ตเปลี่ยนแปลง">
                      <Toggle enabled={true} onChange={() => {}} color="green" />
                    </SettingRow>
                    <SettingRow icon={AlertTriangle} label="Risk Warnings" description="แจ้งเตือนความเสี่ยงสูง">
                      <Toggle enabled={true} onChange={() => {}} color="red" />
                    </SettingRow>
                    <SettingRow icon={Mail} label="Daily Summary" description="สรุปผลประจำวันทางอีเมล">
                      <Toggle enabled={false} onChange={() => {}} color="blue" />
                    </SettingRow>
                  </div>
                </SectionCard>
              </div>
            )}

            {/* ========== APPEARANCE ========== */}
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <SectionCard title="ธีม" description="เลือกรูปแบบการแสดงผล" icon={Palette} color="pink">
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { id: 'light', icon: Sun, label: 'Light', desc: 'สว่าง' },
                      { id: 'dark', icon: Moon, label: 'Dark', desc: 'มืด' },
                      { id: 'system', icon: Monitor, label: 'System', desc: 'ตามระบบ' },
                    ].map((theme) => (
                      <button
                        key={theme.id}
                        onClick={() => updateSettings({ theme: theme.id as 'light' | 'dark' | 'system' })}
                        className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${
                          settings.theme === theme.id
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <theme.icon size={32} className={settings.theme === theme.id ? 'text-orange-500' : 'text-gray-400'} />
                        <div className="text-center">
                          <p className="font-bold text-gray-900">{theme.label}</p>
                          <p className="text-xs text-gray-500">{theme.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </SectionCard>

                <SectionCard title="การแสดงผล" description="ปรับแต่ง UI" icon={Monitor} color="blue">
                  <div className="space-y-4">
                    <SettingRow icon={BarChart3} label="Compact Mode" description="แสดงผลแบบกะทัดรัด">
                      <Toggle
                        enabled={settings.display?.compactMode || false}
                        onChange={() => updateSettings({ display: { ...settings.display, compactMode: !settings.display?.compactMode } })}
                        color="green"
                      />
                    </SettingRow>
                    <SettingRow icon={Activity} label="แสดง Animation" description="เปิด/ปิด animation ต่างๆ">
                      <Toggle
                        enabled={settings.display?.showAnimations !== false}
                        onChange={() => updateSettings({ display: { ...settings.display, showAnimations: !settings.display?.showAnimations } })}
                        color="green"
                      />
                    </SettingRow>
                  </div>
                </SectionCard>
              </div>
            )}

            {/* ========== DATA ========== */}
            {activeTab === 'data' && (
              <div className="space-y-6">
                <SectionCard title="สำรองข้อมูล" description="Export และ Import ข้อมูล" icon={HardDrive} color="green">
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <Button onClick={handleExport} className="bg-green-500 hover:bg-green-600 text-white rounded-xl">
                        <Download size={18} className="mr-2" />
                        Export ข้อมูล
                      </Button>
                      <Button onClick={handleImport} variant="outline" className="rounded-xl">
                        <Upload size={18} className="mr-2" />
                        Import ข้อมูล
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">
                      Export ข้อมูลการตั้งค่า, โปรไฟล์ และ API keys (keys จะถูกซ่อน)
                    </p>
                  </div>
                </SectionCard>

                <SectionCard title="จัดการข้อมูล" description="ล้างข้อมูลและ cache" icon={Trash2} color="yellow">
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <Button onClick={clearCache} variant="outline" className="rounded-xl">
                        <Database size={18} className="mr-2" />
                        ล้าง Cache
                      </Button>
                      <Button onClick={resetToDefaults} variant="outline" className="rounded-xl">
                        <RotateCcw size={18} className="mr-2" />
                        คืนค่าเริ่มต้น
                      </Button>
                    </div>
                  </div>
                </SectionCard>
              </div>
            )}

            {/* ========== SECURITY ========== */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <SectionCard title="ความปลอดภัย" description="ตั้งค่าความปลอดภัย" icon={Shield} color="indigo">
                  <div className="space-y-4">
                    <SettingRow icon={Lock} label="เปลี่ยนรหัสผ่าน" description="อัพเดตรหัสผ่านของคุณ">
                      <Button variant="outline" className="rounded-xl text-sm">
                        เปลี่ยน
                      </Button>
                    </SettingRow>
                    <SettingRow icon={Fingerprint} label="2FA" description="เปิดใช้งาน Two-Factor Authentication">
                      <Toggle enabled={false} onChange={() => toast.info('Coming soon')} color="green" />
                    </SettingRow>
                    <SettingRow icon={Smartphone} label="อุปกรณ์ที่เข้าสู่ระบบ" description="จัดการอุปกรณ์ที่ล็อกอิน">
                      <Button variant="outline" className="rounded-xl text-sm">
                        ดู 3 อุปกรณ์
                      </Button>
                    </SettingRow>
                  </div>
                </SectionCard>

                <SectionCard title="Sessions" description="จัดการการเข้าสู่ระบบ" icon={Timer} color="cyan">
                  <div className="space-y-3">
                    {[
                      { device: 'Chrome บน Windows', location: 'กรุงเทพ, ประเทศไทย', time: 'ใช้งานอยู่', current: true },
                      { device: 'Safari บน iPhone', location: 'กรุงเทพ, ประเทศไทย', time: '2 ชม. ที่แล้ว', current: false },
                    ].map((session, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div>
                          <p className="font-medium text-gray-900 flex items-center gap-2">
                            {session.device}
                            {session.current && <Badge className="bg-green-100 text-green-700">ปัจจุบัน</Badge>}
                          </p>
                          <p className="text-xs text-gray-500">{session.location} • {session.time}</p>
                        </div>
                        {!session.current && (
                          <Button variant="ghost" className="text-red-500 hover:bg-red-50 rounded-xl text-sm">
                            ออกจากระบบ
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </SectionCard>
              </div>
            )}

            {/* ========== DANGER ZONE ========== */}
            {activeTab === 'danger' && (
              <div className="space-y-6">
                <SectionCard title="โซนอันตราย" description="การกระทำที่ไม่สามารถย้อนกลับได้" icon={AlertTriangle} color="red">
                  <div className="space-y-6">
                    <div className="p-4 bg-red-50 border border-red-200 rounded-2xl">
                      <p className="font-bold text-red-700 mb-1">⚠️ คำเตือน</p>
                      <p className="text-sm text-red-600">
                        การกระทำด้านล่างไม่สามารถย้อนกลับได้ กรุณาตรวจสอบให้แน่ใจก่อนดำเนินการ
                      </p>
                    </div>

                    <div className="space-y-3">
                      <button className="w-full flex items-center justify-between p-4 border border-red-200 rounded-xl hover:bg-red-50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                            <Trash2 size={18} className="text-red-600" />
                          </div>
                          <div className="text-left">
                            <p className="font-bold text-gray-900">ลบข้อมูลทั้งหมด</p>
                            <p className="text-xs text-gray-500">ลบข้อมูลทุกอย่างรวมถึงพอร์ตและการตั้งค่า</p>
                          </div>
                        </div>
                        <ChevronRight size={20} className="text-red-400" />
                      </button>

                      <button className="w-full flex items-center justify-between p-4 border border-red-200 rounded-xl hover:bg-red-50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                            <AlertTriangle size={18} className="text-red-600" />
                          </div>
                          <div className="text-left">
                            <p className="font-bold text-gray-900">ลบบัญชีถาวร</p>
                            <p className="text-xs text-gray-500">ปิดบัญชีและลบข้อมูลทั้งหมด</p>
                          </div>
                        </div>
                        <ChevronRight size={20} className="text-red-400" />
                      </button>
                    </div>
                  </div>
                </SectionCard>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
