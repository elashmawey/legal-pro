'use client';

import { Scale } from 'lucide-react';

export function EmptyState() {
  return (
    <section className="text-center py-16 md:py-20" aria-label="حالة البداية">
      <div className="inline-block p-6 rounded-full bg-gold-500/10 border border-gold-500/30 mb-6">
        <Scale className="w-16 h-16 text-gold-400" aria-hidden="true" />
      </div>
      <h3 className="text-xl md:text-2xl font-bold text-gold-400 mb-3 font-heading">
        ابدأ بتحليل مادة قانونية
      </h3>
      <p className="text-gray-400 max-w-md mx-auto leading-relaxed">
        اختر فرع القانون وأدخل رقم المادة لاستخراج النص، الدفوع الشكلية
        والموضوعية، الثغرات الإجرائية، ومبادئ النقض المرتبطة.
      </p>
    </section>
  );
}
