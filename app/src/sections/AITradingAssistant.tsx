/**
 * AITradingAssistant - AI Chat for Trading
 * 
 * Features:
 * - Natural language trading assistant
 * - Market analysis
 * - Signal generation
 * - Portfolio advice
 */

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Send,
  Bot,
  User,
  Sparkles,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Shield,
  Loader2,
  Zap,
  BarChart3,
  DollarSign,
  AlertTriangle,
} from 'lucide-react';
import { askAI } from '@/services/miniMaxService';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const quickQuestions = [
  { icon: TrendingUp, text: 'BTC ควรซื้อไหม?', query: 'BTC ควรซื้อไหม? ราคาปัจจุบันประมาณ $66,000' },
  { icon: BarChart3, text: 'วิเคราะห์ ETH', query: 'วิเคราะห์ ETH ดู' },
  { icon: Shield, text: 'แนะนำพอร์ต', query: 'แนะนำการกระจายพอร์ตการลงทุน' },
  { icon: Zap, text: 'Signal ล่าสุด', query: 'มี trading signal อะไรน่าสนใจบ้าง?' },
];

function QuickButton({ icon: Icon, text, onClick }: { icon: any; text: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-purple-300 transition-all"
    >
      <Icon size={16} className="text-purple-500" />
      {text}
    </button>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${
        isUser 
          ? 'bg-gradient-to-br from-orange-500 to-red-500' 
          : 'bg-gradient-to-br from-purple-500 to-pink-500'
      }`}>
        {isUser ? <User size={20} className="text-white" /> : <Bot size={20} className="text-white" />}
      </div>

      <div className={`max-w-[75%] ${isUser ? 'text-right' : ''}`}>
        <div className={`inline-block p-4 rounded-2xl ${
          isUser 
            ? 'bg-gradient-to-br from-orange-500 to-red-500 text-white rounded-tr-sm' 
            : 'bg-gray-100 text-gray-900 rounded-tl-sm'
        }`}>
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>
        <p className={`text-xs text-gray-400 mt-1 ${isUser ? 'text-right' : ''}`}>
          {message.timestamp.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </motion.div>
  );
}

function SignalCard({ signal }: { signal: any }) {
  const colors = {
    BUY: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-600', badge: 'bg-green-500' },
    SELL: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-600', badge: 'bg-red-500' },
    HOLD: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-600', badge: 'bg-yellow-500' },
  }[signal.signal] || {
    bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-600', badge: 'bg-gray-500'
  };

  return (
    <div className={`${colors.bg} border ${colors.border} rounded-xl p-4 my-3`}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-bold">{signal.pair || 'BTC/USD'}</span>
        <span className={`px-2 py-1 ${colors.badge} text-white text-xs font-bold rounded-full`}>
          {signal.signal}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="text-center">
          <p className="text-gray-500">Entry</p>
          <p className="font-bold">${signal.entry?.toLocaleString()}</p>
        </div>
        <div className="text-center">
          <p className="text-gray-500">Target</p>
          <p className="font-bold text-green-600">${signal.target?.toLocaleString()}</p>
        </div>
        <div className="text-center">
          <p className="text-gray-500">Stop</p>
          <p className="font-bold text-red-600">${signal.stop?.toLocaleString()}</p>
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-2">Confidence: {signal.confidence}%</p>
    </div>
  );
}

export function AITradingAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `🤖 **AI Trading Assistant พร้อมใช้งาน!**

สวัสดีครับ! ผมเป็น AI assistant สำหรับวิเคราะห์ตลาดคริปโต

**ถามได้เลย:**
• "BTC ควรซื้อไหม?"
• "วิเคราะห์ ETH"
• "แนะนำพอร์ต"
• "มี signal อะไร?"

⚠️ ข้อมูลนี้เพื่อการศึกษาเท่านั้น ไม่ใช่คำแนะนำในการลงทุน`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const context = `ราคา BTC ปัจจุบัน: $66,000
ราคา ETH ปัจจุบัน: $3,200
Market Status: ขาขึ้น
Fear & Greed: 68 (Greed Zone)`;

      const response = await askAI(input, context);

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      toast.error('เกิดข้อผิดพลาด ลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickQuestion = async (query: string) => {
    setInput(query);
    // Auto send
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: query,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      const context = `ราคา BTC ปัจจุบัน: $66,000
ราคา ETH ปัจจุบัน: $3,200
Market Status: ขาขึ้น
Fear & Greed: 68 (Greed Zone)`;

      const response = await askAI(query, context);

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      toast.error('เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
          <Bot size={28} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-gray-900">AI Trading Assistant</h1>
          <p className="text-sm text-gray-500">สอบถามเรื่องตลาดได้เลย</p>
        </div>
      </div>

      {/* Quick Questions */}
      <div className="flex flex-wrap gap-2 mb-4">
        {quickQuestions.map((q, i) => (
          <QuickButton key={i} {...q} onClick={() => handleQuickQuestion(q.query)} />
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-white rounded-3xl border border-gray-200 p-6 space-y-4 mb-4">
        {messages.map(message => (
          <MessageBubble key={message.id} message={message} />
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Bot size={20} className="text-white" />
            </div>
            <div className="bg-gray-100 rounded-2xl rounded-tl-sm p-4">
              <Loader2 size={20} className="animate-spin text-purple-500" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Warning */}
      <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl mb-4">
        <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800">
          ⚠️ AI ให้ข้อมูลเพื่อการศึกษาเท่านั้น ไม่ใช่คำแนะนำในการลงทุน 
          ผลตอบแทนในอดีตไม่รับประกันผลตอบแทนในอนาคต
        </p>
      </div>

      {/* Input */}
      <div className="flex gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="ถามเรื่องตลาดคริปโต..."
          className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || loading}
          className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
        </button>
      </div>
    </div>
  );
}
