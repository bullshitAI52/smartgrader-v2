import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

export interface Question {
  id: number;
  status: 'correct' | 'wrong' | 'partial';
  score_obtained: number;
  score_max: number;
  deduction: number;
  box_2d: [number, number, number, number];
  analysis: string;
  error_type?: 'calculation' | 'concept' | 'logic';
}

export interface ExamPage {
  image_url: string;
  page_score: number;
  questions: Question[];
}

export interface ExamGradingResult {
  total_score: number;
  total_max_score: number;
  pages: ExamPage[];
  summary_tags: string[];
}

class GeminiService {
  private flashModel: GenerativeModel | null = null;
  private proModel: GenerativeModel | null = null;
  private apiKey: string | null = null;

  setApiKey(key: string) {
    this.apiKey = key;
    this.flashModel = null;
    this.proModel = null;
  }

  private ensureInitialized() {
    if (!this.flashModel || !this.proModel) {
      if (!this.apiKey) {
        throw new Error('Please provides Google Gemini API Key');
      }

      const genAI = new GoogleGenerativeAI(this.apiKey);
      this.flashModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      this.proModel = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    }
  }

  async generateExamGrading(
    images: File[],
    totalMaxScore: number = 100
  ): Promise<ExamGradingResult> {
    this.ensureInitialized();

    const imageParts = await Promise.all(
      images.map(async (image) => {
        const base64 = await this.fileToBase64(image);
        return {
          inlineData: {
            data: base64,
            mimeType: image.type,
          },
        };
      })
    );

    const prompt = `
      You are an expert exam grader. Analyze the following exam images and provide a detailed grading result.
      
      IMPORTANT REQUIREMENTS:
      1. Identify all questions on the exam
      2. For each question, determine if the answer is correct, wrong, or partially correct
      3. Calculate scores based on the total max score of ${totalMaxScore}
      4. For wrong answers, provide step-by-step solution explanations
      5. Categorize errors as 'calculation', 'concept', or 'logic'
      6. Generate bounding boxes for each question (normalized 0-1000 scale)
      7. Provide summary tags for the overall performance

      Return STRICT JSON in this format:
      {
        "total_score": number,
        "total_max_score": ${totalMaxScore},
        "pages": [
          {
            "image_url": string (page number reference),
            "page_score": number,
            "questions": [
              {
                "id": number,
                "status": "correct" | "wrong" | "partial",
                "score_obtained": number,
                "score_max": number,
                "deduction": number,
                "box_2d": [number, number, number, number],
                "analysis": string (detailed step-by-step solution for wrong answers),
                "error_type": "calculation" | "concept" | "logic" (if applicable)
              }
            ]
          }
        ],
        "summary_tags": string[]
      }
    `;

    try {
      const result = await this.proModel!.generateContent([prompt, ...imageParts]);
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to parse JSON from AI response');
      }

      const parsedResult = JSON.parse(jsonMatch[0]);
      return parsedResult as ExamGradingResult;
    } catch (error) {
      console.error('Error grading exam:', error);
      throw new Error('Failed to grade exam');
    }
  }

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async generateSocraticTutoring(question: string, studentAnswer?: string): Promise<string> {
    this.ensureInitialized();

    const prompt = `
      You are a Socratic tutor. A student is working on this problem: "${question}"
      ${studentAnswer ? `Their answer is: "${studentAnswer}"` : ''}
      
      DO NOT provide the direct answer. Instead, guide the student through the problem step by step:
      1. First, identify the key concept or formula needed
      2. Then, provide a hint about the first step
      3. Finally, if needed, provide the complete solution
      
      Be encouraging and clear.
    `;

    try {
      const result = await this.flashModel!.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error generating tutoring:', error);
      throw new Error('Failed to generate tutoring');
    }
  }

  async generateEssayExamples(essayTopic: string): Promise<{
    creative: string;
    philosophical: string;
    analytical: string;
  }> {
    this.ensureInitialized();

    const prompt = `
      Generate three different style essays on the topic: "${essayTopic}"
      
      Return STRICT JSON:
      {
        "creative": "engaging, storytelling-style essay",
        "philosophical": "deep, reflective essay with philosophical insights",
        "analytical": "logical, well-structured analytical essay"
      }
    `;

    try {
      const result = await this.proModel!.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to parse JSON from AI response');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Error generating essay examples:', error);
      throw new Error('Failed to generate essay examples');
    }
  }
}

export const geminiService = new GeminiService();