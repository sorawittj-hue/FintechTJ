import React, { useState, useEffect, useRef } from 'react';
import { 
  Terminal, 
  X, 
  Copy, 
  Trash2, 
  AlertCircle, 
  Info, 
  AlertTriangle,
  Maximize2,
  Minimize2,
  Bug
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface LogEntry {
  id: string;
  timestamp: Date;
  type: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  data?: unknown;
  stack?: string;
  source?: string;
}

// Global log storage for the session
const globalLogs: LogEntry[] = [];
let onLogUpdate: (() => void) | null = null;

// Stable Session ID generated once per app load
const SESSION_ID = Math.random().toString(36).substring(7).toUpperCase();

// Intercept console methods
const originalConsole = {
  log: console.log,
  info: console.info,
  warn: console.warn,
  error: console.error,
  debug: console.debug,
};

function addLog(type: LogEntry['type'], args: unknown[]) {
  const message = args.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
  ).join(' ');

  const entry: LogEntry = {
    id: Math.random().toString(36).substring(2, 9),
    timestamp: new Date(),
    type,
    message,
    data: args.length > 1 ? args.slice(1) : undefined,
    stack: type === 'error' ? new Error().stack : undefined,
    source: 'Console',
  };

  globalLogs.push(entry);
  if (globalLogs.length > 200) globalLogs.shift();
  if (onLogUpdate) onLogUpdate();
}

// Override console
console.info = (...args) => {
  originalConsole.info(...args);
  addLog('info', args);
};
console.warn = (...args) => {
  originalConsole.warn(...args);
  addLog('warn', args);
};
console.error = (...args) => {
  originalConsole.error(...args);
  addLog('error', args);
};
console.debug = (...args) => {
  originalConsole.debug(...args);
  addLog('debug', args);
};

// Only log initialization in debug mode
if (import.meta.env.VITE_DEBUG === 'true') {
  console.log('[AppMonitor] Initialized');
}

