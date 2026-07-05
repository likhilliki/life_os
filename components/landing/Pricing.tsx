'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Check, Sparkles, Zap } from 'lucide-react';
import Link from 'next/link';

const plans = [
  {
    name: 'Starter',
    price: 'Free',
    period: '',
    description: 'Perfect for getting started with LifeOS',
    features: [
      '100 memories',
      'Basic knowledge graph',
      '5 AI insights per day',
      '1GB storage',
      '7-day retention',
      'Email support',
    ],
    cta: 'Get Started Free',
    href: '/signup',
    popular: false,
  },
  {
    name: 'Pro',
    price: '$19',
    period: '/month',
    description: 'For individuals who want unlimited memory',
    features: [
      'Unlimited memories',
      'Advanced knowledge graph',
      'Unlimited AI insights',
      '50GB storage',
      '365-day retention',
      'Priority support',
      'API access',
      'Custom integrations',
    ],
    cta: 'Start Pro Trial',
    href: '/signup?plan=pro',
    popular: true,
  },
  {
    name: 'Team',
    price: '$49',
    period: '/user/month',
    description: 'For teams building shared knowledge',
    features: [
      'Everything in Pro',
      'Team knowledge sharing',
      'Admin dashboard',
      'SSO authentication',
      'Advanced analytics',
      'Dedicated support',
      'Custom retention',
      'SLA guarantee',
    ],
    cta: 'Contact Sales',
    href: '/signup?plan=team',
    popular: false,
  },
];

export function Pricing() {
  return (
    <section
      id="pricing"
      className="py-20 lg:py-32 relative overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Pricing</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Simple, <span className="gradient-text">Transparent</span> Pricing
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Start free, upgrade when you need more power
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`relative ${plan.popular ? 'lg:-mt-4 lg:mb-4' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                  <div className="bg-primary text-primary-foreground text-sm font-medium px-4 py-1 rounded-full flex items-center gap-1 shadow-lg">
                    <Zap className="w-3 h-3" />
                    Most Popular
                  </div>
                </div>
              )}
              <div
                className={`glass-card rounded-2xl p-8 h-full card-hover ${
                  plan.popular
                    ? 'border-primary/50 shadow-xl shadow-primary/10'
                    : ''
                }`}
              >
                <div className="mb-6">
                  <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {plan.description}
                  </p>
                </div>
                <div className="mb-6">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-3 text-sm"
                    >
                      <Check className="w-5 h-5 text-primary shrink-0" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link href={plan.href}>
                  <Button
                    className="w-full"
                    variant={plan.popular ? 'default' : 'outline'}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
