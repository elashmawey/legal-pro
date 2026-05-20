'use client';

import { Badge } from '@/components/ui/badge';
import { Landmark } from 'lucide-react';
import { NaqdEntry } from '@/lib/types';

interface CassationCardProps {
  items: NaqdEntry[];
}

export function CassationCard({ items }: CassationCardProps) {
  return (
    <div
      className="card-glass gold-border rounded-xl overflow-hidden fade-in"
      aria-label="مبادئ محكمة النقض"
    >
      <div className="card-header-gold px-5 py-3 flex items-center gap-2">
        <Landmark className="w-4 h-4 text-gold-400" aria-hidden="true" />
        <Badge className="text-xs px-2 py-1 rounded badge-naqd" variant="outline">
          نقض
        </Badge>
        <h3 className="font-bold text-gold-400">مبادئ محكمة النقض</h3>
      </div>
      <ul className="p-5 space-y-3 text-gray-200">
        {items.map((item, index) => (
          <li
            key={index}
            className="border-r-2 border-gold-500/50 pr-3 py-1"
          >
            <div className="text-gold-400 text-xs mb-1 font-bold">
              {item.ref}
            </div>
            <div className="text-gray-200 leading-relaxed">{item.text}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