export function AppMonitor() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>(() => [...globalLogs]);
  const [filter, setFilter] = useState<LogEntry['type'] | 'all'>('all');
  const scrollRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    onLogUpdate = () => {
      setLogs([...globalLogs]);
    };
    return () => {
      onLogUpdate = null;
    };
  }, []);

  useEffect(() => {
    if (isOpen && scrollRef.current) {
      const scrollArea = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollArea) {
        scrollArea.scrollTop = scrollArea.scrollHeight;
      }
    }
  }, [logs, isOpen]);

  const copyAllLogs = () => {
    const text = logs
      .filter(l => filter === 'all' || l.type === filter)
      .map(l => `[${l.timestamp.toISOString()}] [${l.type.toUpperCase()}] ${l.message}${l.stack ? '\n' + l.stack : ''}`)
      .join('\n\n');
    
    navigator.clipboard.writeText(text);
    toast.success('All logs copied to clipboard!');
  };

  const clearLogs = () => {
    globalLogs.length = 0;
    setLogs([]);
    toast.success('Logs cleared');
  };

  const copyBugReport = () => {
    const errorLogs = logs.filter(l => l.type === 'error');
    if (errorLogs.length === 0) {
      toast.info('No errors to report');
      return;
    }

    const report = [
      '### BUG REPORT FOR AI AGENT ###',
      `Session ID: ${SESSION_ID}`,
      `Timestamp: ${new Date().toISOString()}`,
      `Platform: ${navigator.platform}`,
      `User Agent: ${navigator.userAgent}`,
      '',
      '--- ERROR LOGS ---',
      ...errorLogs.map(l => (
        `[${l.timestamp.toLocaleTimeString()}] [${l.source}] ${l.message}\n` +
        (l.stack ? `Stack: ${l.stack.split('\n').slice(0, 5).join('\n')}\n` : '')
      )),
      '',
      '--- CONSOLE HISTORY (Last 10) ---',
      ...logs.slice(-10).map(l => `[${l.type.toUpperCase()}] ${l.message.slice(0, 200)}`)
    ].join('\n');

    navigator.clipboard.writeText(report);
    toast.success('Bug report formatted for AI copied!');
  };

  const filteredLogs = logs.filter(l => filter === 'all' || l.type === filter);

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="icon"
        className="fixed bottom-4 right-4 z-[9999] rounded-full w-12 h-12 shadow-lg bg-background border-[#ee7d54] text-[#ee7d54] hover:bg-[#ee7d54] hover:text-white"
        onClick={() => setIsOpen(true)}
      >
        <Bug className="w-6 h-6" />
        {logs.filter(l => l.type === 'error').length > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] text-white font-bold">
            {logs.filter(l => l.type === 'error').length}
          </span>
        )}
      </Button>
    );
  }

  return (
    <Card className={cn(
      "fixed z-[9999] shadow-2xl transition-all duration-300 flex flex-col overflow-hidden border-[#ee7d54]/30",
      isMaximized 
        ? "top-4 left-4 right-4 bottom-4" 
        : "bottom-4 right-4 w-[450px] max-h-[600px] h-[70vh]"
    )}>
      {/* Header */}
      <div className="bg-[#ee7d54] text-white p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5" />
          <span className="font-bold text-sm">App Performance Monitor</span>
          <Badge variant="outline" className="text-[10px] bg-white/20 text-white border-none">
            {logs.length} entries
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7 text-white hover:bg-white/20" onClick={() => setIsMaximized(!isMaximized)}>
            {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-white hover:bg-white/20" onClick={() => setIsOpen(false)}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="p-2 border-b bg-muted/30 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Button 
            variant={filter === 'all' ? 'default' : 'ghost'} 
            size="sm" 
            className="h-7 text-xs px-2"
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button 
            variant={filter === 'error' ? 'destructive' : 'ghost'} 
            size="sm" 
            className="h-7 text-xs px-2"
            onClick={() => setFilter('error')}
          >
            Errors
          </Button>
          <Button 
            variant={filter === 'warn' ? 'secondary' : 'ghost'} 
            size="sm" 
            className="h-7 text-xs px-2"
            onClick={() => setFilter('warn')}
          >
            Warns
          </Button>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={copyAllLogs}>
            <Copy className="w-3 h-3" /> Copy All
          </Button>
          <Button variant="outline" size="sm" className="h-7 gap-1 text-xs bg-[#ee7d54]/10 text-[#ee7d54] border-[#ee7d54]/30" onClick={() => copyBugReport()}>
            <Bug className="w-3 h-3" /> AI Report
          </Button>
          <Button variant="outline" size="sm" className="h-7 gap-1 text-xs text-destructive" onClick={clearLogs}>
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Log List */}
      <ScrollArea className="flex-1 bg-black/5 dark:bg-white/5" ref={scrollRef}>
        <div className="p-3 space-y-2 font-mono text-[11px]">
          {filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <Info className="w-8 h-8 mb-2 opacity-20" />
              <p>No logs found</p>
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div 
                key={log.id} 
                className={cn(
                  "p-2 rounded border-l-4 break-words",
                  log.type === 'error' ? "bg-red-50 dark:bg-red-900/10 border-red-500" :
                  log.type === 'warn' ? "bg-amber-50 dark:bg-amber-900/10 border-amber-500" :
                  "bg-muted border-slate-400"
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5">
                    {log.type === 'error' ? <AlertCircle className="w-3 h-3 text-red-500" /> :
                     log.type === 'warn' ? <AlertTriangle className="w-3 h-3 text-amber-500" /> :
                     <Info className="w-3 h-3 text-blue-500" />}
                    <span className="font-bold uppercase opacity-70">
                      {log.type}
                    </span>
                    <span className="text-muted-foreground">
                      {log.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-[9px] h-4 py-0 opacity-50">
                    {log.source}
                  </Badge>
                </div>
                <div className="whitespace-pre-wrap leading-relaxed">
                  {log.message}
                </div>
                {log.stack && (
                  <details className="mt-2 opacity-70">
                    <summary className="cursor-pointer hover:underline text-[9px]">View Stack Trace</summary>
                    <pre className="mt-1 p-2 bg-black/10 rounded text-[9px] overflow-x-auto max-w-full">
                      {log.stack}
                    </pre>
                  </details>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-2 border-t text-[10px] text-muted-foreground flex justify-between bg-muted/20">
        <span>Click "Copy All" and send to AI agent for fixing.</span>
        <span>ID: {SESSION_ID}</span>
      </div>
    </Card>
  );
}
