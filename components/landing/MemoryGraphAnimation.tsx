'use client';

import { motion } from 'framer-motion';
import { useMemo } from 'react';

const nodeTypes = [
  { type: 'person', color: '#3B82F6', label: 'People' },
  { type: 'project', color: '#10B981', label: 'Projects' },
  { type: 'idea', color: '#F59E0B', label: 'Ideas' },
  { type: 'goal', color: '#EC4899', label: 'Goals' },
  { type: 'note', color: '#8B5CF6', label: 'Notes' },
  { type: 'task', color: '#EF4444', label: 'Tasks' },
];

const generateNodes = () => {
  const nodes: { id: string; x: number; y: number; color: string; size: number; label: string }[] = [];
  const centerX = 200;
  const centerY = 200;

  // Center node
  nodes.push({ id: 'center', x: centerX, y: centerY, color: '#0EA5E9', size: 40, label: 'You' });

  // Surrounding nodes
  nodeTypes.forEach((nodeType, i) => {
    const angle = (i / nodeTypes.length) * 2 * Math.PI - Math.PI / 2;
    const radius = 120;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    nodes.push({
      id: nodeType.type,
      x,
      y,
      color: nodeType.color,
      size: 30,
      label: nodeType.label,
    });
  });

  // Outer nodes
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * 2 * Math.PI;
    const radius = 180;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    const nodeType = nodeTypes[i % nodeTypes.length];
    nodes.push({
      id: `outer-${i}`,
      x,
      y,
      color: nodeType.color,
      size: 15,
      label: '',
    });
  }

  return nodes;
};

const generateEdges = (nodes: ReturnType<typeof generateNodes>) => {
  const edges: { from: string; to: string }[] = [];

  // Connect center to first ring
  for (let i = 1; i <= nodeTypes.length; i++) {
    edges.push({ from: 'center', to: nodes[i].id });
  }

  // Connect first ring to outer
  for (let i = 0; i < 12; i++) {
    const innerNode = (i % nodeTypes.length) + 1;
    edges.push({ from: nodes[innerNode].id, to: `outer-${i}` });
  }

  // Connect some outer nodes
  for (let i = 0; i < 12; i++) {
    edges.push({ from: `outer-${i}`, to: `outer-${(i + 1) % 12}` });
  }

  return edges;
};

export function MemoryGraphAnimation() {
  const nodes = useMemo(() => generateNodes(), []);
  const edges = useMemo(() => generateEdges(nodes), [nodes]);

  return (
    <div className="relative w-[400px] h-[400px] mx-auto">
      <svg width="400" height="400" className="absolute inset-0">
        {/* Edges */}
        {edges.map((edge, i) => {
          const from = nodes.find((n) => n.id === edge.from);
          const to = nodes.find((n) => n.id === edge.to);
          if (!from || !to) return null;

          return (
            <motion.line
              key={i}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke="url(#edgeGradient)"
              strokeWidth="1.5"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.3 }}
              transition={{
                duration: 1,
                delay: i * 0.05,
              }}
            />
          );
        })}

        {/* Gradient Definition */}
        <defs>
          <linearGradient id="edgeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.5" />
          </linearGradient>
        </defs>

        {/* Nodes */}
        {nodes.map((node, i) => (
          <motion.g key={node.id}>
            {/* Glow */}
            <motion.circle
              cx={node.x}
              cy={node.y}
              r={node.size}
              fill={node.color}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 0.2, scale: 1 }}
              transition={{
                duration: 0.5,
                delay: i * 0.05,
              }}
              className="blur-xl"
            />
            {/* Node */}
            <motion.circle
              cx={node.x}
              cy={node.y}
              r={node.size / 2}
              fill={node.color}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                duration: 0.5,
                delay: i * 0.05,
              }}
              style={{ filter: 'drop-shadow(0 0 10px ' + node.color + ')' }}
            />
            {/* Label for main nodes */}
            {node.label && (
              <motion.text
                x={node.x}
                y={node.y}
                textAnchor="middle"
                alignmentBaseline="middle"
                fill="white"
                fontSize={node.id === 'center' ? 14 : 10}
                fontWeight={node.id === 'center' ? 'bold' : 'medium'}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 + 0.3 }}
              >
                {node.label}
              </motion.text>
            )}
            {/* Pulse animation for center */}
            {node.id === 'center' && (
              <motion.circle
                cx={node.x}
                cy={node.y}
                r={node.size / 2}
                fill="transparent"
                stroke={node.color}
                strokeWidth="2"
                initial={{ scale: 1, opacity: 1 }}
                animate={{ scale: 2, opacity: 0 }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeOut',
                }}
              />
            )}
          </motion.g>
        ))}
      </svg>

      {/* Animated particles along edges */}
      {edges.slice(0, 6).map((edge, i) => {
        const from = nodes.find((n) => n.id === edge.from);
        const to = nodes.find((n) => n.id === edge.to);
        if (!from || !to) return null;

        return (
          <motion.div
            key={`particle-${i}`}
            className="absolute w-2 h-2 rounded-full bg-primary"
            initial={{ x: from.x - 4, y: from.y - 4, opacity: 0 }}
            animate={{
              x: [from.x - 4, to.x - 4, from.x - 4],
              y: [from.y - 4, to.y - 4, from.y - 4],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 0.5,
              ease: 'linear',
            }}
          />
        );
      })}
    </div>
  );
}
