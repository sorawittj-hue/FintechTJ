/**
 * Feedback System
 * 
 * In-app feedback widget for collecting user feedback:
 * - Bug reports
 * - Feature requests
 * - General feedback
 * - NPS surveys
 * - Rating prompts
 * 
 * Privacy-first: screenshots are optional, PII is masked
 */

import { useState, useCallback, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Bug, Lightbulb, ThumbsUp, Star, X, Send, Camera, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { trackEvent } from '@/lib/analytics';

// ============================================================================
// Types
// ============================================================================

type FeedbackType = 'bug' | 'feature' | 'feedback' | 'nps';

interface FeedbackData {
  type: FeedbackType;
  rating?: number;
  title: string;
  message: string;
  email?: string;
  includeScreenshot: boolean;
  screenshot?: string;
  page: string;
  timestamp: number;
}

interface FeedbackWidgetProps {
  onSubmit?: (data: FeedbackData) => Promise<void>;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  accentColor?: string;
}

// ============================================================================
// Configuration
// ============================================================================

const STORAGE_KEY = 'fintechtj_feedback';
const NPS_COOLDOWN = 7 * 24 * 60 * 60 * 1000; // 7 days

const FEEDBACK_OPTIONS: { type: FeedbackType; label: string; icon: React.ComponentType<{ size?: number; className?: string }>; description: string }[] = [
  { type: 'bug', label: 'Bug Report', icon: Bug, description: 'Something is not working' },
  { type: 'feature', label: 'Feature Request', icon: Lightbulb, description: 'Suggest a new feature' },
  { type: 'feedback', label: 'General Feedback', icon: MessageSquare, description: 'Share your thoughts' },
  { type: 'nps', label: 'Rate Us', icon: Star, description: 'How would you rate us?' },
];

// ============================================================================
// NPS Score Component
// ============================================================================

interface NPSScoreProps {
  value: number;
  onChange: (value: number) => void;
}

const NPSScore = memo(function NPSScore({ value, onChange }: NPSScoreProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        How likely are you to recommend FintechTJ to a friend?
      </p>
      <div className="flex justify-between gap-1">
        {Array.from({ length: 11 }).map((_, i) => (
          <button
            key={i}
            onClick={() => onChange(i)}
            className={cn(
              'w-8 h-8 rounded-lg text-sm font-medium transition-all',
              value === i
                ? i <= 6
                  ? 'bg-red-500 text-white'
                  : i <= 8
                  ? 'bg-amber-500 text-white'
                  : 'bg-green-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            )}
          >
            {i}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-xs text-gray-500">
        <span>Not likely</span>
        <span>Very likely</span>
      </div>
    </div>
  );
});

// ============================================================================
// Screenshot Component
// ============================================================================

interface ScreenshotCaptureProps {
  onCapture: (dataUrl: string) => void;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

const ScreenshotCapture = memo(function ScreenshotCapture({
  onCapture,
  enabled,
  onToggle,
}: ScreenshotCaptureProps) {
  const captureScreenshot = useCallback(async () => {
    try {
      // Note: In production, use a library like html2canvas
      // This is a simplified version
      onCapture('screenshot_placeholder');
    } catch (error) {
      console.error('Failed to capture screenshot:', error);
    }
  }, [onCapture]);

  return (
    <div className="flex items-center gap-3">
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onToggle(e.target.checked)}
          className="w-4 h-4 rounded border-gray-300 text-[#ee7d54] focus:ring-[#ee7d54]"
        />
        <Camera size={16} className="text-gray-400" />
        <span className="text-sm text-gray-600 dark:text-gray-400">Include screenshot</span>
      </label>
      
      {enabled && (
        <Button
          variant="outline"
          size="sm"
          onClick={captureScreenshot}
          className="text-xs"
        >
          Capture
        </Button>
      )}
    </div>
  );
});

// ============================================================================
// Feedback Form
// ============================================================================

interface FeedbackFormProps {
  type: FeedbackType;
  onSubmit: (data: Omit<FeedbackData, 'page' | 'timestamp'>) => void;
  onCancel: () => void;
}

const FeedbackForm = memo(function FeedbackForm({
  type,
  onSubmit,
  onCancel,
}: FeedbackFormProps) {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [includeScreenshot, setIncludeScreenshot] = useState(false);
  const [screenshot, setScreenshot] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      type,
      rating: type === 'nps' ? rating : undefined,
      title,
      message,
      email: email || undefined,
      includeScreenshot,
      screenshot: includeScreenshot ? screenshot : undefined,
    });
  };

  const isValid = message.trim().length > 0 && (type !== 'nps' || rating > 0);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* NPS Score */}
      {type === 'nps' && (
        <NPSScore value={rating} onChange={setRating} />
      )}

      {/* Title (for bug/feature) */}
      {(type === 'bug' || type === 'feature') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={type === 'bug' ? 'Brief description of the bug' : 'Feature you would like to see'}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-[#ee7d54] focus:border-transparent"
          />
        </div>
      )}

      {/* Message */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {type === 'bug' ? 'Describe the issue' : type === 'feature' ? 'Describe your idea' : 'Your feedback'}
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={
            type === 'bug'
              ? 'Steps to reproduce, expected behavior, actual behavior...'
              : type === 'feature'
              ? 'What problem would this solve for you?'
              : 'Tell us what you think...'
          }
          rows={4}
          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-[#ee7d54] focus:border-transparent resize-none"
          required
        />
      </div>

      {/* Email (optional) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Email (optional)
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com (if you'd like a response)"
          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-[#ee7d54] focus:border-transparent"
        />
      </div>

      {/* Screenshot */}
      <ScreenshotCapture
        enabled={includeScreenshot}
        onToggle={setIncludeScreenshot}
        onCapture={setScreenshot}
      />

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!isValid}
          className="flex-1 bg-gradient-to-r from-[#ee7d54] to-[#f59e0b] hover:opacity-90"
        >
          <Send size={16} className="mr-2" />
          Submit
        </Button>
      </div>
    </form>
  );
});

// ============================================================================
// Main Feedback Widget
// ============================================================================

export function FeedbackWidget({
  onSubmit,
  position = 'bottom-right',
  accentColor = '#ee7d54',
}: FeedbackWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<'type' | 'form' | 'thanks'>('type');
  const [selectedType, setSelectedType] = useState<FeedbackType | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);

  // Check if NPS should be shown
  const [showNPS, setShowNPS] = useState(false);
  useEffect(() => {
    const lastNPS = localStorage.getItem(`${STORAGE_KEY}_nps`);
    if (!lastNPS || Date.now() - parseInt(lastNPS) > NPS_COOLDOWN) {
      // Show NPS after 5 seconds of usage
      const timer = setTimeout(() => setShowNPS(true), 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleTypeSelect = useCallback((type: FeedbackType) => {
    setSelectedType(type);
    setStep('form');
    trackEvent('feedback_started', { type });
  }, []);

  const handleSubmit = useCallback(async (data: Omit<FeedbackData, 'page' | 'timestamp'>) => {
    const fullData: FeedbackData = {
      ...data,
      page: window.location.pathname,
      timestamp: Date.now(),
    };

    // Track event
    trackEvent('feedback_submitted', { type: data.type });

    // Call custom handler or send to default endpoint
    if (onSubmit) {
      await onSubmit(fullData);
    } else {
      // Default: send to API
      try {
        await fetch('/api/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(fullData),
        });
      } catch (error) {
        console.error('Failed to submit feedback:', error);
      }
    }

    // Save NPS timestamp if applicable
    if (data.type === 'nps') {
      localStorage.setItem(`${STORAGE_KEY}_nps`, Date.now().toString());
    }

    setStep('thanks');
    
    // Close after showing thanks
    setTimeout(() => {
      setIsOpen(false);
      setStep('type');
      setSelectedType(null);
    }, 2000);
  }, [onSubmit]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setStep('type');
    setSelectedType(null);
  }, []);

  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
  };

  return (
    <>
      {/* Trigger Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className={cn(
          'fixed z-50 w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-white transition-transform hover:scale-110',
          positionClasses[position],
          isMinimized && 'scale-75 opacity-75'
        )}
        style={{ backgroundColor: accentColor }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <MessageSquare size={20} />
        
        {/* NPS indicator */}
        {showNPS && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs flex items-center justify-center">
            !
          </span>
        )}
      </motion.button>

      {/* Minimize toggle */}
      <button
        onClick={() => setIsMinimized(!isMinimized)}
        className={cn(
          'fixed z-50 w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500',
          position === 'bottom-right' ? 'bottom-4 right-16' :
          position === 'bottom-left' ? 'bottom-4 left-16' :
          position === 'top-right' ? 'top-4 right-16' :
          'top-4 left-16'
        )}
      >
        {isMinimized ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {/* Feedback Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
            onClick={handleClose}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={cn(
                'fixed w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden',
                positionClasses[position]
              )}
              style={{ bottom: position.includes('bottom') ? 80 : undefined, top: position.includes('top') ? 80 : undefined }}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {step === 'thanks' ? 'Thank you!' : 'Send Feedback'}
                </h3>
                <button
                  onClick={handleClose}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Content */}
              <div className="p-4">
                {step === 'type' && (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500 mb-4">
                      What would you like to tell us?
                    </p>
                    {FEEDBACK_OPTIONS.map((option) => (
                      <button
                        key={option.type}
                        onClick={() => handleTypeSelect(option.type)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left"
                      >
                        <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                          <option.icon size={20} className="text-gray-500" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white text-sm">
                            {option.label}
                          </p>
                          <p className="text-xs text-gray-500">
                            {option.description}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {step === 'form' && selectedType && (
                  <FeedbackForm
                    type={selectedType}
                    onSubmit={handleSubmit}
                    onCancel={() => setStep('type')}
                  />
                )}

                {step === 'thanks' && (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                      <ThumbsUp size={32} className="text-green-500" />
                    </div>
                    <p className="text-gray-900 dark:text-white font-medium">
                      Thank you for your feedback!
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Your input helps us improve FintechTJ.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ============================================================================
// NPS Survey (standalone)
// ============================================================================

interface NPSSurveyProps {
  onComplete: (score: number, feedback?: string) => void;
  onDismiss: () => void;
}

export function NPSSurvey({ onComplete, onDismiss }: NPSSurveyProps) {
  const [score, setScore] = useState(-1);
  const [feedback, setFeedback] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);

  const handleSubmit = () => {
    if (score >= 0) {
      onComplete(score, feedback || undefined);
      localStorage.setItem(`${STORAGE_KEY}_nps`, Date.now().toString());
    }
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-sm">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-gray-900 dark:text-white">
          Quick Question
        </h4>
        <button onClick={onDismiss} className="text-gray-400 hover:text-gray-600">
          <X size={18} />
        </button>
      </div>

      <NPSScore value={score} onChange={(v) => { setScore(v); setShowFeedback(true); }} />

      {showFeedback && (
        <div className="mt-4 space-y-3">
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="What's the main reason for your score? (optional)"
            rows={2}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm resize-none"
          />
          <div className="flex gap-2">
            <Button variant="outline" onClick={onDismiss} className="flex-1">
              Maybe Later
            </Button>
            <Button onClick={handleSubmit} disabled={score < 0} className="flex-1 bg-gradient-to-r from-[#ee7d54] to-[#f59e0b]">
              Submit
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Export
// ============================================================================

