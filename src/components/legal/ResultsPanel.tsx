'use client';

import { Download, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArticleData, LAW_NAMES, LawType, NaqdEntry } from '@/lib/types';
import { ArticleCard } from './ArticleCard';
import { DefensesCard } from './DefensesCard';
import { LoopholesCard } from './LoopholesCard';
import { CassationCard } from './CassationCard';
import { CommentCard } from './CommentCard';
import { MemoCard } from './MemoCard';

interface ResultsPanelProps {
  law: LawType;
  num: string;
  data: ArticleData | null;
  onExport: () => void;
}

export function ResultsPanel({
  law,
  num,
  data,
  onExport,
}: ResultsPanelProps) {
  const lawName = LAW_NAMES[law];
  const title = `المادة ${num} - ${lawName}`;

  // Loading state - show skeletons
  if (!data) {
    return (
      <section aria-label="نتائج التحليل" id="results-section">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl md:text-2xl font-bold text-gold-400 font-heading">
            {title}
          </h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <LoadingCard title="نص المادة" badgeLabel="مادة" />
          <LoadingCard title="الدفوع الشكلية" badgeLabel="شكلية" />
          <LoadingCard title="الدفوع الموضوعية" badgeLabel="موضوعية" />
          <LoadingCard title="الثغرات ونقاط الضعف" badgeLabel="ثغرات" />
          <LoadingCard title="مبادئ محكمة النقض" badgeLabel="نقض" />
          <LoadingCard title="تعليقات ومصادر رسمية" badgeLabel="تعليقات" fullWidth />
          <LoadingCard title="مسودة مذكرة قانونية" badgeLabel="مذكرة" fullWidth />
        </div>
      </section>
    );
  }

  // Check if we have any meaningful data to show (beyond just the text)
  const hasAnalysisData =
    data.shakly.length > 0 ||
    data.mawdoo.length > 0 ||
    data.thaghra.length > 0 ||
    data.naqd.length > 0 ||
    (data.taaleeq && data.taaleeq.length > 0) ||
    data.muzakkira.length > 0;

  const canExport = hasAnalysisData;

  return (
    <section aria-label="نتائج التحليل" id="results-section">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl md:text-2xl font-bold text-gold-400 font-heading">
          {title}
        </h2>
        {canExport && (
          <Button
            onClick={onExport}
            variant="outline"
            className="bg-navy-700 hover:bg-navy-600 border-gold-500/40 text-gold-400 px-4 py-2 text-sm flex items-center gap-2"
            aria-label="تحميل المذكرة القانونية"
          >
            <Download className="w-4 h-4" aria-hidden="true" />
            تحميل المذكرة
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* نص المادة - always shown */}
        <ArticleCard text={data.text} />

        {/* الدفوع الشكلية */}
        {data.shakly.length > 0 ? (
          <DefensesCard
            title="الدفوع الشكلية"
            badgeLabel="شكلية"
            badgeVariant="shakly"
            items={data.shakly}
            titleColor="text-blue-300"
          />
        ) : (
          <EmptyCard
            title="الدفوع الشكلية"
            badgeLabel="شكلية"
            message="لا توجد دفوع شكلية مسجلة لهذه المادة"
          />
        )}

        {/* الدفوع الموضوعية */}
        {data.mawdoo.length > 0 ? (
          <DefensesCard
            title="الدفوع الموضوعية"
            badgeLabel="موضوعية"
            badgeVariant="mawdoo"
            items={data.mawdoo}
            titleColor="text-purple-300"
          />
        ) : (
          <EmptyCard
            title="الدفوع الموضوعية"
            badgeLabel="موضوعية"
            message="لا توجد دفوع موضوعية مسجلة لهذه المادة"
          />
        )}

        {/* الثغرات */}
        {data.thaghra.length > 0 ? (
          <LoopholesCard items={data.thaghra} />
        ) : (
          <EmptyCard
            title="الثغرات ونقاط الضعف"
            badgeLabel="ثغرات"
            message="لا توجد ثغرات مسجلة لهذه المادة"
          />
        )}

        {/* أحكام النقض */}
        {data.naqd.length > 0 ? (
          <CassationCard items={data.naqd as NaqdEntry[]} />
        ) : (
          <EmptyCard
            title="مبادئ محكمة النقض"
            badgeLabel="نقض"
            message="لا توجد أحكام نقض مسجلة لهذه المادة"
          />
        )}

        {/* تعليقات ومصادر رسمية */}
        {data.taaleeq && data.taaleeq.length > 0 ? (
          <CommentCard items={data.taaleeq} />
        ) : (
          <EmptyCard
            title="تعليقات ومصادر رسمية"
            badgeLabel="تعليقات"
            message="لا توجد تعليقات مسجلة لهذه المادة"
            fullWidth
          />
        )}

        {/* مسودة مذكرة */}
        {data.muzakkira.length > 0 ? (
          <MemoCard text={data.muzakkira} />
        ) : (
          <EmptyCard
            title="مسودة مذكرة قانونية"
            badgeLabel="مذكرة"
            message="لا توجد مسودة مذكرة مسجلة لهذه المادة"
            fullWidth
          />
        )}
      </div>
    </section>
  );
}

function LoadingCard({
  title,
  badgeLabel,
  fullWidth = false,
}: {
  title: string;
  badgeLabel: string;
  fullWidth?: boolean;
}) {
  return (
    <div
      className={`card-glass gold-border rounded-xl overflow-hidden ${
        fullWidth ? 'lg:col-span-2' : ''
      }`}
    >
      <div className="card-header-gold px-5 py-3 flex items-center gap-2">
        <span className="text-xs px-2 py-1 rounded badge-naqd border border-gold-500/30 text-gold-400">
          {badgeLabel}
        </span>
        <h3 className="font-bold text-gray-400">{title}</h3>
        <span className="mr-auto text-xs text-gray-500 animate-pulse">
          ⏳ جارٍ التحليل...
        </span>
      </div>
      <div className="p-5 space-y-3">
        <Skeleton className="h-4 w-full bg-navy-600/50" />
        <Skeleton className="h-4 w-3/4 bg-navy-600/50" />
        <Skeleton className="h-4 w-5/6 bg-navy-600/50" />
      </div>
    </div>
  );
}

function EmptyCard({
  title,
  badgeLabel,
  message,
  fullWidth = false,
}: {
  title: string;
  badgeLabel: string;
  message: string;
  fullWidth?: boolean;
}) {
  return (
    <div
      className={`card-glass gold-border rounded-xl overflow-hidden ${
        fullWidth ? 'lg:col-span-2' : ''
      }`}
    >
      <div className="card-header-gold px-5 py-3 flex items-center gap-2">
        <span className="text-xs px-2 py-1 rounded badge-naqd border border-gold-500/30 text-gold-400">
          {badgeLabel}
        </span>
        <h3 className="font-bold text-gray-400">{title}</h3>
      </div>
      <div className="p-5 flex items-center gap-2 text-gray-500 text-sm">
        <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
        <span>{message}</span>
      </div>
    </div>
  );
}
