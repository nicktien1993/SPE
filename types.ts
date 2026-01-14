
export interface AssessmentRecord {
  date: string;
  accuracy: number | string; // 支援數字或 "-"
}

export interface IEPSubGoal {
  id: string;
  code: string;
  content: string;
  strategy?: string;
  targetAccuracy: number;
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
  subtype?: string; 
  teacherExpectations?: string; // 新增：班導師的期望
}

export enum Subject {
  CHINESE = '國語',
  MATH = '數學',
  LIFE_MGMT = '生活管理',
  SOCIAL_SKILLS = '社會技巧',
  LEARNING_STRATEGY = '學習策略',
  VOCATIONAL = '職業教育',
  COMMUNICATION = '溝通訓練',
  BRAILLE = '點字',
  ORIENTATION = '定向行動',
  MOTOR_TRAINING = '功能性動作訓練',
  ASSISTIVE_TECH = '輔助科技應用'
}
