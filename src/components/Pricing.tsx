import React, { useState } from 'react';
import { Check, Zap, Shield, Crown, ArrowRight, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { User } from 'firebase/auth';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { toast } from 'sonner';

interface PricingProps {
  user: User | null;
}

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: '0',
    description: 'Perfect for new wholesalers getting started.',
    features: [
      'Up to 100 Leads',
      'Basic CRM',
      'Document Generator (Limited)',
      'Email Support',
    ],
    buttonText: 'Current Plan',
    highlight: false,
    priceId: null,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '99',
    description: 'For active investors closing 1-2 deals a month.',
    features: [
      'Unlimited Leads',
      'AI Deal Scorer (Unlimited)',
      'E-Signature Integration',
      'Skip Tracing (100/mo)',
      'SMS & Email Blasts',
      'Priority Support',
    ],
    buttonText: 'Upgrade to Pro',
    highlight: true,
    priceId: import.meta.env.VITE_STRIPE_PRICE_ID_PRO,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '299',
    description: 'For teams and high-volume operations.',
    features: [
      'Everything in Pro',
      'Team Collaboration',
      'Custom White-labeling',
      'API Access',
      'Dedicated Account Manager',
      'Bulk Skip Tracing Discounts',
    ],
    buttonText: 'Go Enterprise',
    highlight: false,
    priceId: import.meta.env.VITE_STRIPE_PRICE_ID_ENTERPRISE,
  },
];

export default function Pricing({ user }: PricingProps) {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleSubscribe = async (plan: typeof PLANS[0]) => {
    if (!user) {
      toast.error('Please sign in to subscribe');
      return;
    }

    if (!plan.priceId) return;

    try {
      setLoadingPlan(plan.id);
      
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: plan.priceId,
          userId: user.uid,
          userEmail: user.email,
        }),
      });

      const session = await response.json();

      if (session.error) {
        throw new Error(session.error);
      }

      if (session.url) {
        window.location.href = session.url;
      }
    } catch (error) {
      console.error('Subscription error:', error);
      toast.error('Failed to initiate checkout. Please check your Stripe configuration.');
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="space-y-12 pb-20">
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-serif italic font-bold text-white tracking-tight">
          Simple, Transparent Pricing
        </h1>
        <p className="text-zinc-500 text-lg">
          Choose the plan that fits your business stage. Scale as you grow.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {PLANS.map((plan) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "relative p-8 rounded-[2.5rem] border flex flex-col h-full transition-all duration-500",
              plan.highlight 
                ? "bg-zinc-900 border-blue-500/50 shadow-2xl shadow-blue-500/10 scale-105 z-10" 
                : "bg-zinc-900/30 border-zinc-800 hover:border-zinc-700"
            )}
          >
            {plan.highlight && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full shadow-lg">
                Most Popular
              </div>
            )}

            <div className="mb-8">
              <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-white">${plan.price}</span>
                <span className="text-zinc-500 text-sm">/month</span>
              </div>
              <p className="text-zinc-500 text-sm mt-4 leading-relaxed">
                {plan.description}
              </p>
            </div>

            <div className="flex-1 space-y-4 mb-8">
              {plan.features.map((feature, i) => (
                <div key={i} className="flex items-start gap-3 text-sm text-zinc-300">
                  <div className={cn(
                    "mt-0.5 p-0.5 rounded-full",
                    plan.highlight ? "bg-blue-500/20 text-blue-400" : "bg-zinc-800 text-zinc-500"
                  )}>
                    <Check size={12} />
                  </div>
                  {feature}
                </div>
              ))}
            </div>

            <button
              onClick={() => handleSubscribe(plan)}
              disabled={plan.id === 'starter' || loadingPlan !== null}
              className={cn(
                "w-full py-4 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                plan.highlight
                  ? "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20"
                  : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700",
                (plan.id === 'starter' || loadingPlan !== null) && "opacity-50 cursor-not-allowed"
              )}
            >
              {loadingPlan === plan.id ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  {plan.buttonText}
                  {plan.id !== 'starter' && <ArrowRight size={14} />}
                </>
              )}
            </button>
          </motion.div>
        ))}
      </div>

      {/* Trust Section */}
      <div className="bg-zinc-900/30 border border-zinc-800 rounded-[2.5rem] p-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield size={24} />
          </div>
          <h4 className="text-white font-bold">Secure Payments</h4>
          <p className="text-zinc-500 text-xs leading-relaxed">
            All transactions are processed securely via Stripe with 256-bit encryption.
          </p>
        </div>
        <div className="text-center space-y-3">
          <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Zap size={24} />
          </div>
          <h4 className="text-white font-bold">Instant Access</h4>
          <p className="text-zinc-500 text-xs leading-relaxed">
            Get immediate access to all pro features the moment your subscription is active.
          </p>
        </div>
        <div className="text-center space-y-3">
          <div className="w-12 h-12 bg-amber-500/10 text-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Crown size={24} />
          </div>
          <h4 className="text-white font-bold">Cancel Anytime</h4>
          <p className="text-zinc-500 text-xs leading-relaxed">
            No long-term contracts. You can cancel your subscription at any time from your settings.
          </p>
        </div>
      </div>
    </div>
  );
}
