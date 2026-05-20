'use client';

import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';

interface LoopholesCardProps {
  items: string[];
}

export function LoopholesCard({ items }: LoopholesCardProps) {
  return (
    <div
      className="card-glass gold-border rounded-xl overflow-hidden fade-in"
      aria-label="الثغرات ونقاط الضعف"
    >
      <div className="card-header-gold px-5 py-3 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-red-400" aria-hidden="true" />
        <Badge className="text-xs px-2 py-1 rounded badge-thaghra" variant="outline">
          ثغرات
        </Badge>
        <h3 className="font-bold text-red-300">الثغرات ونقاط الضعف</h3>
      </div>
      <ul className="p-5 space-y-2 text-gray-200 list-disc pr-5">
        {items.map((item, index) => (
          <li key={index} className="leading-relaxed">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
