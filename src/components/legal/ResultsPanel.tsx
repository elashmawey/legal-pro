'use client';

import { Download, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArticleData, LAW_NAMES, LawType, NaqdEntry } from '@/lib/types';
import { ArticleCard } from './ArticleCard';
import { DefensesCard } from './DefensesCard';
import { LoopholesCard } from './LoopholesCard';
import { CassationCard } from './CassationCard';
import { MemoCard } from './MemoCard';

interface ResultsPanelProps {
  law: LawType;
  num: string;
  data: ArticleData | null;
  aiData: Partial<ArticleData> | null;
  isAILoading: boolean;
  onExport: () => void;
}

export function ResultsPanel({
  law,
  num,
  data,
  aiData,
  isAILoading,
  onExport,
}: ResultsPanelProps) {
  if (!data) return null;

  const lawName = LAW_NAMES[law];
  const title = `المادة ${num} - ${lawName}`;

  // Merge data: AI data takes precedence over local data
  const shakly = aiData?.shakly ?? data.shakly;
  const mawdoo = aiData?.mawdoo ?? data.mawdoo;
  const thaghra = aiData?.thaghra ?? data.thaghra;
  const naqd = aiData?.naqd ?? data.naqd;
  const muzakkira = aiData?.muzakkira ?? data.muzakkira;

  // Check if we have any meaningful data to show (beyond just the text)
  const hasAnalysisData =
    shakly.length > 0 ||
    mawdoo.length > 0 ||
    thaghra.length > 0 ||
    naqd.length > 0 ||
    muzakkira.length > 0;

  // Check if export is possible
  const canExport = hasAnalysisData && !isAILoading;

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
        {isAILoading && !aiData?.shakly ? (
          <LoadingCard title="الدفوع الشكلية" badgeLabel="شكلية" />
        ) : shakly.length > 0 ? (
          <DefensesCard
            title="الدفوع الشكلية"
            badgeLabel="شكلية"
            badgeVariant="shakly"
            items={shakly}
            titleColor="text-blue-300"
          />
        ) : !isAILoading ? (
          <EmptyCard
            title="الدفوع الشكلية"
            badgeLabel="شكلية"
            message="في انتظار التحليل بالذكاء الاصطناعي"
          />
        ) : null}

        {/* الدفوع الموضوعية */}
        {isAILoading && !aiData?.mawdoo ? (
          <LoadingCard title="الدفوع الموضوعية" badgeLabel="موضوعية" />
        ) : mawdoo.length > 0 ? (
          <DefensesCard
            title="الدفوع الموضوعية"
            badgeLabel="موضوعية"
            badgeVariant="mawdoo"
            items={mawdoo}
            titleColor="text-purple-300"
          />
        ) : !isAILoading ? (
          <EmptyCard
            title="الدفوع الموضوعية"
            badgeLabel="موضوعية"
            message="في انتظار التحليل بالذكاء الاصطناعي"
          />
        ) : null}

        {/* الثغرات */}
        {isAILoading && !aiData?.thaghra ? (
          <LoadingCard title="الثغرات ونقاط الضعف" badgeLabel="ثغرات" />
        ) : thaghra.length > 0 ? (
          <LoopholesCard items={thaghra} />
        ) : !isAILoading ? (
          <EmptyCard
            title="الثغرات ونقاط الضعف"
            badgeLabel="ثغرات"
            message="في انتظار التحليل بالذكاء الاصطناعي"
          />
        ) : null}

        {/* أحكام النقض */}
        {isAILoading && !aiData?.naqd ? (
          <LoadingCard title="مبادئ محكمة النقض" badgeLabel="نقض" />
        ) : naqd.length > 0 ? (
          <CassationCard items={naqd as NaqdEntry[]} />
        ) : !isAILoading ? (
          <EmptyCard
            title="مبادئ محكمة النقض"
            badgeLabel="نقض"
            message="في انتظار التحليل بالذكاء الاصطناعي"
          />
        ) : null}

        {/* مسودة مذكرة */}
        {isAILoading && !aiData?.muzakkira ? (
          <LoadingCard
            title="مسودة مذكرة قانونية"
            badgeLabel="مذكرة"
            fullWidth
          />
        ) : muzakkira.length > 0 ? (
          <MemoCard text={muzakkira} />
        ) : !isAILoading ? (
          <EmptyCard
            title="مسودة مذكرة قانونية"
            badgeLabel="مذكرة"
            message="في انتظار التحليل بالذكاء الاصطناعي"
            fullWidth
          />
        ) : null}
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
        fullWidth ? 'md:col-span-2' : ''
      }`}
    >
      <div className="card-header-gold px-5 py-3 flex items-center gap-2">
        <span className="text-xs px-2 py-1 rounded badge-naqd border border-gold-500/30 text-gold-400">
          {badgeLabel}
        </span>
        <h3 className="font-bold text-gray-400">{title}</h3>
        <span className="mr-auto text-xs text-gray-500 animate-pulse">
          ⏳ جارٍ التحليل بالذكاء الاصطناعي...
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
        fullWidth ? 'md:col-span-2' : ''
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
