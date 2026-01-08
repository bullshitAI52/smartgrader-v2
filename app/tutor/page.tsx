'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Send, BookOpen, FileText, Sparkles, X, RotateCcw, CheckCircle2 } from 'lucide-react';

export default function TutorPage() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [tutorResponse, setTutorResponse] = useState('');
  const [isTutoring, setIsTutoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'math' | 'essay'>('math');

  const handleTutor = useCallback(async () => {
    if (!question.trim()) {
      setError('请输入题目内容');
      return;
    }
    
    setIsTutoring(true);
    setError(null);
    
    try {
      const response = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, answer }),
      });

      const result: { success: boolean; data: string; error?: string } = await response.json();
      
      if (result.success) {
        setTutorResponse(result.data);
      } else {
        throw new Error(result.error || '辅导请求失败');
      }
    } catch (err) {
      console.error('Error:', err);
      const errorMessage = err instanceof Error ? err.message : '辅导请求失败，请重试';
      setTutorResponse(`❌ ${errorMessage}`);
      setError(errorMessage);
    } finally {
      setIsTutoring(false);
    }
  }, [question, answer]);

  const handleClear = useCallback(() => {
    setQuestion('');
    setAnswer('');
    setTutorResponse('');
    setError(null);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pt-16">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            AI 智能辅导
          </h1>
          <p className="text-gray-600 mt-2">苏格拉底式启发辅导，让孩子自己找到答案</p>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'math' | 'essay')} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 h-14">
            <TabsTrigger 
              value="math" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white text-base font-medium gap-2"
            >
              <BookOpen className="w-5 h-5" />
              数学辅导
            </TabsTrigger>
            <TabsTrigger 
              value="essay" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white text-base font-medium gap-2"
            >
              <FileText className="w-5 h-5" />
              作文辅导
            </TabsTrigger>
          </TabsList>

          <TabsContent value="math" className="space-y-6">
            <Card className="shadow-lg border-2">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2">
                <CardTitle className="flex items-center justify-between text-xl">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-white" />
                    </div>
                    输入题目
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClear}
                    className="h-8 px-3 text-sm"
                  >
                    <RotateCcw className="w-4 h-4 mr-1" />
                    重置
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div>
                  <label className="block text-sm font-semibold mb-3 text-gray-700">
                    题目描述
                  </label>
                  <Textarea
                    placeholder="请输入题目内容，例如：一个长方形的长是8cm，宽是5cm，求它的面积和周长..."
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    rows={5}
                    className="text-base leading-relaxed resize-none"
                  />
                  <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                    <span>{question.length} 字符</span>
                    {question.length > 0 && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold mb-3 text-gray-700">
                    你的答案（可选）
                  </label>
                  <Textarea
                    placeholder="如果你已经尝试了解答，可以在这里写下你的答案，AI 会针对性地给出提示..."
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    rows={4}
                    className="text-base leading-relaxed resize-none"
                  />
                  <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                    <span>{answer.length} 字符</span>
                    {answer.length > 0 && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm flex items-center gap-2">
                    <X className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <Button 
                  onClick={handleTutor} 
                  disabled={isTutoring || !question.trim()}
                  className="w-full h-12 text-base font-semibold gap-2"
                >
                  <Send className="w-5 h-5" />
                  {isTutoring ? 'AI 正在思考...' : '开始辅导'}
                </Button>
              </CardContent>
            </Card>

            {tutorResponse && (
              <Card className="shadow-lg border-2 border-green-200">
                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b-2">
                  <CardTitle className="flex items-center gap-2 text-xl text-green-800">
                    <CheckCircle2 className="w-6 h-6" />
                    辅导反馈
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="prose prose-sm max-w-none bg-white p-6 rounded-xl border border-gray-200 shadow-inner">
                    <pre className="whitespace-pre-wrap text-sm sm:text-base text-gray-800 leading-relaxed font-sans">
                      {tutorResponse}
                    </pre>
                  </div>
                  <div className="mt-4 flex justify-center">
                    <Button 
                      variant="outline" 
                      onClick={handleClear}
                      className="gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      辅导新题目
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="essay" className="space-y-6">
            <Card className="shadow-lg border-2">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b-2">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  作文辅导
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div>
                  <label className="block text-sm font-semibold mb-3 text-gray-700">
                    作文题目
                  </label>
                  <Textarea
                    placeholder="请输入作文题目，例如：我的家乡..."
                    rows={4}
                    className="text-base leading-relaxed resize-none"
                  />
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-yellow-800 mb-2">功能开发中</h4>
                      <p className="text-sm text-yellow-700 leading-relaxed">
                        作文辅导功能正在开发中，即将支持：
                      </p>
                      <ul className="text-sm text-yellow-700 mt-2 space-y-1 list-disc list-inside">
                        <li>生成三种风格的范文（生动有趣版、深刻哲理版、逻辑严谨版）</li>
                        <li>AI 逐句点评和修改建议</li>
                        <li>关键词和句式分析</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <Button disabled className="w-full h-12 text-base font-semibold gap-2" variant="outline">
                  <Sparkles className="w-5 h-5" />
                  即将推出
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}