'use client';

import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LawType, LAW_NAMES } from '@/lib/types';
import { QuickExamples } from './QuickExamples';

interface SearchPanelProps {
  law: LawType;
  num: string;
  isLoading: boolean;
  onLawChange: (law: LawType) => void;
  onNumChange: (num: string) => void;
  onAnalyze: () => void;
  onQuickExample: (law: LawType, num: string) => void;
}

export function SearchPanel({
  law,
  num,
  isLoading,
  onLawChange,
  onNumChange,
  onAnalyze,
  onQuickExample,
}: SearchPanelProps) {
  const canAnalyze = num.trim().length > 0;

  return (
    <section
      className="card-glass gold-border rounded-2xl p-4 md:p-6 mb-8 gold-glow"
      aria-label="محرك البحث القانوني"
    >
      <h2 className="text-lg font-bold text-gold-400 mb-4 flex items-center gap-2">
        <Search className="w-5 h-5" aria-hidden="true" />
        محرك البحث القانوني
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="md:col-span-4">
          <Label htmlFor="law-select" className="block text-sm mb-1 text-gray-300">
            فرع القانون
          </Label>
          <Select
            value={law}
            onValueChange={(value) => onLawChange(value as LawType)}
          >
            <SelectTrigger
              id="law-select"
              className="w-full bg-navy-input border-gold-500/30 text-white h-11"
              aria-label="اختر فرع القانون"
            >
              <SelectValue placeholder="اختر فرع القانون" />
            </SelectTrigger>
            <SelectContent className="bg-navy-800 border-gold-500/30">
              {Object.entries(LAW_NAMES).map(([value, label]) => (
                <SelectItem
                  key={value}
                  value={value}
                  className="text-white focus:bg-navy-600 focus:text-white"
                >
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-4">
          <Label htmlFor="article-num" className="block text-sm mb-1 text-gray-300">
            رقم المادة
          </Label>
          <Input
            id="article-num"
            type="text"
            inputMode="numeric"
            placeholder="مثال: 304 أو 17"
            value={num}
            onChange={(e) => {
              // Only allow digits
              const val = e.target.value.replace(/[^0-9]/g, '');
              onNumChange(val);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && canAnalyze) onAnalyze();
            }}
            className="w-full bg-navy-input border-gold-500/30 text-white h-11 arabic-num placeholder:text-gray-500"
            aria-label="رقم المادة القانونية"
            dir="ltr"
          />
        </div>
        <div className="md:col-span-4 flex items-end">
          <Button
            onClick={onAnalyze}
            disabled={isLoading || !canAnalyze}
            className="w-full bg-gradient-to-l from-gold-600 to-gold-400 hover:from-gold-500 hover:to-gold-300 text-navy-900 font-bold h-11 transition-all gold-glow disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="تحليل المادة القانونية"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin h-4 w-4 border-2 border-navy-900 border-t-transparent rounded-full" />
                جارٍ التحليل...
              </span>
            ) : (
              'تحليل المادة'
            )}
          </Button>
        </div>
      </div>

      {/* نص توجيهي */}
      <div className="mt-3 text-center">
        <p className="text-xs text-gray-400">
          أدخل رقم المادة فقط واضغط تحليل - سيتم جلب النص والتحليل تلقائياً من قاعدة البيانات
        </p>
      </div>

      <QuickExamples onSelect={onQuickExample} />
    </section>
  );
}
