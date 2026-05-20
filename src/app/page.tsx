'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Scale, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';
import { LawType, ArticleData, LAW_NAMES } from '@/lib/types';
import { getArticleData, getArticleText, getDBStats } from '@/lib/legal-db';
import { SearchPanel } from '@/components/legal/SearchPanel';
import { ResultsPanel } from '@/components/legal/ResultsPanel';
import { EmptyState } from '@/components/legal/EmptyState';

export default function Home() {
  const [law, setLaw] = useState<LawType>('penal');
  const [num, setNum] = useState('');
  const [articleText, setArticleText] = useState('');
  const [isTextFromDB, setIsTextFromDB] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAILoading, setIsAILoading] = useState(false);
  const [localData, setLocalData] = useState<ArticleData | null>(null);
  const [aiData, setAIData] = useState<Partial<ArticleData> | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Auto-fill article text from DB when law or num changes
  useEffect(() => {
    if (!num.trim()) {
      setArticleText('');
      setIsTextFromDB(false);
      return;
    }

    const dbText = getArticleText(law, num.trim());
    if (dbText) {
      setArticleText(dbText);
      setIsTextFromDB(true);
    } else {
      // Only clear if the current text was from DB (don't overwrite user input)
      setIsTextFromDB(false);
    }
  }, [law, num]);

  const analyzeArticle = useCallback(
    async (targetLaw: LawType, targetNum: string, targetText: string) => {
      // Validate input
      if (!targetNum.trim()) {
        toast.error('يرجى إدخال رقم المادة');
        return;
      }

      if (!/^[0-9]+$/.test(targetNum.trim())) {
        toast.error('رقم المادة يجب أن يكون أرقاماً فقط');
        return;
      }

      if (!targetText.trim() || targetText.trim().length < 10) {
        toast.error('يرجى إدخال نص المادة القانونية للتحليل (10 أحرف على الأقل)');
        return;
      }

      setIsLoading(true);
      setHasSearched(true);
      setAIData(null);

      // Get local data from DB if available
      const localDBData = getArticleData(targetLaw, targetNum.trim());

      // Build the data object: always use the user-provided text as the source of truth
      const data: ArticleData = localDBData
        ? { ...localDBData, text: targetText.trim() }
        : {
            text: targetText.trim(),
            shakly: [],
            mawdoo: [],
            thaghra: [],
            naqd: [],
            muzakkira: '',
          };

      setLocalData(data);
      setIsLoading(false);

      // Scroll to results
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);

      // Call AI analysis with the ACTUAL article text
      setIsAILoading(true);
      try {
        const aiRes = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            law: targetLaw,
            num: targetNum.trim(),
            text: targetText.trim(),
          }),
        });

        const aiJson = await aiRes.json();

        if (aiRes.ok && aiJson.ok) {
          setAIData({
            shakly: aiJson.shakly,
            mawdoo: aiJson.mawdoo,
            thaghra: aiJson.thaghra,
            naqd: aiJson.naqd,
            muzakkira: aiJson.muzakkira,
          });
          toast.success('تم التحليل بالذكاء الاصطناعي بنجاح');
        } else {
          const errorMsg = aiJson.error || aiJson.detail || `خطأ HTTP ${aiRes.status}`;
          console.warn('AI analysis failed:', errorMsg);
          toast.info('يتم عرض البيانات المحلية (تعذّر التحليل بالذكاء الاصطناعي)');
        }
      } catch (error) {
        console.warn('AI analysis network error:', error);
        toast.info('يتم عرض البيانات المحلية (خطأ في الاتصال)');
      } finally {
        setIsAILoading(false);
      }
    },
    []
  );

  const handleAnalyze = useCallback(() => {
    analyzeArticle(law, num, articleText);
  }, [law, num, articleText, analyzeArticle]);

  const handleQuickExample = useCallback(
    (selectedLaw: LawType, selectedNum: string) => {
      setLaw(selectedLaw);
      setNum(selectedNum);

      // Get article text from DB for quick examples
      const dbText = getArticleText(selectedLaw, selectedNum);
      if (dbText) {
        setArticleText(dbText);
        setIsTextFromDB(true);
      }

      // Use a small timeout to let state settle, then analyze
      setTimeout(() => {
        const textToUse = dbText || '';
        if (textToUse) {
          analyzeArticle(selectedLaw, selectedNum, textToUse);
        }
      }, 50);
    },
    [analyzeArticle]
  );

  const handleExport = useCallback(() => {
    if (!localData) return;

    const lawName = LAW_NAMES[law];
    const title = `المادة ${num} - ${lawName}`;

    const shakly = (aiData?.shakly ?? localData.shakly)
      .map((item) => `• ${item}`)
      .join('\n');
    const mawdoo = (aiData?.mawdoo ?? localData.mawdoo)
      .map((item) => `• ${item}`)
      .join('\n');
    const thaghra = (aiData?.thaghra ?? localData.thaghra)
      .map((item) => `• ${item}`)
      .join('\n');
    const naqd = (aiData?.naqd ?? localData.naqd)
      .map((item) => `${item.ref}\n${item.text}`)
      .join('\n\n');
    const memo = aiData?.muzakkira ?? localData.muzakkira;

    const content = `المحلل القانوني المصري
=========================
${title}

[نص المادة]
${localData.text}

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
  }, [law, num, localData, aiData]);

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
              <Sparkles className="w-3 h-3" aria-hidden="true" />
              مدعوم بالذكاء الاصطناعي
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
          articleText={articleText}
          isTextFromDB={isTextFromDB}
          isLoading={isLoading}
          onLawChange={setLaw}
          onNumChange={setNum}
          onArticleTextChange={setArticleText}
          onAnalyze={handleAnalyze}
          onQuickExample={handleQuickExample}
        />

        {hasSearched && localData ? (
          <div ref={resultsRef}>
            <ResultsPanel
              law={law}
              num={num}
              data={localData}
              aiData={aiData}
              isAILoading={isAILoading}
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
