
import React, { useState } from 'react';
import { X, Send, Loader2, CheckCircle } from 'lucide-react';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose }) => {
  const [status, setStatus] = useState<'IDLE' | 'SUBMITTING' | 'SUCCESS' | 'ERROR'>('IDLE');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('SUBMITTING');
    
    const form = e.currentTarget;
    const data = new FormData(form);

    try {
      const response = await fetch("https://formspree.io/f/mzdznjpg", {
        method: "POST",
        body: data,
        headers: {
            'Accept': 'application/json'
        }
      });

      if (response.ok) {
        setStatus('SUCCESS');
        form.reset();
        // Close modal after 3 seconds
        setTimeout(() => {
            onClose();
            setStatus('IDLE');
        }, 3000);
      } else {
        setStatus('ERROR');
      }
    } catch (error) {
      setStatus('ERROR');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all duration-300 scale-100 border border-slate-100 animate-fade-in-up">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <div>
              <h3 className="text-lg font-bold text-slate-900">Contact Us</h3>
              <p className="text-xs text-slate-500 mt-1">Send us a message directly.</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6">
            {status === 'SUCCESS' ? (
                <div className="flex flex-col items-center justify-center py-10 text-center animate-fade-in">
                    <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-6 ring-4 ring-green-50/50">
                        <CheckCircle size={32} />
                    </div>
                    <h4 className="text-xl font-bold text-slate-900 mb-2">Message Sent!</h4>
                    <p className="text-slate-500 text-sm">Thank you for reaching out.<br/>We'll get back to you shortly.</p>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label htmlFor="email" className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Email Address</label>
                        <input 
                            id="email"
                            type="email" 
                            name="email" 
                            required
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-slate-900 placeholder:text-slate-400"
                            placeholder="your@email.com"
                        />
                    </div>
                    <div>
                        <label htmlFor="message" className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Message</label>
                        <textarea 
                            id="message"
                            name="message" 
                            required
                            rows={4}
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all resize-none text-slate-900 placeholder:text-slate-400"
                            placeholder="Tell us about your project or inquiry..."
                        />
                    </div>
                    
                    {status === 'ERROR' && (
                        <p className="text-xs text-rose-500 font-medium text-center bg-rose-50 p-2 rounded-lg">Something went wrong. Please try again.</p>
                    )}

                    <button 
                        type="submit" 
                        disabled={status === 'SUBMITTING'}
                        className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-95 duration-200"
                    >
                        {status === 'SUBMITTING' ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                        Send Message
                    </button>
                </form>
            )}
        </div>
      </div>
    </div>
  );
};

export default ContactModal;
