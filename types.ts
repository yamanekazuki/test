export type ReflectionType = 'horizontal' | 'vertical';

export interface Reflection {
  id: string;
  date: string;
  type: ReflectionType; // 水平的 or 垂直的
  content: string;
  createdAt: number;
}

export interface ReflectionPrompt {
  question: string;
}
