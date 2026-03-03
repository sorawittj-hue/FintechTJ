import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  LayoutDashboard, 
  Wallet, 
  TrendingUp, 
  Newspaper,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const ONBOARDING_KEY = 'nava2-onboarding-completed';

const steps = [
  {
    id: 1,
    title: 'ยินดีต้อนรับสู่ Nava² Finance',
    description: 'แอพจัดการพอร์ตการลงทุนที่เข้าใจง่าย ใช้ฟรี และอัปเดตข้อมูลแบบเรียลไทม์',
    icon: Sparkles,
    color: 'from-[#ee7d54] to-[#f59e0b]',
  },
  {
    id: 2,
    title: 'ภาพรวมพอร์ต',
    description: 'ดูมูลค่าพอร์ต กำไร/ขาดทุน และแนวโน้มการลงทุนของคุณได้ที่หน้าแรก',
    icon: LayoutDashboard,
    color: 'from-blue-500 to-cyan-500',
  },
  {
    id: 3,
    title: 'จัดการพอร์ต',
    description: 'เพิ่ม แก้ไข หรือลบสินทรัพย์ในพอร์ตของคุณ ติดตามผลการลงทุนแบบเรียลไทม์',
    icon: Wallet,
    color: 'from-green-500 to-emerald-500',
  },
  {
    id: 4,
    title: 'ติดตามตลาด',
    description: 'ดูราคาคริปโตและหุ้นแบบเรียลไทม์ พร้อมข้อมูลการขึ้นลงและปริมาณการซื้อขาย',
    icon: TrendingUp,
    color: 'from-purple-500 to-pink-500',
  },
  {
    id: 5,
    title: 'ข่าวสารสำคัญ',
    description: 'อัปเดตข่าวสารและเหตุการณ์ที่ส่งผลต่อตลาด พร้อมการวิเคราะห์เบื้องต้น',
    icon: Newspaper,
    color: 'from-orange-500 to-red-500',
  },
];

export function Onboarding() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasCompleted, setHasCompleted] = useState(true);

  useEffect(() => {
    // ตรวจสอบว่าเคยดู onboarding แล้วหรือไม่
    const completed = localStorage.getItem(ONBOARDING_KEY);
    if (!completed) {
      setHasCompleted(false);
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleComplete = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setHasCompleted(true);
    setIsOpen(false);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const resetOnboarding = () => {
    localStorage.removeItem(ONBOARDING_KEY);
    setHasCompleted(false);
    setCurrentStep(0);
    setIsOpen(true);
  };

  const step = steps[currentStep];
  const Icon = step.icon;

  // ถ้ายังไม่เคยดูและยังไม่เปิด
  if (hasCompleted && !isOpen) {
    return null;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="w-full max-w-md"
            onClick={e => e.stopPropagation()}
          >
            <Card className="overflow-hidden">
              {/* Progress Bar */}
              <div className="h-1 bg-gray-100">
                <motion.div
                  className="h-full bg-gradient-to-r from-[#ee7d54] to-[#f59e0b]"
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              {/* Close Button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors z-10"
              >
                <X size={20} className="text-gray-400" />
              </button>

              {/* Content */}
              <div className="p-8">
                {/* Step Counter */}
                <p className="text-xs text-gray-400 mb-4">
                  ขั้นตอนที่ {currentStep + 1} จาก {steps.length}
                </p>

                {/* Icon */}
                <motion.div
                  key={step.id}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                  className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mx-auto mb-6 shadow-lg`}
                >
                  <Icon size={36} className="text-white" />
                </motion.div>

                {/* Title & Description */}
                <motion.div
                  key={`text-${step.id}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-center"
                >
                  <h2 className="text-xl font-bold text-gray-900 mb-3">
                    {step.title}
                  </h2>
                  <p className="text-gray-500 leading-relaxed">
                    {step.description}
                  </p>
                </motion.div>

                {/* Navigation */}
                <div className="flex items-center justify-between mt-8">
                  <Button
                    variant="ghost"
                    onClick={handlePrev}
                    disabled={currentStep === 0}
                    className={currentStep === 0 ? 'invisible' : ''}
                  >
                    <ChevronLeft size={16} className="mr-1" />
                    ก่อนหน้า
                  </Button>

                  {/* Dots */}
                  <div className="flex items-center gap-2">
                    {steps.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentStep(index)}
                        className={`w-2 h-2 rounded-full transition-all duration-200 ${
                          index === currentStep
                            ? 'w-6 bg-gradient-to-r from-[#ee7d54] to-[#f59e0b]'
                            : 'bg-gray-200 hover:bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>

                  <Button
                    onClick={handleNext}
                    className="bg-gradient-to-r from-[#ee7d54] to-[#f59e0b] hover:opacity-90"
                  >
                    {currentStep === steps.length - 1 ? 'เริ่มต้นใช้งาน' : 'ถัดไป'}
                    {currentStep !== steps.length - 1 && <ChevronRight size={16} className="ml-1" />}
                  </Button>
                </div>

                {/* Skip Button */}
                {currentStep < steps.length - 1 && (
                  <button
                    onClick={handleSkip}
                    className="w-full text-center text-sm text-gray-400 hover:text-gray-600 mt-4"
                  >
                    ข้ามการแนะนำ
                  </button>
                )}
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Export function to reset onboarding (for settings)
export function resetOnboarding() {
  localStorage.removeItem(ONBOARDING_KEY);
}
