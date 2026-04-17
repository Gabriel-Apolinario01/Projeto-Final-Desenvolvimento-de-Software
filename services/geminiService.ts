/**
 * Serviço Gemini AI - Integração com Google Gemini para geração de trilhas
 * 
 * Este módulo contém todas as funções para integração com a API do Google Gemini.
 * Utiliza a IA para gerar trilhas de aprendizagem personalizadas baseadas em
 * prompts do usuário e recomendações baseadas no perfil.
 * 
 * Autor: Desenvolvedor do EstudaAI
 * 
 * @module services/geminiService
 */

import { GoogleGenAI, Type } from "@google/genai";
import { LearningPath, Step, User, SubStep } from '../types';

// API Key do Google Gemini - em produção, deve vir de variável de ambiente
const API_KEY = "AIzaSyBz534EGdxp8XF3LrPft_6p6LiuX8jk2-c";

// Instância do cliente Gemini (singleton para evitar múltiplas instâncias)
let ai: GoogleGenAI | null = null;

/**
 * Obtém a instância do cliente GoogleGenAI.
 * 
 * Implementa o padrão singleton para garantir que apenas uma instância
 * do cliente seja criada durante toda a execução da aplicação.
 * 
 * @returns GoogleGenAI - Instância configurada do cliente Gemini
 * @throws Error se a API_KEY não estiver configurada
 */
function getAI(): GoogleGenAI {
    // Valida se a API key está configurada
    if (!API_KEY) {
        throw new Error("API_KEY environment variable not set");
    }
    
    // Se ainda não existe instância, cria uma nova
    if (!ai) {
        ai = new GoogleGenAI({ apiKey: API_KEY });
    }
    
    return ai;
}

/**
 * Schema para uma trilha de aprendizagem individual.
 * 
 * Define a estrutura esperada dos dados retornados pela IA.
 * Este schema é usado tanto para geração única quanto para recomendações.
 */
const learningPathObjectSchema = {
    type: Type.OBJECT,
    properties: {
        title: {
            type: Type.STRING,
            description: "Um título conciso e informativo para a trilha de aprendizagem. Ex: 'Fundamentos de JavaScript para Web'."
        },
        description: {
            type: Type.STRING,
            description: "Uma breve descrição (1-2 frases) sobre o que o aluno aprenderá nesta trilha."
        },
        category: {
            type: Type.STRING,
            description: "A categoria principal do conhecimento. Ex: 'Desenvolvimento Frontend', 'Ciência de Dados', 'Design'."
        },
        difficulty: {
            type: Type.STRING,
            description: "O nível de dificuldade da trilha. Valores possíveis: 'Iniciante', 'Intermediário', 'Avançado'."
        },
        steps: {
            type: Type.ARRAY,
            description: "Uma lista de 8 a 10 etapas sequenciais que compõem a trilha de aprendizagem.",
            items: {
                type: Type.OBJECT,
                properties: {
                    title: {
                        type: Type.STRING,
                        description: "O título de uma etapa específica. Ex: 'Variáveis e Tipos de Dados'."
                    },
                    description: {
                        type: Type.STRING,
                        description: "Uma descrição detalhada (1-2 frases) do que será aprendido ou feito nesta etapa."
                    },
                    rationale: {
                        type: Type.STRING,
                        description: "Uma breve explicação (1 frase) sobre o porquê desta etapa ser importante e o que ela conecta."
                    },
                    subSteps: {
                        type: Type.ARRAY,
                        description: "Uma lista de 4 a 6 subtópicos ou conceitos específicos a serem aprendidos dentro desta etapa. Cada item deve conter o tópico e um link de sugestão.",
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                topic: {
                                    type: Type.STRING,
                                    description: "O tópico ou conceito específico a ser aprendido."
                                },
                                link: {
                                    type: Type.STRING,
                                    description: "Um link de sugestão (URL) para um recurso externo de alta qualidade (artigo, documentação, tutorial em vídeo) sobre este tópico."
                                }
                            },
                            required: ["topic", "link"]
                        }
                    }
                },
                required: ["title", "description", "rationale", "subSteps"],
            },
        },
    },
    required: ["title", "description", "category", "difficulty", "steps"],
};

