'use client';

import { motion } from 'framer-motion';
import {
  Brain,
  Network,
  Sparkles,
  Target,
  Calendar,
  Search,
  Upload,
  LineChart,
  Shield,
  Zap,
} from 'lucide-react';

const features = [
  {
    icon: Brain,
    title: 'Persistent Memory',
    description:
      'Every interaction, document, and idea is stored in a knowledge graph that learns and evolves with you.',
    color: '#3B82F6',
  },
  {
    icon: Network,
    title: 'Knowledge Graph',
    description:
      'Visualize connections between people, projects, ideas, and goals in an interactive network view.',
    color: '#10B981',
  },
  {
    icon: Sparkles,
    title: 'AI Insights',
    description:
      'Receive daily intelligent insights about patterns, productivity, and opportunities in your life.',
    color: '#F59E0B',
  },
  {
    icon: Target,
    title: 'Goal Tracking',
    description:
      'Set goals that automatically connect to related memories, tasks, and projects.',
    color: '#EC4899',
  },
  {
    icon: Calendar,
    title: 'Smart Timeline',
    description:
      'Browse your memories chronologically with intelligent filtering and search.',
    color: '#8B5CF6',
  },
  {
    icon: Search,
    title: 'Universal Search',
    description:
      'Find anything instantly with semantic search across all your connected memories.',
    color: '#EF4444',
  },
  {
    icon: Upload,
    title: 'Memory Ingestion',
    description:
      'Upload PDFs, images, URLs, and documents. Extract knowledge automatically.',
    color: '#06B6D4',
  },
  {
    icon: LineChart,
    title: 'Analytics',
    description:
      'Understand your knowledge growth, productivity patterns, and memory health.',
    color: '#84CC16',
  },
  {
    icon: Shield,
    title: 'Privacy First',
    description:
      'Your data is encrypted and you have full control. Delete anytime.',
    color: '#F97316',
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export function Features() {
  return (
    <section id="features" className="py-20 lg:py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-primary/10 to-transparent blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Features</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Everything You Need for a{' '}
            <span className="gradient-text">Perfect Memory</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            LifeOS combines cutting-edge AI with intuitive design to give you
            complete control over your digital life.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={item}
              whileHover={{ y: -4 }}
              className="group relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative glass-card rounded-2xl p-6 h-full card-hover">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: feature.color + '20' }}
                >
                  <feature.icon
                    className="w-6 h-6"
                    style={{ color: feature.color }}
                  />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
