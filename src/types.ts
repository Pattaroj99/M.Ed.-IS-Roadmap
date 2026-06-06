export interface ISStep {
  id: number;
  activity: string;
  description: string;
  studentRole: string;
  advisorRole: string;
  contactParty: string;
  defaultDurationDays: number;
  phase: 'preparation' | 'proposal' | 'instruments' | 'collection' | 'analysis' | 'final' | 'graduation';
  checkpoints: string[];
  expandedGuide: string;
  tips: string[];
}

export interface UserSchedule {
  startDate: string;
  customDurations: Record<number, number>; // stepId -> days
  completedSteps: number[]; // stepIds
  stepStatuses: Record<number, 'pending' | 'in_progress' | 'completed'>;
  stepNotes: Record<number, string>;
  roleMode: 'student' | 'advisor';
}