// Schema para resposta de uma única trilha (usado em generateLearningPath)
const responseSchema = learningPathObjectSchema;

/**
 * Schema para múltiplas trilhas recomendadas.
 * 
 * Usado quando o sistema precisa gerar 3 trilhas de uma vez
 * baseadas no perfil do usuário.
 */
const recommendedPathsSchema = {
    type: Type.OBJECT,
    properties: {
        paths: {
            type: Type.ARRAY,
            description: "Uma lista de 3 trilhas de aprendizagem recomendadas.",
            items: learningPathObjectSchema
        }
    },
    required: ["paths"]
};

/**
 * Gera uma trilha de aprendizagem personalizada usando IA.
 * 
 * Esta função utiliza o Google Gemini para criar uma trilha completa
 * e estruturada baseada no prompt do usuário. A IA gera entre 8-10 etapas
 * com sub-etapas e links para recursos externos.
 * 
 * @param prompt - Descrição do que o usuário deseja aprender
 * @returns Promise com a trilha gerada (sem id e progress, que são gerados pelo backend)
 * @throws Error se a geração falhar ou a API key for inválida
 * 
 * @example
 * const trilha = await generateLearningPath(
 *   "Quero aprender desenvolvimento web com React e Node.js"
 * );
 * console.log(trilha.title); // "Desenvolvimento Web Full Stack com React e Node.js"
 */
export const generateLearningPath = async (
  prompt: string
): Promise<Omit<LearningPath, 'id' | 'progress'>> => {
  try {
    // Prompt detalhado para a IA com instruções específicas
    const fullPrompt = `
      Você é um especialista em design instrucional e um engenheiro de software sênior. 
      Sua tarefa é criar uma trilha de aprendizagem EXTREMAMENTE COMPLETA E ROBUSTA com base na solicitação de um estudante.
      A trilha deve ser estruturada logicamente, desde os conceitos mais básicos até tópicos avançados. 
      A profundidade do conteúdo deve refletir a dificuldade definida: uma trilha 'Avançada' deve ser desafiadora, 
      enquanto 'Iniciante' deve ser detalhada nos fundamentos.
      A resposta DEVE estar em formato JSON, seguindo estritamente o schema fornecido.

      - **Título:** Crie um título claro e impactante.
      - **Descrição:** Escreva uma sinopse que motive o estudante.
      - **Categoria:** Atribua a categoria mais relevante.
      - **Dificuldade:** Avalie e defina a dificuldade geral da trilha ('Iniciante', 'Intermediário', 'Avançado').
      - **Etapas (Steps):** Crie de 8 a 10 etapas principais. Para cada etapa:
        - **Título e Descrição:** Devem ser claros e objetivos.
        - **Rationale:** Explique em uma frase por que esta etapa é crucial.
        - **Sub-etapas (subSteps):** Liste de 4 a 6 subtópicos detalhados. Para cada subtópico, 
          forneça o **tópico** em si e um **link (URL)** para um recurso de alta qualidade 
          (artigo, documentação, tutorial) que aprofunde o assunto.

      Solicitação do Aluno: "${prompt}"
    `;

    // Chama a API do Gemini para gerar o conteúdo
    const response = await getAI().models.generateContent({
      model: "gemini-2.5-flash",  // Modelo da IA utilizado
      contents: fullPrompt,
      config: {
        responseMimeType: "application/json",  // Força resposta em JSON
        responseSchema: responseSchema,  // Schema para validação da resposta
        temperature: 0.7,  // Criatividade (0.0 = determinístico, 1.0 = muito criativo)
      },
    });

    // Extrai e parseia o JSON da resposta
    const jsonText = response.text.trim();
    const generatedPath = JSON.parse(jsonText) as Omit<LearningPath, 'id' | 'progress' | 'steps'> & { 
      steps: (Omit<Step, 'completed' | 'subSteps'> & { subSteps: SubStep[] })[] 
    };

    // Adiciona o campo 'completed: false' para todas as etapas
    // (já que é uma trilha nova, nenhuma etapa foi concluída ainda)
    const pathWithCompletion = {
      ...generatedPath,
      steps: generatedPath.steps.map(step => ({ ...step, completed: false })),
    };
    
    return pathWithCompletion;
  } catch (error) {
    console.error("Error generating learning path:", error);
    throw new Error("Não foi possível gerar a trilha de aprendizagem. Por favor, tente novamente.");
  }
};

