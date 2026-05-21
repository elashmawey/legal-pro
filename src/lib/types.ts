// Law types supported by the application
export type LawType = 'penal' | 'criminal_proc' | 'civil' | 'civil_proc' | 'personal';

// Cassation court reference entry
export interface NaqdEntry {
  ref: string;
  text: string;
}

// Full article data structure
export interface ArticleData {
  text: string;
  shakly: string[];
  mawdoo: string[];
  thaghra: string[];
  naqd: NaqdEntry[];
  taaleeq: string[];
  muzakkira: string;
}

// Law name mapping
export const LAW_NAMES: Record<LawType, string> = {
  penal: 'قانون العقوبات',
  criminal_proc: 'قانون الإجراءات الجنائية',
  civil: 'القانون المدني',
  civil_proc: 'قانون المرافعات',
  personal: 'قانون الأحوال الشخصية',
};

// Short law name mapping for quick examples
export const LAW_LABEL_SHORT: Record<LawType, string> = {
  penal: 'عقوبات',
  criminal_proc: 'إجراءات',
  civil: 'مدني',
  civil_proc: 'مرافعات',
  personal: 'أحوال شخصية',
};

// Valid law types for validation
export const VALID_LAW_TYPES: LawType[] = [
  'penal',
  'criminal_proc',
  'civil',
  'civil_proc',
  'personal',
];

// API request/response types
export interface AnalyzeRequest {
  law: string;
  num: string;
  text: string;
}

export interface AnalyzeResponse {
  ok: boolean;
  shakly?: string[];
  mawdoo?: string[];
  thaghra?: string[];
  naqd?: NaqdEntry[];
  muzakkira?: string;
  error?: string;
  detail?: string;
}

export interface ArticleResponse {
  found: boolean;
  article_text?: string;
}

// Quick example button data
export interface QuickExample {
  law: LawType;
  num: string;
  label: string;
}
