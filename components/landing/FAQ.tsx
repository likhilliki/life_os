'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

const faqs = [
  {
    question: 'What makes LifeOS different from other AI assistants?',
    answer:
      'Unlike traditional AI assistants that forget after each conversation, LifeOS maintains a persistent knowledge graph of your entire digital life. Every interaction, document, and memory is connected and searchable. The AI doesn\'t just answer questions—it reasons over your entire knowledge base.',
  },
  {
    question: 'How is my data protected?',
    answer:
      'Your data is encrypted at rest and in transit using AES-256 encryption. We use row-level security in our database, meaning your data is completely isolated from other users. You have full control and can delete your data at any time.',
  },
  {
    question: 'What file types can I upload?',
    answer:
      'LifeOS supports PDF, DOCX, TXT, Markdown, CSV, images (PNG, JPG, WebP), audio files, and more. You can also import content from URLs, and we\'re continuously adding new formats.',
  },
  {
    question: 'Can I export my data?',
    answer:
      'Yes! You maintain full ownership of your data. Export your entire knowledge graph, memories, and connections at any time in standard formats like JSON and CSV.',
  },
  {
    question: 'How does the AI generate insights?',
    answer:
      'LifeOS uses advanced AI to analyze patterns, connections, and relationships in your knowledge graph. It identifies trends in your productivity, highlights connections you might have missed, and surfaces insights about your goals and projects.',
  },
  {
    question: 'Is there a free trial?',
    answer:
      'Yes, our Starter plan is completely free with 100 memories and basic features. The Pro plan comes with a 14-day free trial, no credit card required.',
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section
      id="faq"
      className="py-20 lg:py-32 bg-gradient-to-b from-muted/30 to-background relative overflow-hidden"
    >
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <HelpCircle className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">FAQ</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Frequently Asked <span className="gradient-text">Questions</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Everything you need to know about LifeOS
          </p>
        </motion.div>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <motion.div
              key={faq.question}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full glass-card rounded-xl p-6 text-left card-hover"
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="font-medium">{faq.question}</span>
                  <motion.div
                    animate={{ rotate: openIndex === i ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="shrink-0"
                  >
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  </motion.div>
                </div>
                <AnimatePresence>
                  {openIndex === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <p className="text-muted-foreground mt-4 pt-4 border-t border-border">
                        {faq.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