/**
 * Gera 3 trilhas de aprendizagem recomendadas baseadas no perfil do usuário.
 * 
 * Esta função cria recomendações personalizadas considerando o curso/área
 * de formação e o nível de experiência do usuário. As trilhas são focadas
 * em sub-áreas dentro do campo de interesse do usuário.
 * 
 * @param course - Área de formação/curso do usuário (ex: "Desenvolvimento de Software")
 * @param experienceLevel - Nível de experiência ('Iniciante', 'Intermediário', 'Avançado')
 * @returns Promise com array de 3 trilhas recomendadas
 * @throws Error se a geração falhar
 * 
 * @example
 * const recomendacoes = await generateRecommendedPaths(
 *   "Desenvolvimento de Software",
 *   "Iniciante"
 * );
 * console.log(recomendacoes.length); // 3
 */
/**
 * Gera recomendações baseadas no desempenho do usuário.
 * 
 * Esta função analisa o desempenho do usuário e gera novas trilhas
 * personalizadas que complementam o aprendizado atual, considerando
 * áreas já exploradas e próximos passos lógicos.
 * 
 * @param course - Área de formação do usuário
 * @param experienceLevel - Nível de experiência atual
 * @param performanceSummary - Resumo do desempenho do usuário
 * @returns Promise com array de 2-3 trilhas recomendadas baseadas no desempenho
 * 
 * @example
 * const newPaths = await generatePerformanceBasedRecommendations(
 *   "Desenvolvimento",
 *   "Intermediário",
 *   "O usuário completou 3 trilhas de JavaScript..."
 * );
 */
export const generatePerformanceBasedRecommendations = async (
  course: string,
  experienceLevel: User['experienceLevel'],
  performanceSummary: string
): Promise<Omit<LearningPath, 'id' | 'progress'>[]> => {
  try {
    // Prompt específico para gerar recomendações baseadas no desempenho
    const fullPrompt = `
      Você é um especialista em design instrucional e um mentor de carreira sênior. 
      Sua tarefa é criar 2-3 trilhas de aprendizagem NOVAS e COMPLEMENTARES baseadas no 
      desempenho e progresso atual do estudante.
      
      PERFIL DO ESTUDANTE:
      - Área de Formação: "${course}"
      - Nível de Experiência: "${experienceLevel}"
      
      DESEMPENHO E PROGRESSO:
      ${performanceSummary}
      
      IMPORTANTE:
      - As trilhas devem ser NOVAS e DIFERENTES das que o estudante já tem
      - Devem complementar e avançar o aprendizado baseado no que já foi estudado
      - Se o estudante já tem progresso em certas áreas, sugira trilhas que aprofundem ou expandam esses conhecimentos
      - Se o estudante completou trilhas, sugira próximos passos lógicos e avançados
      - As trilhas devem ser estritamente focadas em sub-áreas DENTRO do campo de "${course}"
      - Evite repetir trilhas similares às que o estudante já possui
      
      Para cada uma das 2-3 trilhas, forneça uma estrutura completa:
      - Título, descrição, categoria (deve ser "${course}") e dificuldade ('Iniciante', 'Intermediário', 'Avançado').
      - Uma lista de 5 a 7 etapas principais.
      - Para cada etapa: título, descrição, a rationale (por que é importante), e 4-6 sub-etapas detalhadas.
      - Para cada sub-etapa, forneça o **tópico** e um **link (URL)** para um recurso externo 
        de alta qualidade sobre o assunto.

      A resposta DEVE ser um objeto JSON com uma chave "paths", contendo um array de 2-3 objetos de trilha, 
      seguindo estritamente o schema fornecido.
    `;

    // Chama a API do Gemini
    const response = await getAI().models.generateContent({
      model: "gemini-2.5-flash",
      contents: fullPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: recommendedPathsSchema,
        temperature: 0.9,  // Mais criativo para gerar trilhas diferentes
      },
    });

    // Parseia a resposta JSON
    const jsonText = response.text.trim();
    const result = JSON.parse(jsonText) as { 
      paths: (Omit<LearningPath, 'id' | 'progress' | 'steps'> & { 
        steps: (Omit<Step, 'completed' | 'subSteps'> & { subSteps: SubStep[] })[] 
      })[] 
    };

    // Valida se a resposta contém as trilhas esperadas
    if (!result.paths || !Array.isArray(result.paths)) {
        throw new Error("A resposta da IA não continha um array de trilhas válido.");
    }
    
    // Adiciona 'completed: false' para todas as etapas de todas as trilhas
    const pathsWithCompletion = result.paths.map(path => ({
        ...path,
        steps: path.steps.map(step => ({ ...step, completed: false })),
    }));

    return pathsWithCompletion;
  } catch (error) {
    console.error("Error generating performance-based recommendations:", error);
    throw new Error("Não foi possível gerar recomendações baseadas no desempenho. Tente novamente mais tarde.");
  }
};

