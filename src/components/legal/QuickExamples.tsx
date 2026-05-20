'use client';

import { QuickExample } from '@/lib/types';

interface QuickExamplesProps {
  onSelect: (law: QuickExample['law'], num: string) => void;
}

const EXAMPLES: QuickExample[] = [
  { law: 'penal', num: '17', label: 'عقوبات 17' },
  { law: 'penal', num: '234', label: 'عقوبات 234' },
  { law: 'criminal_proc', num: '304', label: 'إجراءات 304' },
  { law: 'criminal_proc', num: '206', label: 'إجراءات 206' },
  { law: 'civil', num: '163', label: 'مدني 163' },
  { law: 'civil', num: '164', label: 'مدني 164' },
  { law: 'penal', num: '302', label: 'عقوبات 302' },
  { law: 'civil_proc', num: '3', label: 'مرافعات 3' },
];

export function QuickExamples({ onSelect }: QuickExamplesProps) {
  return (
    <div className="mt-4 flex flex-wrap gap-2 text-xs">
      <span className="text-gray-400 py-1">أمثلة سريعة:</span>
      {EXAMPLES.map((example) => (
        <button
          key={`${example.law}-${example.num}`}
          onClick={() => onSelect(example.law, example.num)}
          className="px-3 py-1 rounded-full border border-gold-500/30 hover:bg-gold-500/10 transition-colors text-gray-300 hover:text-gold-400"
          aria-label={`تحليل المادة ${example.num} من ${example.label}`}
        >
          {example.label}
        </button>
      ))}
    </div>
  );
}
