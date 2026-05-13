/**
 * KapraoClaw AI Chat Section
 * AI Chat powered by OpenClaw
 * 
 * Features:
 * - ถามตอบภาษาไทย
 * - วิเคราะห์ตลาด
 * - สรุปข่าว
 * - Signal Tracker
 */

import { useState, useRef, useEffect } from 'react';
import { openclawChat, checkOpenClawStatus, type OpenClawMessage } from '@/services/openclawService';
import { Send, Bot, Loader2, Wifi, WifiOff } from 'lucide-react';

export default function KapraoChat() {
  const [messages, setMessages] = useState<OpenClawMessage[]>(() => [
    {
      role: 'assistant',
      content: 'สวัสดีครับ! ผมคือ KapraoClaw AI 🤖\n\nผมตอบได้ด้วยข้อมูลตลาดสดจาก Binance\nลองถาม:\n• "สรุปตลาดวันนี้"\n• "BTC ราคาเท่าไหร่"\n• "Signal ล่าสุด"\n• "วิเคราะห์ ETH"',
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check OpenClaw status on mount
  useEffect(() => {
    checkOpenClawStatus().then(setIsOnline);
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: OpenClawMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await openclawChat(input.trim(), messages);
      const aiMessage: OpenClawMessage = {
        role: 'assistant',
        content: response,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'ขอโทษครับ เกิดข้อผิดพลาด ลองใหม่อีกครั้ง',
        timestamp: Date.now()
      }]);
    }

    setIsLoading(false);
  };

  const quickQuestions = [
    'สรุปตลาดวันนี้',
    'BTC Signal ล่าสุด',
    'ข่าวสำคัญวันนี้',
    'วิเคราะห์ XAU/USD',
    'USOIL ทำนายราคา'
  ];

  return (
    <div className="flex flex-col h-[600px] bg-[#0a0a0f] rounded-xl border border-[#1a1a2e]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#1a1a2e]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">KapraoClaw AI</h3>
            <p className="text-xs text-gray-400">{isOnline ? 'OpenClaw connected' : 'Live data mode'}</p>
          </div>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs ${isOnline ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
          {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          {isOnline ? 'AI Online' : 'Live Data'}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-purple-400" />
              </div>
            )}
            <div className={`max-w-[80%] rounded-xl p-3 ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white' 
                : 'bg-[#1a1a2e] text-gray-200'
            }`}>
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
              <Bot className="w-4 h-4 text-purple-400" />
            </div>
            <div className="bg-[#1a1a2e] rounded-xl p-3">
              <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Questions */}
      <div className="px-4 pb-2 flex gap-2 flex-wrap">
        {quickQuestions.map((q) => (
          <button
            key={q}
            onClick={() => setInput(q)}
            className="px-3 py-1 text-xs bg-[#1a1a2e] hover:bg-purple-600/30 text-gray-300 rounded-full transition-colors"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-[#1a1a2e]">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="ถามเรื่องตลาด..."
            className="flex-1 bg-[#1a1a2e] border border-[#2a2a4e] rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg transition-colors"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
