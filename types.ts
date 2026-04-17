
export interface User {
    name: string;
    email: string;
    password?: string; // Usado apenas para simulação de cadastro/login
    course: string;
    experienceLevel: 'Iniciante' | 'Intermediário' | 'Avançado';
}

export interface SubStep {
  topic: string;
  link: string;
}

export interface Step {
  title: string;
  description: string;
  rationale: string; // Nova propriedade para explicar a importância da etapa
  completed: boolean;
  subSteps?: SubStep[];
}

export interface LearningPath {
  id: string;
  title: string;
  description:string;
  category: string;
  difficulty: string; // Nova propriedade para o nível da trilha
  steps: Step[];
  progress: number;
  targetAudience?: {
    course: string[];
    experienceLevel: ('Iniciante' | 'Intermediário' | 'Avançado')[];
  };
}