export const generateRecommendedPaths = async (
  course: string,
  experienceLevel: User['experienceLevel']
): Promise<Omit<LearningPath, 'id' | 'progress'>[]> => {
  try {
    // Prompt específico para gerar recomendações baseadas no perfil
    const fullPrompt = `
      Você é um especialista em design instrucional e um mentor de carreira sênior. 
      Sua tarefa é criar 3 trilhas de aprendizagem FUNDAMENTAIS, DIVERSIFICADAS e COMPLETAS 
      para um estudante com o seguinte perfil:
      - Área de Formação: "${course}"
      - Nível de Experiência: "${experienceLevel}"

      IMPORTANTE: As trilhas devem ser estritamente focadas em sub-áreas DENTRO do campo de "${course}". 
      O conteúdo deve ser profundo e relevante para o nível de dificuldade atribuído.
      
      Para cada uma das 3 trilhas, forneça uma estrutura completa:
      - Título, descrição, categoria (deve ser "${course}") e dificuldade ('Iniciante', 'Intermediário', 'Avançado').
      - Uma lista de 5 a 7 etapas principais.
      - Para cada etapa: título, descrição, a rationale (por que é importante), e 4-6 sub-etapas detalhadas.
      - Para cada sub-etapa, forneça o **tópico** e um **link (URL)** para um recurso externo 
        de alta qualidade sobre o assunto.

      A resposta DEVE ser um objeto JSON com uma chave "paths", contendo um array de 3 objetos de trilha, 
      seguindo estritamente o schema fornecido.
    `;

    // Chama a API do Gemini
    const response = await getAI().models.generateContent({
      model: "gemini-2.5-flash",
      contents: fullPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: recommendedPathsSchema,
        temperature: 0.8,  // Um pouco mais criativo para diversificar as recomendações
      },
    });

    // Parseia a resposta JSON
    const jsonText = response.text.trim();
    const result = JSON.parse(jsonText) as { 
      paths: (Omit<LearningPath, 'id' | 'progress' | 'steps'> & { 
        steps: (Omit<Step, 'completed' | 'subSteps'> & { subSteps: SubStep[] })[] 
      })[] 
    };

    // Valida se a resposta contém as trilhas esperadas
    if (!result.paths || !Array.isArray(result.paths)) {
        throw new Error("A resposta da IA não continha um array de trilhas válido.");
    }
    
    // Adiciona 'completed: false' para todas as etapas de todas as trilhas
    const pathsWithCompletion = result.paths.map(path => ({
        ...path,
        steps: path.steps.map(step => ({ ...step, completed: false })),
    }));

    return pathsWithCompletion;
  } catch (error) {
    console.error("Error generating recommended paths:", error);
    throw new Error("Não foi possível gerar as recomendações. Por favor, recarregue a página para tentar novamente.");
  }
};
