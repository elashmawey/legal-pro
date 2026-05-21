'use client';

import { useState, useCallback, useRef } from 'react';
import { Scale, Database } from 'lucide-react';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';
import { LawType, ArticleData, LAW_NAMES } from '@/lib/types';
import { getLocalAnalysis, getDBStats } from '@/lib/legal-db';
import { SearchPanel } from '@/components/legal/SearchPanel';
import { ResultsPanel } from '@/components/legal/ResultsPanel';
import { EmptyState } from '@/components/legal/EmptyState';

export default function Home() {
  const [law, setLaw] = useState<LawType>('penal');
  const [num, setNum] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [analysisData, setAnalysisData] = useState<ArticleData | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  const analyzeArticle = useCallback(
    (targetLaw: LawType, targetNum: string) => {
      // Validate input - only need article number
      if (!targetNum.trim()) {
        toast.error('يرجى إدخال رقم المادة');
        return;
      }

      if (!/^[0-9]+$/.test(targetNum.trim())) {
        toast.error('رقم المادة يجب أن يكون أرقاماً فقط');
        return;
      }

      setIsLoading(true);
      setHasSearched(true);

      // Get FULL analysis directly from local library - NO API needed!
      const data = getLocalAnalysis(targetLaw, targetNum.trim());

      // Small delay for UX feel
      setTimeout(() => {
        setAnalysisData(data);
        setIsLoading(false);

        if (!data || data.text.includes('لم يتم إدراج')) {
          const lawName = LAW_NAMES[targetLaw];
          toast.error(`لم يتم العثور على المادة ${targetNum} من ${lawName} في قاعدة البيانات`);
        } else {
          toast.success('تم التحليل بنجاح من المكتبة المحلية');
        }

        // Scroll to results
        setTimeout(() => {
          resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }, 300);
    },
    []
  );

  const handleAnalyze = useCallback(() => {
    analyzeArticle(law, num);
  }, [law, num, analyzeArticle]);

  const handleQuickExample = useCallback(
    (selectedLaw: LawType, selectedNum: string) => {
      setLaw(selectedLaw);
      setNum(selectedNum);
      // Analyze directly
      setTimeout(() => {
        analyzeArticle(selectedLaw, selectedNum);
      }, 50);
    },
    [analyzeArticle]
  );

  const handleExport = useCallback(() => {
    if (!analysisData) return;

    const lawName = LAW_NAMES[law];
    const title = `المادة ${num} - ${lawName}`;

    const shakly = analysisData.shakly
      .map((item) => `• ${item}`)
      .join('\n');
    const mawdoo = analysisData.mawdoo
      .map((item) => `• ${item}`)
      .join('\n');
    const thaghra = analysisData.thaghra
      .map((item) => `• ${item}`)
      .join('\n');
    const naqd = analysisData.naqd
      .map((item) => `${item.ref}\n${item.text}`)
      .join('\n\n');
    const memo = analysisData.muzakkira;

    const content = `المحلل القانوني المصري
=========================
${title}

[نص المادة]
${analysisData.text}

[الدفوع الشكلية]
${shakly}

[الدفوع الموضوعية]
${mawdoo}

[الثغرات ونقاط الضعف]
${thaghra}

[مبادئ محكمة النقض]
${naqd}

[مسودة المذكرة]
${memo}
`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('تم تحميل المذكرة بنجاح');
  }, [law, num, analysisData]);

  // Get DB stats for display
  const dbStats = getDBStats();
  const totalArticles = Object.values(dbStats).reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen flex flex-col">
      {/* HEADER */}
      <header className="border-b border-gold-500/30 bg-navy-900/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Scale
              className="w-8 h-8 md:w-10 md:h-10 scale-icon text-gold-400"
              aria-hidden="true"
            />
            <div>
              <h1 className="text-lg md:text-2xl font-bold text-gold-400 font-heading">
                المحلل القانوني المصري
              </h1>
              <p className="text-xs text-gray-400 hidden sm:block">
                منصة استخراج الدفوع والثغرات وأحكام النقض
              </p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 text-xs text-gold-400/80">
            <span className="px-3 py-1 rounded-full border border-gold-500/30 flex items-center gap-1">
              <Database className="w-3 h-3" aria-hidden="true" />
              تحليل محلي - بدون ذكاء اصطناعي
            </span>
            <span className="px-3 py-1 rounded-full border border-gold-500/30">
              📚 {totalArticles} مادة في القاعدة
            </span>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8 flex-1 w-full">
        <SearchPanel
          law={law}
          num={num}
          isLoading={isLoading}
          onLawChange={setLaw}
          onNumChange={setNum}
          onAnalyze={handleAnalyze}
          onQuickExample={handleQuickExample}
        />

        {hasSearched && analysisData ? (
          <div ref={resultsRef}>
            <ResultsPanel
              law={law}
              num={num}
              data={analysisData}
              onExport={handleExport}
            />
          </div>
        ) : isLoading ? (
          <div ref={resultsRef}>
            <ResultsPanel
              law={law}
              num={num}
              data={null}
              onExport={handleExport}
            />
          </div>
        ) : (
          <EmptyState />
        )}
      </main>

      {/* FOOTER */}
      <footer className="border-t border-gold-500/20 mt-auto py-6">
        <div className="max-w-7xl mx-auto px-4 md:px-6 text-center">
          <Separator className="mb-4 bg-gold-500/20" />
          <p className="text-xs text-gray-500">
            ⚖️ أداة استرشادية لا تغني عن الرأي القانوني المتخصص
          </p>
          <p className="text-xs text-gray-600 mt-1">
            © {new Date().getFullYear()} المحلل القانوني المصري
          </p>
        </div>
      </footer>
    </div>
  );
}
