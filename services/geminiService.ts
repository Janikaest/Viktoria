
import { GoogleGenAI } from "@google/genai";
import { VideoFragment, Factor, Player } from '../types';

// Note: In a real production app, API calls should be proxied through a backend 
// to keep the API KEY secure. For this demo, we assume env var availability.

export const generateEpisodeSummary = async (
  fragment: VideoFragment,
  allFactors: Factor[],
  players: Player[]
): Promise<string> => {
  
  // If no API key is present, return a mock response for UI demonstration
  if (!process.env.API_KEY) {
    return "AI Анализ (Демо): Игрок продемонстрировал отличное позиционирование во время фазы перехода. Однако выбор броска можно улучшить, так как вратарь перекрыл угол. Рекомендуется отрабатывать броски с быстрым релизом.";
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Construct a prompt context from the structured data
  const factorsDescription = fragment.assignedFactors.map(af => {
    const factorDef = allFactors.find(f => f.id === af.factorId);
    const player = players.find(p => p.id === af.targetId);
    const targetName = player ? `${player.name} (#${player.number})` : af.scope;
    return `- ${factorDef?.name || 'Неизвестный фактор'} (${factorDef?.isPositive ? 'Положительно' : 'Отрицательно'}): Применено к ${targetName}`;
  }).join('\n');

  const prompt = `
    Ты профессиональный ассистент хоккейного аналитика. 
    Проанализируй следующие структурированные данные эпизода матча под названием "${fragment.title}".
    
    Описание эпизода: ${fragment.description}
    
    Замеченные технические факторы:
    ${factorsDescription}
    
    Пожалуйста, предоставь краткое, конструктивное тренерское резюме (3-4 предложения) для этого эпизода на РУССКОМ ЯЗЫКЕ. 
    Выдели, что было сделано хорошо, а что требует улучшения, основываясь на предоставленных факторах.
    Используй профессиональную хоккейную терминологию.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Анализ недоступен.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Ошибка генерации анализа. Проверьте соединение или API ключ.";
  }
};