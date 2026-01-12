
export interface AssessmentRecord {
  date: string;
  accuracy: number | string; // 支援數字或 "-"
}

export interface IEPSubGoal {
  id: string;
  code: string; // 例如 1-1, 1-2
  content: string;
  strategy?: string; // 學習策略
  targetAccuracy: number; // 適性調整的目標達成率
  records: AssessmentRecord[];
}

export interface IEPParentGoal {
  id: string;
  title: string;
  subGoals: IEPSubGoal[];
}

export interface GenerationParams {
  subject: Subject;
  unit: string;
  studentLevel: string;
  gradeLevel: string;
  disabilityType: string;
}

export enum Subject {
  CHINESE = '國語',
  MATH = '數學',
  LIFE_MGMT = '生活管理',
  LEARNING_STRATEGY = '學習策略',
  SOCIAL_SKILLS = '社會技巧'
}
