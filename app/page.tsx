'use client';

import { useState, useEffect } from 'react';
import { SmartUploader } from '@/components/shared/smart-uploader';
import { GradingOverlay } from '@/components/grading/grading-overlay';
import { ExportCanvas } from '@/components/grading/export-canvas';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { CheckCircle2, XCircle, AlertCircle, RefreshCw, X, Settings2, Sparkles, BrainCircuit, GraduationCap } from 'lucide-react';
import { ExamGradingResult, geminiService } from '@/lib/services/gemini';
import { cn } from '@/lib/utils';

const TABS = [
  { id: 'upload', label: '上传试卷批改' },
  { id: 'tutor', label: 'AI智能辅导' },
  { id: 'bank', label: '万能题库' },
  { id: 'analysis', label: '学情分析' },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState('upload');
  const [images, setImages] = useState<string[]>([]);
  const [gradingResult, setGradingResult] = useState<ExamGradingResult | null>(null);
  const [isGrading, setIsGrading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState<Map<number, { width: number; height: number }>>(new Map());

  // API Key State
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    const storedKey = localStorage.getItem('gemini_api_key');
    if (storedKey) {
      setApiKey(storedKey);
      geminiService.setApiKey(storedKey);
    } else {
      setShowApiKeyModal(true);
    }
  }, []);

  const handleSaveApiKey = () => {
    if (!apiKey.trim()) return;
    localStorage.setItem('gemini_api_key', apiKey);
    geminiService.setApiKey(apiKey);
    setShowApiKeyModal(false);
  };

  const handleUpload = async (files: File[], totalMaxScore: number) => {
    if (!apiKey) {
      setShowApiKeyModal(true);
      return;
    }

    // 参数前置校验，提升鲁棒性
    if (!files || files.length === 0) {
      setError('请选择要上传的图片');
      return;
    }

    if (files.length > 5) {
      setError('最多上传 5 张图片');
      return;
    }

    if (!Number.isFinite(totalMaxScore) || totalMaxScore < 1 || totalMaxScore > 1000) {
      setError('满分值必须在 1-1000 之间');
      return;
    }

    setIsGrading(true);
    setError(null);

    try {
      // Direct client-side call
      const result = await geminiService.generateExamGrading(files, totalMaxScore);

      setImages(files.map((file) => URL.createObjectURL(file)));
      setImageDimensions(new Map());
      setGradingResult(result);
    } catch (err) {
      console.error('Error:', err);
      // More user friendly error
      const message = err instanceof Error ? err.message : 'An error occurred during grading';
      if (message.includes('API Key')) {
        setError('Invalid or missing API Key. Please check your settings.');
        setShowApiKeyModal(true);
      } else {
        setError(message);
      }
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
    if (percentage >= 90) return 'from-emerald-500 to-teal-600';
    if (percentage >= 80) return 'from-blue-500 to-indigo-600';
    if (percentage >= 70) return 'from-amber-500 to-orange-500';
    return 'from-rose-500 to-red-600';
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Configure Dialog */}
      <Dialog open={showApiKeyModal} onOpenChange={setShowApiKeyModal}>
        <DialogContent className="sm:max-w-md glass-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-indigo-500" />
              Configuration
            </DialogTitle>
            <DialogDescription>
              Please enter your Google Gemini API Key to use the AI features.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              type="password"
              placeholder="Gemini API Key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button onClick={handleSaveApiKey}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Top Navigation - Sketch Style */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-100 pb-1">
        <div className="flex overflow-x-auto no-scrollbar justify-between px-4 pt-4 max-w-lg mx-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-shrink-0 px-2 pb-2 text-sm md:text-base font-medium transition-colors relative",
                activeTab === tab.id
                  ? "text-[#FF4D4F] font-bold"
                  : "text-gray-400 hover:text-gray-600"
              )}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#FF4D4F] rounded-full" />
              )}
            </button>
          ))}
        </div>
        {/* Settings Icon Positioned Absolute or in header */}
        <div className="absolute top-4 right-4">
          <button onClick={() => setShowApiKeyModal(true)} className="text-gray-300 hover:text-gray-500">
            <Settings2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <main className="max-w-lg mx-auto min-h-[calc(100vh-60px)] p-6 relative">

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between gap-4">
            <span className="text-red-600 text-sm font-medium">{error}</span>
            <button onClick={() => setError(null)}><X className="w-4 h-4 text-red-400" /></button>
          </div>
        )}

        {/* Upload Tab Content (Home) */}
        {activeTab === 'upload' && !gradingResult && !isGrading && (
          <div className="h-full flex flex-col pt-8">
            {/* Sketch-like Drop Zone */}
            <div className="border border-red-200 rounded-xl p-8 h-[60vh] flex flex-col items-center justify-center relative overflow-hidden bg-[#FFFBFB]">
              {/* Decorative corners similar to a view finder or sketch bounds could be added here */}

              <div className="w-full h-full flex flex-col items-center justify-center space-y-8">
                <p className="text-3xl font-bold text-gray-700" style={{ fontFamily: 'cursive' }}>拖拽图片到这里</p>
                <p className="text-gray-500 text-sm">1-5张支持 JPG, WEBP</p>
                {/* Reusing SmartUploader logic but visually hidden input mostly */}
                <div className="w-full">
                  <SmartUploader onUpload={handleUpload} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isGrading && (
          <div className="h-[60vh] flex flex-col items-center justify-center space-y-6">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 border-4 border-red-100 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-red-500 rounded-full border-t-transparent animate-spin"></div>
            </div>
            <p className="text-gray-600 font-medium animate-pulse">AI正在阅卷中...</p>
          </div>
        )}

        {/* Results View (Preserved functionality, simplified container) */}
        {gradingResult && (
          <div className="space-y-6 pb-20 animate-in slide-in-from-bottom-4">
            {/* Score Header */}
            <div className={`bg-gradient-to-r ${getScoreColor(scorePercentage)} text-white p-6 rounded-2xl shadow-lg relative overflow-hidden`}>
              <div className="relative z-10 flex flex-col items-center">
                <span className="text-lg opacity-90 mb-1">本次得分</span>
                <span className="text-6xl font-bold tracking-tight">{gradingResult.total_score}</span>
                <div className="mt-4 flex gap-6 text-sm font-medium">
                  <span>正确 {correctCount}</span>
                  <span>错误 {wrongCount}</span>
                </div>
              </div>
            </div>

            {/* AI Insights */}
            {gradingResult.summary_tags.length > 0 && (
              <Card className="border-l-4 border-l-purple-500 shadow-sm">
                <CardHeader className="py-3 px-4">
                  <CardTitle className="flex items-center gap-2 text-base text-gray-800">
                    <BrainCircuit className="w-4 h-4 text-purple-600" />
                    AI Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-3 px-4">
                  <div className="flex flex-wrap gap-2">
                    {gradingResult.summary_tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="px-3 py-1 text-xs bg-purple-50 text-purple-700 border-purple-200">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Bar */}
            <div className="flex gap-3 overflow-x-auto pb-2">
              <Button onClick={handleReset} variant="outline" className="rounded-full border-red-200 text-red-600 hover:bg-red-50">
                <RefreshCw className="w-4 h-4 mr-1" /> 再批改一张
              </Button>
            </div>

            {/* Result Images List */}
            <div className="space-y-4">
              {images.map((imageUrl, index) => {
                const dimensions = imageDimensions.get(index);
                return (
                  <div key={index} className="border rounded-xl overflow-hidden shadow-sm bg-white">
                    <div className="p-3 border-b flex justify-between items-center bg-gray-50">
                      <span className="font-medium text-gray-700">第 {index + 1} 页</span>
                      <Badge variant="outline" className="bg-white">得分: {gradingResult.pages[index]?.page_score}</Badge>
                    </div>
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
                        className="w-full h-auto"
                      />
                      <div className="absolute inset-0">
                        <GradingOverlay
                          imageUrl={imageUrl}
                          questions={gradingResult.pages[index]?.questions || []}
                          imageWidth={dimensions?.width || 600}
                          imageHeight={dimensions?.height || 800}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Export Section */}
            <div className="pt-4">
              <h3 className="font-bold text-gray-800 mb-2">生成分析报告</h3>
              <ExportCanvas images={images} gradingResult={gradingResult} />
            </div>
          </div>
        )}

        {/* Placeholder for other tabs */}
        {(activeTab === 'tutor' || activeTab === 'bank' || activeTab === 'analysis') && !gradingResult && (
          <div className="flex flex-col items-center justify-center h-[60vh] text-gray-400 space-y-4">
            <BrainCircuit className="w-16 h-16 opacity-20" />
            <p>该功能即将上线</p>
          </div>
        )}

      </main>
    </div>
  );
}