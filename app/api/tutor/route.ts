import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { question, answer } = await request.json();

    if (!question || question.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: '请输入题目内容' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: '服务配置错误' },
        { status: 500 }
      );
    }

    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
      你是一个苏格拉底式辅导老师。学生正在做这道题目：
      
      题目：${question}
      ${answer ? `学生的答案：${answer}` : ''}
      
      请按照以下步骤进行辅导：
      
      1. **引导思考**：首先，引导学生思考这道题目考查什么知识点或考点
      2. **提示思路**：然后，给出第一步的思路提示，但不要直接给出答案
      3. **逐步深入**：如果学生继续询问，再逐步给出更多提示
      4. **完整解析**：最后，提供完整的解题步骤和答案
      
      重要提示：
      - 使用苏格拉底式提问，引导学生自己思考
      - 不要一开始就直接给出答案
      - 语气要鼓励和友好
      - 解题步骤要清晰、详细
      - 使用数学公式格式，如 $x^2$ 等
      
      请用中文回答，格式清晰，易于阅读。
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ success: true, data: text });
  } catch (error) {
    console.error('Tutoring error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '辅导请求失败' 
      },
      { status: 500 }
    );
  }
}