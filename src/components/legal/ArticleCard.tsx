'use client';

import { ScrollText } from 'lucide-react';

interface ArticleCardProps {
  text: string;
}

export function ArticleCard({ text }: ArticleCardProps) {
  return (
    <div
      className="card-glass gold-border rounded-xl overflow-hidden fade-in md:col-span-2"
      aria-label="نص المادة"
    >
      <div className="card-header-gold px-5 py-3 flex items-center gap-2">
        <ScrollText className="w-5 h-5 text-gold-400" aria-hidden="true" />
        <h3 className="font-bold text-gold-400">نص المادة</h3>
      </div>
      <div className="p-5 text-gray-200 leading-loose font-heading text-lg">
        {text}
      </div>
    </div>
  );
}
