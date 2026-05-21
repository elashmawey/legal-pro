'use client';

import { useState, useCallback, useRef } from 'react';
import { Scale, Brain } from 'lucide-react';
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
  const [aiSource, setAiSource] = useState<string>('');
  const resultsRef = useRef<HTMLDivElement>(null);

  const analyzeArticle = useCallback(
    async (targetLaw: LawType, targetNum: string) => {
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
      setAiSource('');

      try {
        // Add timeout controller (60 seconds)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000);

        // Call AI-powered analysis API
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ law: targetLaw, num: targetNum.trim() }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Check if response is JSON before parsing
        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
          // Server returned HTML (error page) instead of JSON
          console.error('Non-JSON response:', contentType, response.status);
          // Fallback to local analysis
          toast.loading('فشل الاتصال بالذكاء الاصطناعي، جاري التحليل المحلي...', { duration: 2000 });
          const localData = getLocalAnalysis(targetLaw, targetNum.trim());
          setAnalysisData(localData);
          setAiSource('local');
          toast.success('تم التحليل محلياً (وضع احتياطي)');
          setTimeout(() => {
            resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 100);
          return;
        }

        const data = await response.json();

        if (!response.ok || !data.ok) {
          const errorMsg = data.error || 'حدث خطأ أثناء التحليل';

          // If AI failed, try local fallback
          if (response.status === 503 || response.status === 500) {
            toast.loading('فشل الذكاء الاصطناعي، جاري التحليل المحلي...', { duration: 2000 });
            const localData = getLocalAnalysis(targetLaw, targetNum.trim());
            setAnalysisData(localData);
            setAiSource('local');
            toast.success('تم التحليل محلياً (وضع احتياطي)');
          } else {
            toast.error(errorMsg);
            setAnalysisData(null);
          }
          return;
        }

        // Build ArticleData from API response
        const articleData: ArticleData = {
          text: data.text || `المادة ${targetNum} من ${LAW_NAMES[targetLaw]}`,
          shakly: data.shakly || [],
          mawdoo: data.mawdoo || [],
          thaghra: data.thaghra || [],
          naqd: data.naqd || [],
          taaleeq: data.taaleeq || [],
          muzakkira: data.muzakkira || '',
        };

        setAnalysisData(articleData);
        setAiSource(data.source || 'ai');
        toast.success('تم التحليل بالذكاء الاصطناعي بنجاح');

        // Scroll to results
        setTimeout(() => {
          resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      } catch (error) {
        console.error('Analysis error:', error);

        // On any error (timeout, network, etc.), fallback to local analysis
        if (error instanceof DOMException && error.name === 'AbortError') {
          toast.loading('انتهت مهلة الذكاء الاصطناعي، جاري التحليل المحلي...', { duration: 2000 });
        } else {
          toast.loading('فشل الاتصال بالخادم، جاري التحليل المحلي...', { duration: 2000 });
        }

        const localData = getLocalAnalysis(targetLaw, targetNum.trim());
        setAnalysisData(localData);
        setAiSource('local');
        toast.success('تم التحليل محلياً (وضع احتياطي)');
      } finally {
        setIsLoading(false);
      }
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
    const taaleeq = (analysisData.taaleeq || [])
      .map((item) => `• ${item}`)
      .join('\n');
    const memo = analysisData.muzakkira;

    const sourceLabel = aiSource === 'ai' ? 'الذكاء الاصطناعي' : 'تحليل محلي';

    const content = `المحلل القانوني المصري - ${sourceLabel}
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

[تعليقات ومصادر رسمية]
${taaleeq}

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
  }, [law, num, analysisData, aiSource]);

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
                منصة استخراج الدفوع والثغرات وأحكام النقض بالذكاء الاصطناعي
              </p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 text-xs text-gold-400/80">
            <span className="px-3 py-1 rounded-full border border-gold-500/30 flex items-center gap-1">
              <Brain className="w-3 h-3" aria-hidden="true" />
              تحليل بالذكاء الاصطناعي
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
          <div ref={resultsRef} className="flex flex-col items-center justify-center py-20">
            <div className="relative">
              <div className="w-20 h-20 rounded-full border-4 border-gold-500/20 border-t-gold-400 animate-spin" />
              <Brain className="w-8 h-8 text-gold-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="mt-6 text-gold-400 text-lg font-heading">جاري التحليل بالذكاء الاصطناعي...</p>
            <p className="mt-2 text-gray-400 text-sm">يتم تحليل المادة قانونياً - قد يستغرق بضع ثوانٍ</p>
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
            © {new Date().getFullYear()} المحلل القانوني المصري - مدعوم بالذكاء الاصطناعي
          </p>
        </div>
      </footer>
    </div>
  );
}
