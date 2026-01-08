'use client';

import { useState, useEffect } from 'react';
import { SmartUploader } from '@/components/shared/smart-uploader';
import { GradingOverlay } from '@/components/grading/grading-overlay';
import { ExportCanvas } from '@/components/grading/export-canvas';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { CheckCircle2, XCircle, RefreshCw, X, Settings2, Sparkles, BrainCircuit, GraduationCap, ScanText, FileText, BookOpen, Copy, UploadCloud } from 'lucide-react';
import { ExamGradingResult, geminiService } from '@/lib/services/gemini';
import { cn } from '@/lib/utils';

export default function Home() {
  const [activeTab, setActiveTab] = useState('grading'); // Default to Grading

  // -- Shared State --
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // -- Grading State --
  const [gradingImages, setGradingImages] = useState<string[]>([]);
  const [gradingResult, setGradingResult] = useState<ExamGradingResult | null>(null);
  const [imageDimensions, setImageDimensions] = useState<Map<number, { width: number; height: number }>>(new Map());
  const [currentPage, setCurrentPage] = useState(0);

  // -- OCR State --
  const [ocrImage, setOcrImage] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<string | null>(null);

  // -- Homework State --
  const [hwImage, setHwImage] = useState<string | null>(null);
  const [hwQuestion, setHwQuestion] = useState('');
  const [hwResult, setHwResult] = useState<string | null>(null);

  // -- Init --
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
    if (!apiKey.trim()) {
      setError('API Key 不能为空');
      return;
    }
    localStorage.setItem('gemini_api_key', apiKey);
    geminiService.setApiKey(apiKey);
    setShowApiKeyModal(false);
  };

  const checkApiKey = () => {
    if (!apiKey) {
      setShowApiKeyModal(true);
      return false;
    }
    return true;
  };

  // -- Handlers --

  // 1. Grading Handler
  const handleGradingUpload = async (files: File[], totalMaxScore: number) => {
    if (!checkApiKey()) return;

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

    setLoading(true);
    setError(null);
    try {
      const result = await geminiService.generateExamGrading(files, totalMaxScore);
      setGradingImages(files.map(f => URL.createObjectURL(f)));
      setImageDimensions(new Map());
      setGradingResult(result);
    } catch (err: any) {
      const message = err instanceof Error ? err.message : 'An error occurred during grading';
      if (message.includes('API Key')) {
        setError('无效或缺失的 API Key。请检查您的设置。');
        setShowApiKeyModal(true);
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const resetGrading = () => {
    setGradingImages([]);
    setGradingResult(null);
    setImageDimensions(new Map());
  };

  // 2. OCR Handler
  const handleOcrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!checkApiKey()) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setOcrImage(URL.createObjectURL(file));
    setOcrResult(null);
    setLoading(true);
    setError(null);

    try {
      const text = await geminiService.recognizeText(file);
      setOcrResult(text);
    } catch (err: any) {
      const message = err instanceof Error ? err.message : 'An error occurred during OCR';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // 3. Homework Handler
  const handleHwUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setHwImage(URL.createObjectURL(file));
  };

  const submitHomework = async () => {
    if (!checkApiKey()) return;
    if (!hwImage) {
      setError('请先上传题目图片');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Need the file object again, fetching from blob url is one way or just storing file in state
      // For simplicity/robustness, let's fetch the blob
      const response = await fetch(hwImage);
      const blob = await response.blob();
      const file = new File([blob], "homework.jpg", { type: blob.type });

      const solution = await geminiService.solveHomework(file, hwQuestion);
      setHwResult(solution);
    } catch (err: any) {
      const message = err instanceof Error ? err.message : 'An error occurred during homework solving';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // -- Render Helpers --

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-indigo-100">

      {/* Configure Dialog */}
      <Dialog open={showApiKeyModal} onOpenChange={setShowApiKeyModal}>
        <DialogContent className="sm:max-w-md bg-white border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-indigo-600">
              <Settings2 className="w-5 h-5" />
              设置 API Key
            </DialogTitle>
            <DialogDescription>
              请输入您的 Google Gemini API Key 以使用 AI 功能。
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              type="password"
              placeholder="sk-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="bg-gray-100 border-transparent focus:bg-white focus:border-indigo-500 transition-all font-mono"
            />
          </div>
          <DialogFooter>
            <Button onClick={handleSaveApiKey} className="w-full bg-indigo-600 hover:bg-indigo-700">保存并继续</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight text-gray-900">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
              <BrainCircuit size={18} />
            </div>
            SmartGrader
          </div>

          <div className="flex bg-gray-100 p-1 rounded-lg">
            {[
              { id: 'ocr', label: '文字识别', icon: ScanText },
              { id: 'grading', label: '试卷批改', icon: FileText },
              { id: 'homework', label: '作业辅导', icon: BookOpen },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setError(null); }}
                className={cn(
                  "flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                  activeTab === tab.id
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-gray-500 hover:text-gray-900"
                )}
              >
                <tab.icon size={16} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          <Button variant="ghost" size="icon" onClick={() => setShowApiKeyModal(true)}>
            <Settings2 className="w-5 h-5 text-gray-500" />
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Error Toast */}
        {error && (
          <div className="mb-6 mx-auto max-w-md bg-red-50 text-red-600 px-4 py-3 rounded-xl flex items-center justify-between border border-red-100 shadow-sm animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <XCircle size={18} />
              <span className="text-sm font-medium">{error}</span>
            </div>
            <button onClick={() => setError(null)}><X size={16} /></button>
          </div>
        )}

        {/* --- Tab: OCR --- */}
        {activeTab === 'ocr' && (
          <div className="animate-in fade-in grid grid-cols-1 md:grid-cols-2 gap-6 h-[calc(100vh-140px)] min-h-[500px]">
            {/* Left: Image Source */}
            <div className="flex flex-col gap-4 h-full">
              <div className="text-sm font-semibold text-gray-600 flex items-center gap-2">
                <UploadCloud className="w-4 h-4" /> 原图预览
              </div>
              <div className="flex-1 border-2 border-dashed border-gray-200 rounded-xl bg-white hover:bg-gray-50 transition-colors relative flex items-center justify-center overflow-hidden">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleOcrUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                {ocrImage ? (
                  <img src={ocrImage} className="w-full h-full object-contain p-4" />
                ) : (
                  <div className="text-center text-gray-400">
                    <ScanText className="w-16 h-16 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">点击上传图片</p>
                    <p className="text-xs mt-1">支持 JPG, PNG, WEBP</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Text Result */}
            <div className="flex flex-col gap-4 h-full">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-gray-600 flex items-center gap-2">
                  <FileText className="w-4 h-4" /> 识别结果
                </div>
                {ocrResult && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                    onClick={() => navigator.clipboard.writeText(ocrResult)}
                  >
                    <Copy className="w-3 h-3" /> 复制
                  </Button>
                )}
              </div>
              <div className="flex-1 border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden relative">
                {loading ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-20">
                    <div className="flex flex-col items-center gap-2 text-indigo-600">
                      <RefreshCw className="w-8 h-8 animate-spin" />
                      <span className="text-sm font-medium">AI 正在识别文字...</span>
                    </div>
                  </div>
                ) : null}
                <textarea
                  className="w-full h-full p-6 resize-none focus:outline-none text-gray-700 leading-relaxed custom-scrollbar"
                  placeholder="识别到的文字将显示在这里..."
                  value={ocrResult || ''}
                  onChange={(e) => setOcrResult(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* --- Tab: Grading --- */}
        {activeTab === 'grading' && (
          <div className="animate-in fade-in h-[calc(100vh-140px)] flex flex-col">

            {/* Main Content Area - Split View */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 min-h-0">

              {/* Left Panel: Original / Upload */}
              <div className="flex flex-col bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                  <span className="font-semibold text-gray-700 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-500" />
                    原始文件
                  </span>
                  {gradingResult && (
                    <Badge variant="outline" className="bg-white text-gray-500">
                      {gradingImages.length > 0 ? `Page ${currentPage + 1}/${gradingImages.length}` : ''}
                    </Badge>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto p-4 flex items-center justify-center bg-gray-50/50 relative">
                  {!gradingResult ? (
                    <div className="w-full h-full flex flex-col">
                      {/* Using SmartUploader for input */}
                      <SmartUploader onUpload={handleGradingUpload} />
                    </div>
                  ) : (
                    <div className="relative w-full h-full flex items-center justify-center">
                      {/* Show Original Image for Current Page */}
                      {gradingImages[currentPage] && (
                        <img
                          src={gradingImages[currentPage]}
                          className="max-w-full max-h-full object-contain shadow-sm border border-gray-100 rounded-lg"
                          alt="Original"
                        />
                      )}
                    </div>
                  )}

                  {/* Loading Overlay */}
                  {loading && (
                    <div className="absolute inset-0 z-10 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center">
                      <RefreshCw className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
                      <h3 className="text-xl font-bold text-gray-800">正在智能阅卷...</h3>
                      <p className="text-gray-500 mt-2">AI 正在深度分析 {gradingImages.length} 页试卷</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Panel: Graded Result */}
              <div className="flex flex-col bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                  <span className="font-semibold text-gray-700 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    批改后图片
                  </span>
                  {gradingResult && (
                    <div className="flex gap-2">
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                        得分: {gradingResult.pages[currentPage]?.page_score || 0}
                      </Badge>
                    </div>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto p-4 flex items-center justify-center bg-gray-50/50 relative">
                  {!gradingResult ? (
                    <div className="text-center text-gray-400">
                      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Sparkles className="w-10 h-10 opacity-30" />
                      </div>
                      <p>等待开始批改...</p>
                      <p className="text-sm mt-2 opacity-60">请在左侧上传试卷并点击"开始批改"</p>
                    </div>
                  ) : (
                    <div className="relative w-full h-full flex items-center justify-center">
                      {/* Show Graded Overlay Image for Current Page */}
                      {gradingImages[currentPage] && (
                        <div className="relative max-w-full max-h-full">
                          <img
                            src={gradingImages[currentPage]}
                            className="max-w-full max-h-full object-contain shadow-sm border border-gray-100 rounded-lg opacity-0"
                            onLoad={(e) => e.currentTarget.classList.remove('opacity-0')}
                            ref={el => {
                              if (el?.naturalWidth) {
                                setImageDimensions(prev => new Map(prev).set(currentPage, { width: el.naturalWidth, height: el.naturalHeight }));
                              }
                            }}
                          />
                          {/* The Overlay */}
                          <div className="absolute inset-0 pointer-events-none">
                            <GradingOverlay
                              imageUrl={gradingImages[currentPage]}
                              questions={gradingResult.pages[currentPage]?.questions || []}
                              imageWidth={imageDimensions.get(currentPage)?.width || 600}
                              imageHeight={imageDimensions.get(currentPage)?.height || 800}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Footer Actions (Only visible when results available) */}
            {gradingResult && (
              <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm animate-in slide-in-from-bottom-4">

                {/* Summary Info */}
                <div className="flex items-center gap-6">
                  <div className="text-center md:text-left">
                    <div className="text-xs text-gray-500 uppercase font-bold tracking-wider">总分</div>
                    <div className="text-3xl font-bold text-indigo-900">
                      {gradingResult.total_score} <span className="text-lg text-gray-400 font-normal">/ {gradingResult.total_max_score}</span>
                    </div>
                  </div>
                  <div className="h-8 w-px bg-gray-200 hidden md:block"></div>
                  <div className="flex gap-3">
                    <div className="px-3 py-1 bg-green-50 text-green-700 rounded-lg text-sm font-medium">
                      正确 {gradingResult.pages.reduce((acc, p) => acc + p.questions.filter(q => q.status === 'correct').length, 0)}
                    </div>
                    <div className="px-3 py-1 bg-red-50 text-red-700 rounded-lg text-sm font-medium">
                      错误 {gradingResult.pages.reduce((acc, p) => acc + p.questions.filter(q => q.status === 'wrong').length, 0)}
                    </div>
                  </div>
                </div>

                {/* Pagination & Tools */}
                <div className="flex items-center gap-3">
                  <Button
                    variant="secondary"
                    disabled={currentPage === 0}
                    onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                  >
                    上一页
                  </Button>
                  <span className="text-sm font-medium text-gray-600 min-w-[3rem] text-center">
                    {currentPage + 1} / {gradingImages.length}
                  </span>
                  <Button
                    variant="secondary"
                    disabled={currentPage === gradingImages.length - 1}
                    onClick={() => setCurrentPage(p => Math.min(gradingImages.length - 1, p + 1))}
                  >
                    下一页
                  </Button>

                  <div className="w-px h-8 bg-gray-200 mx-2"></div>

                  <Button onClick={resetGrading} variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-100">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    重新批改
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- Tab: Homework --- */}
        {activeTab === 'homework' && (
          <div className="animate-in fade-in grid grid-cols-1 md:grid-cols-2 gap-6 h-[calc(100vh-140px)] min-h-[600px]">
            {/* Left: Question Input */}
            <div className="flex flex-col gap-4 h-full">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-600 flex items-center gap-2"><BookOpen className="w-4 h-4" /> 题目上传</span>
              </div>
              <div className="flex-1 flex flex-col gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex-1 border-2 border-dashed border-gray-100 rounded-lg bg-gray-50 relative flex items-center justify-center overflow-hidden hover:bg-gray-100 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleHwUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  {hwImage ? (
                    <img src={hwImage} className="w-full h-full object-contain p-2" />
                  ) : (
                    <div className="text-center text-gray-400">
                      <UploadCloud className="w-10 h-10 mx-auto mb-2 opacity-40" />
                      <span className="text-sm">点击上传题目图片</span>
                    </div>
                  )}
                </div>
                <div className="h-1/3 flex flex-col gap-2">
                  <label className="text-xs font-semibold text-gray-500">补充说明 (可选)</label>
                  <Textarea
                    placeholder="例如：请解释这个公式的推导过程..."
                    value={hwQuestion}
                    onChange={e => setHwQuestion(e.target.value)}
                    className="flex-1 resize-none bg-gray-50 border-gray-100"
                  />
                  <Button
                    className="w-full bg-indigo-600 hover:bg-indigo-700 mt-2"
                    onClick={submitHomework}
                    disabled={loading || !hwImage}
                  >
                    {loading ? <RefreshCw className="animate-spin w-4 h-4 mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                    开始辅导
                  </Button>
                </div>
              </div>
            </div>

            {/* Right: AI Solution */}
            <div className="flex flex-col gap-4 h-full">
              <div className="text-sm font-semibold text-gray-600 flex items-center gap-2">
                <BrainCircuit className="w-4 h-4" /> AI 解析
              </div>
              <div className="flex-1 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden relative p-6">
                {loading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 z-20">
                    <RefreshCw className="w-10 h-10 text-indigo-600 animate-spin mb-3" />
                    <p className="text-gray-500 font-medium">AI 老师正在解题...</p>
                  </div>
                )}
                {!hwResult && !loading && (
                  <div className="h-full flex items-center justify-center text-gray-300">
                    <div className="text-center">
                      <Sparkles className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>等待提交问题</p>
                    </div>
                  </div>
                )}
                {hwResult && (
                  <div className="prose prose-sm prose-indigo max-w-none overflow-y-auto h-full pr-2 custom-scrollbar">
                    <pre className="whitespace-pre-wrap font-sans text-gray-800">{hwResult}</pre>
                    {/* Note: In a real app, use a Markdown renderer like react-markdown here */}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </main>


    </div>
  );
}