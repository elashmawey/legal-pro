'use client';

import { PenLine } from 'lucide-react';

interface MemoCardProps {
  text: string;
}

export function MemoCard({ text }: MemoCardProps) {
  return (
    <div
      className="card-glass gold-border rounded-xl overflow-hidden fade-in md:col-span-2"
      aria-label="مسودة مذكرة قانونية"
    >
      <div className="card-header-gold px-5 py-3 flex items-center gap-2">
        <PenLine className="w-5 h-5 text-gold-400" aria-hidden="true" />
        <h3 className="font-bold text-gold-400">
          مسودة مذكرة قانونية جاهزة للاقتباس
        </h3>
      </div>
      <div className="p-4">
        <div className="text-gray-100 leading-loose font-heading text-lg bg-navy-900/40 border-r-4 border-gold-500 p-4 rounded">
          {text}
        </div>
      </div>
    </div>
  );
}
