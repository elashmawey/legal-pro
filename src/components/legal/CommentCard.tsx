'use client';

import { BookOpen, ExternalLink } from 'lucide-react';

interface CommentCardProps {
  items: string[];
}

const OFFICIAL_SOURCES = [
  { name: 'منشورات قانونية', domain: 'manshurat.org' },
  { name: 'وزارة العدل', domain: 'moj.gov.eg' },
  { name: 'محكمة النقض', domain: 'scc.gov.eg' },
  { name: 'الإدارة المركزية', domain: 'idsc.gov.eg' },
  { name: 'بوابة الحكومة', domain: 'egypt.gov.eg' },
  { name: 'نجد', domain: 'najd.gov.eg' },
];

export function CommentCard({ items }: CommentCardProps) {
  return (
    <div className="card-glass gold-border rounded-xl overflow-hidden lg:col-span-2">
      <div className="card-header-gold px-5 py-3 flex items-center gap-2">
        <span className="text-xs px-2 py-1 rounded badge-naqd border border-gold-500/30 text-gold-400">
          تعليقات
        </span>
        <h3 className="font-bold text-emerald-300 flex items-center gap-2">
          <BookOpen className="w-4 h-4" aria-hidden="true" />
          تعليقات ومصادر رسمية
        </h3>
        <span className="mr-auto text-xs text-gray-500">
          المصادر: المواقع الرسمية المصرية
        </span>
      </div>
      <div className="p-5 space-y-4">
        {items.map((comment, idx) => (
          <div
            key={idx}
            className="bg-navy-800/60 border border-emerald-500/20 rounded-lg p-4"
          >
            <div className="flex items-start gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs font-bold">
                {idx + 1}
              </span>
              <div className="flex-1">
                <p className="text-gray-300 text-sm leading-relaxed">
                  {comment}
                </p>
              </div>
            </div>
          </div>
        ))}

        {/* مصادر رسمية */}
        <div className="mt-4 pt-3 border-t border-emerald-500/20">
          <p className="text-xs text-gray-400 mb-2 font-semibold">
            المصادر الرسمية المعتمدة:
          </p>
          <div className="flex flex-wrap gap-2">
            {OFFICIAL_SOURCES.map((source) => (
              <span
                key={source.domain}
                className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-navy-700/80 border border-emerald-500/15 text-emerald-400/80"
              >
                <ExternalLink className="w-3 h-3" aria-hidden="true" />
                {source.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
