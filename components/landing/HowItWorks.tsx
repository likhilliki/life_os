'use client';

import { motion } from 'framer-motion';
import { Upload, Brain, Sparkles, ArrowRight } from 'lucide-react';

const steps = [
  {
    icon: Upload,
    title: 'Upload Your Data',
    description:
      'Connect your apps or upload documents, emails, notes, and files. LifeOS supports PDF, DOCX, images, URLs, and more.',
    color: '#3B82F6',
  },
  {
    icon: Brain,
    title: 'AI Processes',
    description:
      'Our AI extracts entities, relationships, and knowledge. Everything is stored in a structured knowledge graph.',
    color: '#10B981',
  },
  {
    icon: Sparkles,
    title: 'Gain Insights',
    description:
      'Query your memory, discover connections, and receive AI-generated insights about patterns in your life.',
    color: '#F59E0B',
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="py-20 lg:py-32 bg-gradient-to-b from-background to-muted/30 relative overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            How It <span className="gradient-text">Works</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Three simple steps to build your permanent digital memory
          </p>
        </motion.div>

        <div className="relative">
          {/* Connection Line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent -translate-y-1/2" />

          <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="relative"
              >
                {/* Step Number */}
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 lg:top-auto lg:left-1/2 lg:-translate-x-1/2 lg:translate-y-0">
                  <div className="w-8 h-8 rounded-full bg-background border-2 border-primary flex items-center justify-center text-sm font-bold text-primary z-10 relative">
                    {i + 1}
                  </div>
                </div>

                <div className="glass-card rounded-2xl p-8 pt-10 lg:pt-8 text-center card-hover">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-6"
                    style={{ backgroundColor: step.color + '20' }}
                  >
                    <step.icon
                      className="w-8 h-8"
                      style={{ color: step.color }}
                    />
                  </motion.div>
                  <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>

                {/* Arrow (hidden on last item and mobile) */}
                {i < steps.length - 1 && (
                  <div className="hidden lg:flex absolute top-1/2 -right-6 -translate-y-1/2 text-primary/50">
                    <ArrowRight className="w-6 h-6" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
