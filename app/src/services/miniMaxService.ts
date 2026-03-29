/**
 * MiniMax AI Service
 * 
 * Integration with MiniMax API for:
 * - LLM (text generation)
 * - Text-to-Speech
 * - Embeddings
 * 
 * API Documentation: https://www.minimaxi.com/document
 */

const MINIMAX_API_KEY = import.meta.env.VITE_MINIMAX_API_KEY || '';
const MINIMAX_BASE_URL = 'https://api.minimaxi.chat/v1';

// ============================================================================
// Types
// ============================================================================

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatCompletionResponse {
  id: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface TTSResponse {
  id: string;
  data: string; // Base64 encoded audio
}

// ============================================================================
// MiniMax LLM - Chat Completion
// ============================================================================

export async function chatCompletion(
  messages: ChatMessage[],
  model: string = 'MiniMax-Text-01',
  maxTokens: number = 1024
): Promise<string> {
  if (!MINIMAX_API_KEY) {
    console.warn('MiniMax API key not configured, using fallback');
    return generateFallbackResponse(messages);
  }

  try {
    const response = await fetch(`${MINIMAX_BASE_URL}/text/chatcompletion_v2`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MINIMAX_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: maxTokens,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`MiniMax API error: ${response.status}`);
    }

    const data: ChatCompletionResponse = await response.json();
    return data.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('MiniMax chat error:', error);
    return generateFallbackResponse(messages);
  }
}

// ============================================================================
// Prompt Templates
// ============================================================================

const SYSTEM_PROMPT = `คุณเป็น AI Trading Assistant สำหรับแพลตฟอร์ม FintechTJ
คุณช่วยวิเคราะห์ตลาดคริปโตและให้คำแนะนำการลงทุน
ตอบเป็นภาษาไทย กระชับ เข้าใจง่าย
ห้ามให้คำแนะนำการลงทุนโดยตรง บอกว่าเป็นเพียงข้อมูลเพื่อการศึกษา`;

export async function askAI(question: string, context?: string): Promise<string> {
  const messages: ChatMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
  ];

  if (context) {
    messages.push({ role: 'system', content: `ข้อมูลตลาดปัจจุบัน:\n${context}` });
  }

  messages.push({ role: 'user', content: question });

  return chatCompletion(messages);
}

export async function analyzeNews(newsContent: string): Promise<{
  summary: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  impact: 'high' | 'medium' | 'low';
  affectedCoins: string[];
  recommendation: string;
}> {
  const messages: ChatMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: `วิเคราะห์ข่าวนี้:

"${newsContent}"

ให้ผลลัพธ์เป็น JSON ดังนี้:
{
  "summary": "สรุปข่าว 1-2 ประโยค",
  "sentiment": "positive/negative/neutral",
  "impact": "high/medium/low",
  "affectedCoins": ["BTC", "ETH"],
  "recommendation": "คำแนะนำสั้นๆ"
}` },
  ];

  try {
    const response = await chatCompletion(messages, 'MiniMax-Text-01', 500);
    return JSON.parse(response);
  } catch {
    return {
      summary: newsContent.slice(0, 100) + '...',
      sentiment: 'neutral',
      impact: 'medium',
      affectedCoins: [],
      recommendation: 'รอดูสถานการณ์',
    };
  }
}

export async function generateTradingSignal(data: {
  symbol: string;
  price: number;
  change24h: number;
  rsi?: number;
  macd?: string;
}): Promise<{
  signal: 'BUY' | 'SELL' | 'HOLD';
  entry: number;
  target: number;
  stop: number;
  confidence: number;
  reason: string;
}> {
  const messages: ChatMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: `วิเคราะห์ signal สำหรับ ${data.symbol}:

- ราคาปัจจุบัน: $${data.price}
- เปลี่ยนแปลง 24h: ${data.change24h}%
- RSI: ${data.rsi || 'N/A'}
- MACD: ${data.macd || 'N/A'}

ให้ผลลัพธ์เป็น JSON:
{
  "signal": "BUY/SELL/HOLD",
  "entry": ${data.price},
  "target": ${data.price * 1.03},
  "stop": ${data.price * 0.97},
  "confidence": 0-100,
  "reason": "เหตุผลสั้นๆ"
}` },
  ];

  try {
    const response = await chatCompletion(messages, 'MiniMax-Text-01', 300);
    return JSON.parse(response);
  } catch {
    const signal = data.change24h > 3 ? 'SELL' : data.change24h < -3 ? 'BUY' : 'HOLD';
    return {
      signal,
      entry: data.price,
      target: signal === 'BUY' ? data.price * 1.05 : data.price * 0.95,
      stop: signal === 'BUY' ? data.price * 0.97 : data.price * 1.03,
      confidence: 50,
      reason: 'ข้อมูลไม่เพียงพอ รอดูสถานการณ์',
    };
  }
}

// ============================================================================
// Fallback Responses (when API key not configured)
// ============================================================================

function generateFallbackResponse(messages: ChatMessage[]): string {
  const lastQuestion = messages.filter(m => m.role === 'user').pop()?.content || '';
  const question = lastQuestion.toLowerCase();

  if (question.includes('ซื้อ') || question.includes('buy') || question.includes('ควร')) {
    return '🤖 **AI Assistant (Demo Mode)**

ขออภัย ตอนนี้ AI อยู่ในโหมดทดลอง ยังไม่สามารถให้คำแนะนำได้

**สิ่งที่ควรทำ:**
- ศึกษาข้อมูลก่อนตัดสินใจ
- ดู RSI, MACD, Support/Resistance
- ตั้ง Stop Loss เสมอ
- ลงทุนเท่าที่พร้อมเสียได้

⚠️ นี่ไม่ใช่คำแนะนำในการลงทุน';
  }

  if (question.includes('ข่าว') || question.includes('news')) {
    return '📰 **AI News Summary (Demo Mode)**

• Bitcoin ETF sees $420M inflow - Positive
• Fed signals potential rate cut - Positive  
• ETH staking yield drops to 3.2% - Negative
• Solana DeFi TVL reaches ATH - Positive

รอการตอบกลับจาก AI...';
  }

  return `🤖 **AI Assistant (Demo Mode)**

สวัสดีครับ! ตอนนี้ AI อยู่ในโหมดทดลอง

**ฟีเจอร์ที่พร้อมใช้:**
• วิเคราะห์ข่าว
• สร้าง Trading Signals
• ตอบคำถามตลาด
• สรุป Portfolio

ถามมาได้เลยครับ! 🚀`;
}
