import { ArticleData, LAW_NAMES, LawType, NaqdEntry } from './types';
import { ARTICLE_TEXT_DB } from './article-store';
import { getFullAnalysis, getAnalysisStats } from '@/data/legalAnalysisLibrary';

// ============================================================
// قاعدة البيانات القانونية المصرية - نسخة محلية بالكامل
// لا حاجة للذكاء الاصطناعي - جميع التحليلات مُعدّة محلياً
// المصادر: منشورات قانونية، محكمة النقض، وزارة العدل المصرية
// المواقع الرسمية: manshurat.org, moj.gov.eg, scc.gov.eg, najd.gov.eg
// ============================================================

/**
 * Get article data from the LOCAL analysis library (no AI needed)
 * Covers ALL 2,302+ articles across 5 laws with intelligent category-based analysis
 */
export function getArticleData(law: LawType, num: string): ArticleData | null {
  const key = `${law}-${num}`;
  const lawName = LAW_NAMES[law];

  // Get article text first
  const articleText = getArticleText(law, num);

  // Get analysis from the local library
  const analysis = getFullAnalysis(law, num);

  if (!analysis && !articleText) return null;

  return {
    text: articleText || `لم يتم إدراج نص المادة ${num} من ${lawName} في قاعدة البيانات المحلية.`,
    shakly: analysis?.shakly || [],
    mawdoo: analysis?.mawdoo || [],
    thaghra: analysis?.thaghra || [],
    naqd: analysis?.naqd || [],
    muzakkira: analysis?.muzakkira || '',
  };
}

/**
 * Get article text from the article store (2,302+ articles from official sources)
 */
export function getArticleText(law: LawType, num: string): string | null {
  const key = `${law}-${num}`;
  return ARTICLE_TEXT_DB[key] || null;
}

/**
 * Get comprehensive analysis for any article (local, no AI)
 * Returns full analysis data including defenses, loopholes, cassation principles, and legal memo
 */
export function getLocalAnalysis(law: LawType, num: string): ArticleData {
  const lawName = LAW_NAMES[law];
  const articleText = getArticleText(law, num);
  const analysis = getFullAnalysis(law, num);

  return {
    text: articleText || `لم يتم إدراج نص المادة ${num} من ${lawName} في قاعدة البيانات المحلية.`,
    shakly: analysis?.shakly || [],
    mawdoo: analysis?.mawdoo || [],
    thaghra: analysis?.thaghra || [],
    naqd: analysis?.naqd || [],
    muzakkira: analysis?.muzakkira || '',
  };
}

/**
 * Generate fallback data for articles not in the database
 * @deprecated Use getLocalAnalysis() instead - it covers ALL articles
 */
export function getFallbackData(law: LawType, num: string): ArticleData {
  return getLocalAnalysis(law, num);
}

/**
 * Get all database keys
 */
export function getDBKeys(): string[] {
  return Object.keys(ARTICLE_TEXT_DB);
}

/**
 * Get database statistics
 */
export function getDBStats(): Record<LawType, number> {
  const stats: Record<string, number> = {
    penal: 0,
    criminal_proc: 0,
    civil: 0,
    civil_proc: 0,
    personal: 0,
  };

  for (const key of Object.keys(ARTICLE_TEXT_DB)) {
    const law = key.split('-')[0] as LawType;
    if (law in stats) {
      stats[law]++;
    }
  }

  return stats as Record<LawType, number>;
}
