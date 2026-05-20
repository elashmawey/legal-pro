'use client';

import { Badge } from '@/components/ui/badge';

interface DefensesCardProps {
  title: string;
  badgeLabel: string;
  badgeVariant: 'shakly' | 'mawdoo';
  items: string[];
  titleColor: string;
}

export function DefensesCard({
  title,
  badgeLabel,
  badgeVariant,
  items,
  titleColor,
}: DefensesCardProps) {
  return (
    <div
      className="card-glass gold-border rounded-xl overflow-hidden fade-in"
      aria-label={title}
    >
      <div className="card-header-gold px-5 py-3 flex items-center gap-2">
        <Badge
          className={`text-xs px-2 py-1 rounded badge-${badgeVariant}`}
          variant="outline"
        >
          {badgeLabel}
        </Badge>
        <h3 className={`font-bold ${titleColor}`}>{title}</h3>
      </div>
      <ul className="p-5 space-y-2 text-gray-200 list-disc pr-5">
        {items.map((item, index) => (
          <li key={index} className="leading-relaxed">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
