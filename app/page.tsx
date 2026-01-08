'use client';

import { useState } from 'react';
import { SmartUploader } from '@/components/shared/smart-uploader';
import { GradingOverlay } from '@/components/grading/grading-overlay';
import { ExportCanvas } from '@/components/grading/export-canvas';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, AlertCircle, RefreshCw, X } from 'lucide-react';
import { ExamGradingResult } from '@/lib/services/gemini';

export default function Home() {
  const [images, setImages] = useState<string[]>([]);
  const [gradingResult, setGradingResult] = useState<ExamGradingResult | null>(null);
  const [isGrading, setIsGrading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState<Map<number, { width: number; height: number }>>(new Map());

  const handleUpload = async (files: File[], totalMaxScore: number) => {
    if (!files || files.length === 0) {
      setError('请选择要上传的图片');
      return;
    }
    
    if (totalMaxScore < 1 || totalMaxScore > 1000) {
      setError('满分值必须在 1-1000 之间');
      return;
    }

    setIsGrading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append('images', file));
      formData.append('totalMaxScore', totalMaxScore.toString());

      const response = await fetch('/api/grade', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to grade exam');
      }

      const result: { success: boolean; data: ExamGradingResult; error?: string } = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to grade exam');
      }

      setImages(files.map((file) => URL.createObjectURL(file)));
      setImageDimensions(new Map());
      setGradingResult(result.data);
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsGrading(false);
    }
  };

  const handleReset = () => {
    setImages([]);
    setGradingResult(null);
    setError(null);
    setImageDimensions(new Map());
  };

  const wrongCount = gradingResult?.pages.reduce(
    (sum, page) => sum + page.questions.filter((q) => q.status === 'wrong').length,
    0
  ) || 0;

  const correctCount = gradingResult?.pages.reduce(
    (sum, page) => sum + page.questions.filter((q) => q.status === 'correct').length,
    0
  ) || 0;

  const partialCount = gradingResult?.pages.reduce(
    (sum, page) => sum + page.questions.filter((q) => q.status === 'partial').length,
    0
  ) || 0;

  const scorePercentage = gradingResult 
    ? Math.round((gradingResult.total_score / gradingResult.total_max_score) * 100)
    : 0;

  const getScoreColor = (percentage: number) => {
    if (percentage >= 90) return 'from-green-500 to-emerald-600';
    if (percentage >= 80) return 'from-blue-500 to-cyan-600';
    if (percentage >= 70) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-rose-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-16">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
              <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <span className="text-red-800 font-medium">{error}</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setError(null)}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        {!gradingResult && !isGrading && (
          <Card className="shadow-lg border-2">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
              <CardTitle className="text-xl flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
                上传试卷开始批改
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <SmartUploader onUpload={handleUpload} />
            </CardContent>
          </Card>
        )}

        {isGrading && (
          <Card className="shadow-lg">
            <CardContent className="py-16 lg:py-20">
              <div className="flex flex-col items-center justify-center space-y-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping"></div>
                  <RefreshCw className="w-16 h-16 text-blue-500 animate-spin" />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-xl font-semibold text-gray-800">正在批改试卷...</p>
                  <p className="text-sm text-gray-500">AI 正在分析每一道题目，请稍候</p>
                </div>
                <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 animate-[shimmer_2s_infinite]"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {gradingResult && (
          <Tabs defaultValue="result" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 h-12">
              <TabsTrigger value="result" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                批改结果
              </TabsTrigger>
              <TabsTrigger value="export" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                导出分享
              </TabsTrigger>
            </TabsList>

            <TabsContent value="result" className="space-y-6 mt-6">
              <div className={`bg-gradient-to-r ${getScoreColor(scorePercentage)} text-white p-6 lg:p-8 rounded-xl shadow-lg`}>
                <div className="text-center space-y-4">
                  <p className="text-sm uppercase tracking-wider font-medium opacity-90">总分</p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
                    <span className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
                      {gradingResult.total_score}
                    </span>
                    <span className="text-2xl sm:text-3xl text-white/80 font-medium">
                      / {gradingResult.total_max_score}
                    </span>
                  </div>
                  <div className="inline-block bg-white/20 backdrop-blur-sm px-4 py-1 rounded-full text-sm font-medium">
                    得分率: {scorePercentage}%
                  </div>
                  <div className="flex items-center justify-center gap-4 sm:gap-8 mt-6 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="font-medium">正确: {correctCount}</span>
                    </div>
                    {partialCount > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full border-2 border-yellow-300"></div>
                        <span className="font-medium">部分正确: {partialCount}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <XCircle className="w-5 h-5" />
                      <span className="font-medium">错误: {wrongCount}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {images.map((imageUrl, index) => {
                  const dimensions = imageDimensions.get(index);
                  return (
                    <Card key={index} className="shadow-md overflow-hidden">
                      <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                        <CardTitle className="flex items-center justify-between text-base sm:text-lg">
                          <span className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded bg-blue-500 text-white text-xs flex items-center justify-center">
                              {index + 1}
                            </span>
                            第 {index + 1} 页
                          </span>
                          <Badge variant="secondary" className="font-semibold">
                            得分: {gradingResult.pages[index]?.page_score || 0}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="relative">
                          <img
                            ref={(el) => {
                              if (el) {
                                el.onload = () => {
                                  if (el.naturalWidth && el.naturalHeight) {
                                    setImageDimensions((prev) => {
                                      const next = new Map(prev);
                                      next.set(index, { width: el.naturalWidth, height: el.naturalHeight });
                                      return next;
                                    });
                                  }
                                };
                              }
                            }}
                            src={imageUrl}
                            alt={`Page ${index + 1}`}
                            className="w-full"
                            style={{ display: 'none' }}
                          />
                          <GradingOverlay
                            imageUrl={imageUrl}
                            questions={gradingResult.pages[index]?.questions || []}
                            imageWidth={dimensions?.width || 600}
                            imageHeight={dimensions?.height || 800}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {gradingResult.summary_tags.length > 0 && (
                <Card className="shadow-md">
                  <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <AlertCircle className="w-5 h-5 text-purple-600" />
                      学情分析
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="flex flex-wrap gap-2">
                      {gradingResult.summary_tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="px-3 py-1.5 text-sm">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-center">
                <Button 
                  onClick={handleReset} 
                  variant="outline" 
                  size="lg"
                  className="gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  批改新试卷
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="export" className="space-y-6 mt-6">
              <Card className="shadow-md">
                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
                  <CardTitle>导出试卷结果</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <ExportCanvas images={images} gradingResult={gradingResult} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </main>
      
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}