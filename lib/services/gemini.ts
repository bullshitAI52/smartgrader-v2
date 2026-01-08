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
      // Use specific version tag -001 to avoid 404s on aliases in some regions/keys
      this.flashModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-001' });
      this.proModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-001' });
    }
  }

  async generateExamGrading(
    images: File[],
    totalMaxScore: number = 100
  ): Promise<ExamGradingResult> {
    // ensureInitialized here primarily checks for apiKey
    this.ensureInitialized();
    const genAI = new GoogleGenerativeAI(this.apiKey!);

    // ... existing implementation details for fileToBase64 conversion if needed explicitly ...
    // Note: The previous implementation logic assumed fileToBase64 helper exists. 
    // I will inline the logic or ensure the helper is used correctly. 

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
      8. Return strictly legitimate JSON only.

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

    const modelsToTry = ['gemini-1.5-pro-002', 'gemini-1.5-flash-001', 'gemini-1.5-pro'];
    let lastError = null;

    for (const modelName of modelsToTry) {
      try {
        console.log(`Attempting grading with model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent([prompt, ...imageParts]);
        const response = await result.response;
        const text = response.text();

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error(`Failed to parse JSON from ${modelName} response`);
        }

        return JSON.parse(jsonMatch[0]) as ExamGradingResult;
      } catch (error: any) {
        console.warn(`Model ${modelName} failed:`, error);
        lastError = error;
        // Continue to next model
      }
    }

    const msg = lastError instanceof Error ? lastError.message : String(lastError);
    throw new Error(`All models failed to grade exam. Last error: ${msg}`);
  }

  // New Method: OCR
  async recognizeText(image: File): Promise<string> {
    this.ensureInitialized();
    const genAI = new GoogleGenerativeAI(this.apiKey!);
    const base64 = await this.fileToBase64(image);
    const part = { inlineData: { data: base64, mimeType: image.type } };

    const prompt = "Please extract all the text from this image exactly as it appears. Preserve formatting where possible.";

    const modelsToTry = ['gemini-1.5-flash-001', 'gemini-1.5-pro-002', 'gemini-1.5-pro'];
    let lastError = null;

    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent([prompt, part]);
        return result.response.text();
      } catch (error: any) {
        console.warn(`OCR Model ${modelName} failed:`, error);
        lastError = error;
      }
    }
    const msg = lastError instanceof Error ? lastError.message : String(lastError);
    throw new Error(`OCR failed on all models. Last error: ${msg}`);
  }

  // New Method: Homework Solver
  async solveHomework(image: File, instruction?: string): Promise<string> {
    this.ensureInitialized();
    const genAI = new GoogleGenerativeAI(this.apiKey!);
    const base64 = await this.fileToBase64(image);
    const part = { inlineData: { data: base64, mimeType: image.type } };

    const prompt = `
      You are a helpful AI tutor. The user has uploaded a homework problem.
      Instruction: ${instruction || "Solve this problem step-by-step and explain the concepts."}
      
      Please provide a clear, well-formatted response using Markdown.
      If it's a math problem, show calculation steps.
    `;

    const modelsToTry = ['gemini-1.5-pro-002', 'gemini-1.5-flash-001', 'gemini-1.5-pro'];
    let lastError = null;

    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent([prompt, part]);
        return result.response.text();
      } catch (error: any) {
        console.warn(`Homework Model ${modelName} failed:`, error);
        lastError = error;
      }
    }
    const msg = lastError instanceof Error ? lastError.message : String(lastError);
    throw new Error(`Homework solving failed on all models. Last error: ${msg}`);
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