import { motion } from 'framer-motion';
import { useState } from 'react';
import { toast } from 'sonner';
import { 
  HelpCircle,
  Search,
  Book,
  MessageSquare,
  Video,
  Mail,
  Phone,
  ChevronDown,
  Wallet,
  TrendingUp,
  BarChart3,
  Shield,
  User
} from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQItem[] = [
  {
    category: 'Account',
    question: 'How do I reset my password?',
    answer: 'Go to Settings > Security > Change Password. You can also request a password reset link by clicking "Forgot Password" on the login page.',
  },
  {
    category: 'Account',
    question: 'How do I enable two-factor authentication?',
    answer: 'Navigate to Settings > Security > Two-Factor Authentication and toggle it on. You\'ll need to download an authenticator app like Google Authenticator or Authy.',
  },
  {
    category: 'Trading',
    question: 'What trading fees do you charge?',
    answer: 'Our fee structure is 0.1% for trades under $10,000, 0.08% for trades between $10,000-$50,000, and 0.05% for trades above $50,000.',
  },
  {
    category: 'Trading',
    question: 'How do I set price alerts?',
    answer: 'Go to any asset page and click the Bell icon. You can set alerts for specific price points or percentage changes.',
  },
  {
    category: 'Deposits & Withdrawals',
    question: 'How long do withdrawals take?',
    answer: 'Bank withdrawals typically take 1-3 business days. Crypto withdrawals are processed within 30 minutes to 2 hours.',
  },
  {
    category: 'Deposits & Withdrawals',
    question: 'What is the minimum deposit amount?',
    answer: 'The minimum deposit is $10 for bank transfers and $50 for credit card deposits.',
  },
  {
    category: 'Portfolio',
    question: 'How is my portfolio performance calculated?',
    answer: 'Portfolio performance is calculated using time-weighted returns that account for all deposits, withdrawals, and market value changes.',
  },
  {
    category: 'Security',
    question: 'Is my data secure?',
    answer: 'Yes, we use bank-level 256-bit encryption, two-factor authentication, and biometric login options to secure your data.',
  },
];

const categories = [
  { id: 'getting-started', label: 'Getting Started', icon: Book },
  { id: 'account', label: 'Account', icon: User },
  { id: 'trading', label: 'Trading', icon: TrendingUp },
  { id: 'portfolio', label: 'Portfolio', icon: BarChart3 },
  { id: 'deposits', label: 'Deposits & Withdrawals', icon: Wallet },
  { id: 'security', label: 'Security', icon: Shield },
];

const quickLinks = [
  { label: 'Getting Started Guide', icon: Book, color: 'bg-blue-100 text-blue-500' },
  { label: 'Video Tutorials', icon: Video, color: 'bg-purple-100 text-purple-500' },
  { label: 'Trading FAQ', icon: HelpCircle, color: 'bg-green-100 text-green-500' },
  { label: 'Contact Support', icon: MessageSquare, color: 'bg-orange-100 text-orange-500' },
];

export function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactForm, setContactForm] = useState({ subject: '', message: '' });

  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || 
                           faq.category.toLowerCase() === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSubmitContact = () => {
    if (!contactForm.subject || !contactForm.message) {
      toast.error('Please fill in all fields');
      return;
    }
    toast.success('Your message has been sent! We\'ll respond within 24 hours.');
    setContactForm({ subject: '', message: '' });
    setShowContactForm(false);
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="text-center py-8"
      >
        <h2 className="text-2xl font-bold mb-2">Help Center</h2>
        <p className="text-gray-500">Find answers to your questions</p>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="relative"
      >
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for help..."
          className="w-full pl-12 pr-4 py-4 text-lg border border-gray-200 rounded-2xl focus:outline-none focus:border-[#ee7d54]"
        />
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {quickLinks.map((link, index) => {
          const Icon = link.icon;
          return (
            <button
              key={link.label}
              onClick={() => index === 3 && setShowContactForm(true)}
              className={`p-4 rounded-2xl ${link.color} hover:opacity-80 transition-opacity`}
            >
              <Icon size={24} className="mb-2" />
              <p className="text-sm font-medium">{link.label}</p>
            </button>
          );
        })}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-1"
        >
          <div className="bg-white rounded-2xl p-4 card-shadow">
            <h3 className="font-semibold mb-3">Categories</h3>
            <div className="space-y-1">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`w-full text-left px-4 py-2 rounded-xl transition-colors ${
                  selectedCategory === 'all' ? 'bg-[#ee7d54] text-white' : 'hover:bg-gray-50'
                }`}
              >
                All Topics
              </button>
              {categories.map((cat) => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.label)}
                    className={`w-full text-left px-4 py-2 rounded-xl transition-colors flex items-center gap-2 ${
                      selectedCategory === cat.label ? 'bg-[#ee7d54] text-white' : 'hover:bg-gray-50'
                    }`}
                  >
                    <Icon size={16} />
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-3 space-y-4"
        >
          {filteredFAQs.map((faq, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl overflow-hidden card-shadow"
            >
              <button
                onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                className="w-full flex items-center justify-between p-5 text-left"
              >
                <div>
                  <span className="text-xs text-[#ee7d54] font-medium">{faq.category}</span>
                  <p className="font-medium mt-1">{faq.question}</p>
                </div>
                <ChevronDown 
                  size={20} 
                  className={`text-gray-400 transition-transform ${expandedFAQ === index ? 'rotate-180' : ''}`}
                />
              </button>
              {expandedFAQ === index && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="px-5 pb-5"
                >
                  <p className="text-gray-600">{faq.answer}</p>
                </motion.div>
              )}
            </div>
          ))}

          {filteredFAQs.length === 0 && (
            <div className="text-center py-12">
              <HelpCircle size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No results found</p>
              <button
                onClick={() => setShowContactForm(true)}
                className="text-[#ee7d54] font-medium mt-2 hover:underline"
              >
                Contact Support
              </button>
            </div>
          )}
        </motion.div>
      </div>

      {showContactForm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="bg-white rounded-3xl w-full max-w-lg p-6"
          >
            <h3 className="text-xl font-bold mb-4">Contact Support</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <select
                  value={contactForm.subject}
                  onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#ee7d54]"
                >
                  <option value="">Select a topic</option>
                  <option value="account">Account Issue</option>
                  <option value="trading">Trading Question</option>
                  <option value="deposit">Deposit/Withdrawal</option>
                  <option value="technical">Technical Issue</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  rows={4}
                  placeholder="Describe your issue..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#ee7d54] resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowContactForm(false)}
                className="flex-1 py-3 border border-gray-200 rounded-xl font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitContact}
                className="flex-1 py-3 bg-[#ee7d54] text-white rounded-xl font-medium hover:bg-[#dd6d44]"
              >
                Send Message
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="bg-gradient-to-r from-[#ee7d54] to-[#f59e0b] rounded-3xl p-6 text-white"
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-lg">Still need help?</h3>
            <p className="text-white/80">Our support team is available 24/7</p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-xl hover:bg-white/30 transition-colors">
              <Mail size={18} />
              <span>Email</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-xl hover:bg-white/30 transition-colors">
              <Phone size={18} />
              <span>Call</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default HelpCenter;
