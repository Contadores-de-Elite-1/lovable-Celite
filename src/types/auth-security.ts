export type SecurityStatus = 'ok' | 'pendente' | 'nao-verificado';

export interface AuthSecurityStatusState {
  hibp: SecurityStatus;
  db_structure: SecurityStatus;
  user_mgmt: SecurityStatus;
}

export interface SecurityCardConfig {
  id: keyof AuthSecurityStatusState;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  supabasePath: string;
  guideContent: GuideContent;
}

export interface GuideContent {
  title: string;
  steps: string[];
  notes?: string[];
  sqlSnippets?: { label: string; code: string }[];
}
