'use client';

import { useState, useEffect } from 'react';
import { SmartUploader } from '@/components/shared/smart-uploader';
import { GradingOverlay } from '@/components/grading/grading-overlay';
import { ExportCanvas } from '@/components/grading/export-canvas';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { CheckCircle2, XCircle, AlertCircle, RefreshCw, X, Settings2, Sparkles, BrainCircuit, GraduationCap } from 'lucide-react';
import { ExamGradingResult, geminiService } from '@/lib/services/gemini';

export default function Home() {
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
    <div className="min-h-screen pt-16 pb-12 transition-colors duration-500">
      {/* Header / Nav */}
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/20 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-2 rounded-lg text-white shadow-lg shadow-indigo-500/30">
            <BrainCircuit size={24} />
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 to-violet-700 tracking-tight">
            SmartGrader AI
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowApiKeyModal(true)}
          className="hover:bg-indigo-50 text-indigo-900 rounded-full"
        >
          <Settings2 className="w-5 h-5" />
        </Button>
      </header>

      {/* API Key Modal */}
      <Dialog open={showApiKeyModal} onOpenChange={setShowApiKeyModal}>
        <DialogContent className="sm:max-w-md glass-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-500" />
              Configuration Required
            </DialogTitle>
            <DialogDescription>
              To process exams securely, please provide your Google Gemini API Key.
              It will be stored locally in your browser.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2 py-4">
            <div className="grid flex-1 gap-2">
              <Input
                id="apiKey"
                type="password"
                placeholder="Paste your Gemini API Key here..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="bg-white/50 border-indigo-100 focus:ring-indigo-500"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="submit"
              onClick={handleSaveApiKey}
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20"
            >
              Save & Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-50/90 backdrop-blur border border-red-200 rounded-xl flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-full">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <span className="text-red-800 font-medium">{error}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setError(null)}
              className="h-8 w-8 p-0 hover:bg-red-100 rounded-full"
            >
              <X className="w-4 h-4 text-red-700" />
            </Button>
          </div>
        )}

        {/* Hero & Upload Section */}
        {!gradingResult && !isGrading && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-10 animate-in fade-in duration-700">
            <div className="text-center space-y-4 max-w-2xl">
              <Badge variant="secondary" className="px-4 py-2 rounded-full bg-white/50 backdrop-blur border border-indigo-100 text-indigo-700 shadow-sm mb-4">
                ✨ Next-Gen AI Grading
              </Badge>
              <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-gray-900">
                Grade Exams in <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">Seconds</span>
              </h1>
              <p className="text-xl text-gray-500 max-w-xl mx-auto leading-relaxed">
                Upload photos of exam papers. Our AI instantly analyzes answers, calculates scores, and generates detailed feedback.
              </p>
            </div>

            <Card className="w-full max-w-3xl glass-card border-2 border-dashed border-indigo-100/50 overflow-hidden hover:border-indigo-300 transition-colors duration-500">
              <CardContent className="p-10">
                <SmartUploader onUpload={handleUpload} />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Loading State */}
        {isGrading && (
          <div className="flex flex-col items-center justify-center min-h-[50vh] animate-in fade-in duration-500">
            <Card className="glass-card p-12 w-full max-w-xl text-center shadow-2xl shadow-indigo-500/20 border-t-4 border-indigo-500">
              <div className="relative mb-8 mx-auto w-24 h-24">
                <div className="absolute inset-0 bg-indigo-500/20 rounded-full animate-ping"></div>
                <div className="relative bg-white p-6 rounded-full shadow-inner">
                  <RefreshCw className="w-12 h-12 text-indigo-600 animate-spin" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Analyzing Responses...</h2>
              <p className="text-gray-500 mb-8">AI is reading handwriting, checking logic, and calculating scores.</p>

              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 animate-progress w-full origin-left"></div>
              </div>
            </Card>
          </div>
        )}

        {/* Results Dashboard */}
        {gradingResult && (
          <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-700">

            {/* Scorecard Hero */}
            <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${getScoreColor(scorePercentage)} shadow-2xl shadow-indigo-500/30 text-white p-8 md:p-12`}>
              <div className="absolute top-0 right-0 p-12 opacity-10">
                <GraduationCap className="w-64 h-64" />
              </div>

              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="text-center md:text-left space-y-2">
                  <p className="text-indigo-100 font-medium tracking-wider uppercase text-sm">Total Score</p>
                  <div className="flex items-baseline gap-3 justify-center md:justify-start">
                    <span className="text-7xl font-bold tracking-tighter">{gradingResult.total_score}</span>
                    <span className="text-3xl text-white/60 font-medium">/ {gradingResult.total_max_score}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md rounded-full px-4 py-1 w-fit mx-auto md:mx-0">
                    <Sparkles className="w-4 h-4 text-yellow-300" />
                    <span className="font-semibold text-sm">Accuracy: {scorePercentage}%</span>
                  </div>
                </div>

                <div className="flex gap-4 md:gap-8 bg-black/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                  <div className="text-center">
                    <div className="text-3xl font-bold mb-1">{correctCount}</div>
                    <div className="text-xs text-emerald-200 font-medium uppercase tracking-wide flex items-center gap-1 justify-center">
                      <CheckCircle2 className="w-3 h-3" /> Correct
                    </div>
                  </div>
                  <div className="w-px bg-white/20"></div>
                  <div className="text-center">
                    <div className="text-3xl font-bold mb-1">{partialCount}</div>
                    <div className="text-xs text-amber-200 font-medium uppercase tracking-wide flex items-center gap-1 justify-center">
                      <div className="w-2 h-2 rounded-full bg-amber-200"></div> Partial
                    </div>
                  </div>
                  <div className="w-px bg-white/20"></div>
                  <div className="text-center">
                    <div className="text-3xl font-bold mb-1">{wrongCount}</div>
                    <div className="text-xs text-rose-200 font-medium uppercase tracking-wide flex items-center gap-1 justify-center">
                      <XCircle className="w-3 h-3" /> Wrong
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Tabs defaultValue="result" className="w-full">
              <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 h-14 bg-white/60 backdrop-blur border border-white/20 p-1 rounded-full shadow-lg mb-8">
                <TabsTrigger value="result" className="rounded-full h-12 data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all">
                  Detailed Analysis
                </TabsTrigger>
                <TabsTrigger value="export" className="rounded-full h-12 data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all">
                  Export Report
                </TabsTrigger>
              </TabsList>

              <TabsContent value="result" className="space-y-8">
                {/* Insights */}
                {gradingResult.summary_tags.length > 0 && (
                  <Card className="glass-card border-l-4 border-l-purple-500">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg text-gray-800">
                        <BrainCircuit className="w-5 h-5 text-purple-600" />
                        AI Insights
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {gradingResult.summary_tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="px-4 py-2 text-sm bg-purple-50 text-purple-700 border-purple-200">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Pages Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {images.map((imageUrl, index) => {
                    const dimensions = imageDimensions.get(index);
                    return (
                      <Card key={index} className="glass-card overflow-hidden group">
                        <CardHeader className="bg-gray-50/50 border-b border-gray-100 flex flex-row items-center justify-between p-4">
                          <div className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center shadow-md shadow-indigo-500/30">
                              {index + 1}
                            </span>
                            <span className="font-semibold text-gray-700">Page {index + 1}</span>
                          </div>
                          <Badge variant="secondary" className="bg-white shadow-sm border text-gray-600">
                            Score: {gradingResult.pages[index]?.page_score || 0}
                          </Badge>
                        </CardHeader>
                        <CardContent className="p-0 relative bg-gray-100">
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
                              className="w-full h-auto object-contain"
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
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                <div className="flex justify-center pt-8">
                  <Button
                    onClick={handleReset}
                    size="lg"
                    className="gap-2 bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:text-indigo-600 shadow-sm"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Grade Another Exam
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="export" className="mt-8">
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle>Export Options</CardTitle>
                    <CardDescription>Download the graded exam as an image to share with students or parents.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ExportCanvas images={images} gradingResult={gradingResult} />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </main>

      {/* Global CSS for Animations */}
      <style jsx global>{`
        @keyframes progress {
          0% { transform: scaleX(0); }
          50% { transform: scaleX(0.7); }
          100% { transform: scaleX(1); }
        }
        .animate-progress {
          animation: progress 20s ease-out forwards;
        }
      `}</style>
    </div>
  );
}