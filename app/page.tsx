'use client';

import { useState, useEffect } from 'react';
import { SmartUploader } from '@/components/shared/smart-uploader';
import imageCompression from 'browser-image-compression';
import { GradingOverlay } from '@/components/grading/grading-overlay';
import { ExportCanvas } from '@/components/grading/export-canvas';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { CheckCircle2, XCircle, RefreshCw, X, Settings2, Sparkles, BrainCircuit, GraduationCap, ScanText, FileText, BookOpen, Copy, UploadCloud, PenTool, Lightbulb, Download, Table, Moon, Sun, Eye } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ExamGradingResult, geminiService } from '@/lib/services/gemini';
import { cn } from '@/lib/utils';
import { EssayGenerator } from '@/components/essay/essay-generator';
import { EssayResult } from '@/components/essay/essay-result';
import { EssayGuideResult } from '@/components/essay/essay-guide-result';

export default function Home() {
  const [activeTab, setActiveTab] = useState('grading'); // Default to Grading

  // -- Shared State --
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [provider, setProvider] = useState<'google' | 'qwen'>('qwen');
  const [error, setError] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState<'light' | 'eye-care' | 'dark'>('light');

  // -- Grading State --
  const [gradingImages, setGradingImages] = useState<string[]>([]);
  const [gradingResult, setGradingResult] = useState<ExamGradingResult | null>(null);
  const [imageDimensions, setImageDimensions] = useState<Map<number, { width: number; height: number }>>(new Map());
  const [currentPage, setCurrentPage] = useState(0);

  // -- OCR State --
  const [ocrImages, setOcrImages] = useState<string[]>([]);
  const [ocrResults, setOcrResults] = useState<string[]>([]);
  const [ocrTableResults, setOcrTableResults] = useState<string[]>([]);
  const [ocrCurrentPage, setOcrCurrentPage] = useState(0);
  const [ocrMode, setOcrMode] = useState<'text' | 'table'>('text');

  // -- Homework State --
  const [hwImage, setHwImage] = useState<string | null>(null);
  const [hwFile, setHwFile] = useState<File | null>(null);
  const [hwQuestion, setHwQuestion] = useState('');
  const [hwResult, setHwResult] = useState<string | null>(null);

  // -- Essay State --
  const [essayTopic, setEssayTopic] = useState('');
  const [essayGrade, setEssayGrade] = useState('6');
  const [essayType, setEssayType] = useState('narrative');
  const [essayWordCount, setEssayWordCount] = useState('');
  const [essayResult, setEssayResult] = useState<string | null>(null);

  // -- Essay Guide State --
  const [guideTopic, setGuideTopic] = useState('');
  const [guideGrade, setGuideGrade] = useState('6');
  const [guideType, setGuideType] = useState('narrative');
  const [guideResult, setGuideResult] = useState<string | null>(null);

  // -- Essay Mode State --
  const [essayMode, setEssayMode] = useState<'generate' | 'guide'>('generate');

  // -- Init --
  useEffect(() => {
    // 强制使用 qwen
    setProvider('qwen');
    const storedKey = localStorage.getItem('qwen_api_key');
    if (storedKey) {
      setApiKey(storedKey);
      geminiService.setApiKey(storedKey, 'qwen');
    } else {
      setShowApiKeyModal(true);
    }
  }, []);

  const handleSaveApiKey = () => {
    if (!apiKey.trim()) {
      setError('API Key 不能为空');
      return;
    }

    // Always save as qwen key
    localStorage.setItem('qwen_api_key', apiKey);
    localStorage.setItem('ai_provider', 'qwen');

    geminiService.setApiKey(apiKey, 'qwen');
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

    if (files.length > 20) {
      setError('最多上传 20 张图片');
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
      } else if (message.includes('Failed to fetch')) {
        setError('网络连接失败。请检查网络或 API Key 设置。');
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
    setCurrentPage(0);
  };

  // 2. OCR Handler
  const handleOcrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!checkApiKey()) return;
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Reset state for new batch
    setOcrImages(files.map(f => URL.createObjectURL(f)));

    if (ocrMode === 'text') {
      setOcrResults(new Array(files.length).fill(''));
    } else {
      setOcrTableResults(new Array(files.length).fill(''));
    }

    setOcrCurrentPage(0);

    setLoading(true);
    setError(null);

    try {
      // Process all images
      const results = await Promise.all(
        files.map(async (file) => {
          try {
            if (ocrMode === 'text') {
              return await geminiService.recognizeText(file);
            } else {
              return await geminiService.recognizeTable(file);
            }
          } catch (err: any) {
            console.error('OCR Error:', err);
            let msg = err instanceof Error ? err.message : String(err);
            if (msg.includes('Failed to fetch')) {
              msg = '网络失败 (请检查网络)';
            }
            return `[识别失败] ${msg}`;
          }
        })
      );

      if (ocrMode === 'text') {
        setOcrResults(results);
      } else {
        setOcrTableResults(results);
      }

    } catch (err: any) {
      const message = err instanceof Error ? err.message : 'An error occurred during OCR';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const downloadTableAsCsv = (markdownTable: string, index: number) => {
    try {
      // Simple Markdown to CSV converter
      const lines = markdownTable.split('\n').filter(line => line.trim().startsWith('|'));
      const csvContent = lines.map(line => {
        // Remove leading/trailing pipes and split
        const cells = line.trim().replace(/^\||\|$/g, '').split('|');
        // Clean whitespace and quote if necessary
        return cells.map(cell => {
          let c = cell.trim();
          if (c.includes(',') || c.includes('"')) {
            c = `"${c.replace(/"/g, '""')}"`;
          }
          return c;
        }).join(',');
      }).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `table_export_${index + 1}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      setError('导出失败，请尝试复制内容手动粘贴');
    }
  };

  const downloadTextAsTxt = (text: string, index: number) => {
    try {
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ocr_result_${index + 1}.txt`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      setError('导出失败，请尝试复制内容手动粘贴');
    }
  };

  // 3. Homework Handler
  const handleHwUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const options = {
        maxSizeMB: 2,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        initialQuality: 0.85,
      };
      const compressedFile = await imageCompression(file, options);
      setHwFile(compressedFile);
      setHwImage(URL.createObjectURL(compressedFile));
    } catch (error) {
      console.error('Homework compression failed:', error);
      setHwFile(file);
      setHwImage(URL.createObjectURL(file));
    }
  };

  const submitHomework = async () => {
    if (!checkApiKey()) return;
    if (!hwFile) {
      setError('请先上传题目图片');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const solution = await geminiService.solveHomework(hwFile, hwQuestion);
      setHwResult(solution);
    } catch (err: any) {
      const message = err instanceof Error ? err.message : 'An error occurred during homework solving';
      if (message.includes('Failed to fetch')) {
        setError('网络连接失败。请检查网络或 Key。');
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  // 4. Essay Handler
  const handleEssayGenerate = async (params: {
    topic: string;
    image?: File;
    grade: string;
    essayType: string;
    wordCount?: string;
  }) => {
    if (!checkApiKey()) return;

    setLoading(true);
    setError(null);
    try {
      // Store parameters for display
      setEssayTopic(params.topic || '图片主题');
      setEssayGrade(params.grade);
      setEssayType(params.essayType);
      setEssayWordCount(params.wordCount || '');

      const essay = await geminiService.generateEssay(params);
      setEssayResult(essay);
    } catch (err: any) {
      const message = err instanceof Error ? err.message : 'An error occurred during essay generation';
      if (message.includes('Failed to fetch')) {
        setError('网络连接失败。请检查网络或 Key。');
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const resetEssay = () => {
    setEssayResult(null);
  };

  // 5. Essay Guide Handler
  const handleEssayGuideGenerate = async (params: {
    topic: string;
    image?: File;
    grade: string;
    essayType: string;
    wordCount?: string;
  }) => {
    if (!checkApiKey()) return;

    setLoading(true);
    setError(null);
    try {
      setGuideTopic(params.topic || '图片内容');
      setGuideGrade(params.grade);
      setGuideType(params.essayType);

      const guide = await geminiService.generateEssayGuide(params);
      setGuideResult(guide);
    } catch (err: any) {
      const message = err instanceof Error ? err.message : 'An error occurred during guide generation';
      if (message.includes('Failed to fetch')) {
        setError('网络连接失败。请检查网络或 Key。');
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const resetGuide = () => {
    setGuideResult(null);
  };



  const toggleTheme = () => {
    setTheme(prev => {
      if (prev === 'light') return 'eye-care';
      if (prev === 'eye-care') return 'dark';
      return 'light';
    });
  };

  // -- Render Helpers --

  return (
    <div className="min-h-screen font-sans selection:bg-indigo-100 transition-colors duration-300"
      style={{ backgroundColor: 'var(--main-bg)', color: 'var(--text-main)' }}
      data-theme={theme}
    >

      {/* Configure Dialog */}
      <Dialog open={showApiKeyModal} onOpenChange={setShowApiKeyModal}>
        <DialogContent className="sm:max-w-md bg-white border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-indigo-600">
              <Settings2 className="w-5 h-5" />
              设置 AI 模型 API Key
            </DialogTitle>
            <DialogDescription>
              请选择模型提供商并输入对应的 API Key。
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="flex gap-2 bg-indigo-50 p-3 rounded-lg border border-indigo-100">
              <BrainCircuit className="w-5 h-5 text-indigo-600 flex-shrink-0" />
              <div className="text-sm text-indigo-900">
                当前仅支持 <strong>阿里通义千问 (Qwen)</strong> 模型，提供更稳定的国内访问体验。
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                DashScope API Key (sk-...)
              </label>
              <Input
                type="password"
                placeholder="sk-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="bg-gray-100 border-transparent focus:bg-white focus:border-indigo-500 transition-all font-mono"
              />
              <p className="text-xs text-gray-400">
                <a href="https://bailian.console.aliyun.com/" target="_blank" className="hover:text-indigo-600 hover:underline">获取阿里云 DashScope Key &rarr;</a>
              </p>
            </div>
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
              { id: 'essay', label: '语文作文', icon: PenTool },
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

          <div className="w-px h-6 bg-gray-200 mx-1"></div>

          <Button variant="ghost" size="icon" onClick={toggleTheme} title="切换主题">
            {theme === 'light' && <Eye className="w-5 h-5 text-gray-500" />}
            {theme === 'eye-care' && <Sun className="w-5 h-5 text-amber-600" />}
            {theme === 'dark' && <Moon className="w-5 h-5 text-indigo-400" />}
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
              <div className="text-sm font-semibold text-gray-600 flex items-center justify-between">
                <span className="flex items-center gap-2"><UploadCloud className="w-4 h-4" /> 原图预览</span>

                {/* Mode Switcher */}
                <div className="bg-gray-100 p-0.5 rounded-lg flex items-center">
                  <button
                    onClick={() => { setOcrMode('text'); setOcrImages([]); setOcrResults([]); setOcrTableResults([]); }}
                    className={cn(
                      "px-3 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1",
                      ocrMode === 'text' ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-900"
                    )}
                  >
                    <FileText className="w-3 h-3" />
                    普通文本
                  </button>
                  <button
                    onClick={() => { setOcrMode('table'); setOcrImages([]); setOcrResults([]); setOcrTableResults([]); }}
                    className={cn(
                      "px-3 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1",
                      ocrMode === 'table' ? "bg-white text-emerald-600 shadow-sm" : "text-gray-500 hover:text-gray-900"
                    )}
                  >
                    <Table className="w-3 h-3" />
                    图片表格
                  </button>
                </div>

                {ocrImages.length > 1 && (
                  <div className="flex items-center gap-2 text-xs">
                    <Button variant="ghost" size="sm" onClick={() => setOcrCurrentPage(p => Math.max(0, p - 1))} disabled={ocrCurrentPage === 0}>上一页</Button>
                    <span>{ocrCurrentPage + 1}/{ocrImages.length}</span>
                    <Button variant="ghost" size="sm" onClick={() => setOcrCurrentPage(p => Math.min(ocrImages.length - 1, p + 1))} disabled={ocrCurrentPage === ocrImages.length - 1}>下一页</Button>
                  </div>
                )}
              </div>
              <div className="flex-1 border-2 border-dashed border-gray-200 rounded-xl bg-white hover:bg-gray-50 transition-colors relative flex items-center justify-center overflow-hidden">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleOcrUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                {ocrImages.length > 0 ? (
                  <img src={ocrImages[ocrCurrentPage]} className="w-full h-full object-contain p-4" />
                ) : (
                  <div className="text-center text-gray-400">
                    {ocrMode === 'text' ? <ScanText className="w-16 h-16 mx-auto mb-3 opacity-30" /> : <Table className="w-16 h-16 mx-auto mb-3 opacity-30" />}
                    <p className="font-medium">点击上传{ocrMode === 'text' ? '文本' : '表格'}图片 (支持批量)</p>
                    <p className="text-xs mt-1">支持 JPG, PNG, WEBP</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Text Result */}
            <div className="flex flex-col gap-4 h-full">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-gray-600 flex items-center gap-2">
                  {ocrMode === 'text' ? <FileText className="w-4 h-4" /> : <Table className="w-4 h-4" />}
                  {ocrMode === 'text' ? '识别结果' : '表格还原'}
                </div>
                <div className="flex gap-2">
                  {(ocrMode === 'text' ? ocrResults[ocrCurrentPage] : ocrTableResults[ocrCurrentPage]) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                      onClick={() => navigator.clipboard.writeText(ocrMode === 'text' ? ocrResults[ocrCurrentPage] : ocrTableResults[ocrCurrentPage])}
                    >
                      <Copy className="w-3 h-3" /> 复制
                    </Button>
                  )}
                  {ocrMode === 'text' && ocrResults[ocrCurrentPage] && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                      onClick={() => downloadTextAsTxt(ocrResults[ocrCurrentPage], ocrCurrentPage)}
                    >
                      <Download className="w-3 h-3" /> 导出TXT
                    </Button>
                  )}
                  {ocrMode === 'table' && ocrTableResults[ocrCurrentPage] && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                      onClick={() => downloadTableAsCsv(ocrTableResults[ocrCurrentPage], ocrCurrentPage)}
                    >
                      <Download className="w-3 h-3" /> 导出CSV
                    </Button>
                  )}
                </div>
              </div>
              <div className="flex-1 border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden relative font-mono text-sm">
                {loading ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-20">
                    <div className="flex flex-col items-center gap-2 text-indigo-600">
                      <RefreshCw className="w-8 h-8 animate-spin" />
                      <span className="text-sm font-medium">AI 正在识别 {ocrImages.length} 页{ocrMode === 'text' ? '文字' : '表格'}...</span>
                    </div>
                  </div>
                ) : null}

                {ocrMode === 'text' ? (
                  <textarea
                    className="w-full h-full p-6 resize-none focus:outline-none text-gray-700 leading-relaxed custom-scrollbar block"
                    placeholder="识别到的文字将显示在这里..."
                    value={ocrResults[ocrCurrentPage] || ''}
                    onChange={(e) => {
                      const newResults = [...ocrResults];
                      newResults[ocrCurrentPage] = e.target.value;
                      setOcrResults(newResults);
                    }}
                  />
                ) : (
                  <div className="w-full h-full p-6 overflow-auto custom-scrollbar prose prose-sm max-w-none">
                    {ocrTableResults[ocrCurrentPage] ? (
                      <ReactMarkdown>{ocrTableResults[ocrCurrentPage]}</ReactMarkdown>
                    ) : (
                      <div className="text-gray-400 italic">识别到的表格将显示在这里...</div>
                    )}
                  </div>
                )}

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
                      <SmartUploader onUpload={handleGradingUpload} isLoading={loading} />
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
                    批改结果
                  </span>
                  {gradingResult && (
                    <div className="flex gap-2">
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                        得分: {gradingResult.pages[currentPage]?.page_score || 0}
                      </Badge>
                    </div>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  {!gradingResult ? (
                    <div className="h-full flex items-center justify-center text-center text-gray-400 p-4">
                      <div>
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Sparkles className="w-10 h-10 opacity-30" />
                        </div>
                        <p>等待开始批改...</p>
                        <p className="text-sm mt-2 opacity-60">请在左侧上传试卷并点击"开始批改"</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4 p-4">
                      {/* Graded Image with Overlay */}
                      <div className="relative w-full flex items-center justify-center bg-gray-50/50 rounded-lg p-4">
                        {gradingImages[currentPage] && (
                          <div className="relative max-w-full">
                            <img
                              src={gradingImages[currentPage]}
                              className="max-w-full object-contain shadow-sm border border-gray-100 rounded-lg opacity-0"
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

                      {/* Error Analysis Section */}
                      {(() => {
                        const wrongQuestions = gradingResult.pages[currentPage]?.questions.filter(
                          q => q.status === 'wrong' || q.status === 'partial'
                        ) || [];

                        if (wrongQuestions.length === 0) {
                          return (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
                              <p className="text-green-800 font-semibold text-lg">全部正确！</p>
                              <p className="text-green-600 text-sm mt-1">本页所有题目都答对了 🎉</p>
                            </div>
                          );
                        }

                        return (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between px-1">
                              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                <XCircle className="w-5 h-5 text-red-500" />
                                错题分析
                              </h3>
                              <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-100">
                                {wrongQuestions.length} 道错题
                              </Badge>
                            </div>

                            {wrongQuestions.map((question) => (
                              <Card key={question.id} className="border-l-4 border-l-red-400 shadow-sm hover:shadow-md transition-shadow">
                                <CardHeader className="pb-3">
                                  <div className="flex items-start justify-between gap-3">
                                    <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                                      <span className="flex items-center justify-center w-7 h-7 rounded-full bg-red-100 text-red-700 text-sm font-bold">
                                        {question.id}
                                      </span>
                                      第 {question.id} 题
                                    </CardTitle>
                                    <div className="flex flex-col items-end gap-1">
                                      <Badge
                                        variant={question.status === 'wrong' ? 'destructive' : 'secondary'}
                                        className={question.status === 'wrong' ? 'bg-red-500' : 'bg-orange-500'}
                                      >
                                        {question.status === 'wrong' ? '错误' : '部分正确'}
                                      </Badge>
                                      <span className="text-sm font-semibold text-red-600">
                                        -{question.deduction} 分
                                      </span>
                                    </div>
                                  </div>
                                </CardHeader>
                                <CardContent className="pt-0">
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm">
                                      <span className="text-gray-500">得分:</span>
                                      <span className="font-semibold text-gray-900">
                                        {question.score_obtained} / {question.score_max}
                                      </span>
                                      {question.error_type && (
                                        <>
                                          <span className="text-gray-300">•</span>
                                          <Badge variant="outline" className="text-xs">
                                            {question.error_type === 'calculation' && '计算错误'}
                                            {question.error_type === 'concept' && '概念错误'}
                                            {question.error_type === 'logic' && '逻辑错误'}
                                          </Badge>
                                        </>
                                      )}
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                                      <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                        <GraduationCap className="w-4 h-4 text-indigo-600" />
                                        详细解析：
                                      </p>
                                      <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                                        {question.analysis}
                                      </p>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        );
                      })()}
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

        {/* --- Tab: Essay --- */}
        {activeTab === 'essay' && (
          <div className="animate-in fade-in h-[calc(100vh-140px)] flex flex-col">

            {/* Mode Switcher - Float it or place at top */}
            {!essayResult && !guideResult && (
              <div className="flex justify-center mt-4 mb-2">
                <div className="bg-white p-1 rounded-lg border border-gray-200 shadow-sm flex items-center gap-1">
                  <button
                    onClick={() => setEssayMode('generate')}
                    className={cn(
                      "px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2",
                      essayMode === 'generate' ? "bg-indigo-50 text-indigo-600 shadow-sm ring-1 ring-indigo-200" : "text-gray-500 hover:bg-gray-50"
                    )}
                  >
                    <Sparkles className="w-4 h-4" />
                    作文生成
                  </button>
                  <button
                    onClick={() => setEssayMode('guide')}
                    className={cn(
                      "px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2",
                      essayMode === 'guide' ? "bg-amber-50 text-amber-600 shadow-sm ring-1 ring-amber-200" : "text-gray-500 hover:bg-gray-50"
                    )}
                  >
                    <Lightbulb className="w-4 h-4" />
                    写作引导
                  </button>
                </div>
              </div>
            )}

            {(essayMode === 'generate' ? !essayResult : !guideResult) ? (
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="max-w-4xl mx-auto py-6">
                  <div className="mb-6 text-center">
                    {essayMode === 'generate' ? (
                      <>
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full mb-3">
                          <PenTool className="w-5 h-5 text-indigo-600" />
                          <span className="font-bold text-indigo-900">AI 作文助手</span>
                        </div>
                        <p className="text-gray-600">输入主题或上传图片，AI 将根据年级和作文类型为你生成优质作文</p>
                      </>
                    ) : (
                      <>
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-100 to-orange-100 rounded-full mb-3">
                          <Lightbulb className="w-5 h-5 text-amber-600" />
                          <span className="font-bold text-amber-900">作文灵感导师</span>
                        </div>
                        <p className="text-gray-600">写不出来？不知道怎么写？AI 老师帮你打开思路，提供大纲和素材！</p>
                      </>
                    )}

                  </div>
                  <EssayGenerator
                    onGenerate={essayMode === 'generate' ? handleEssayGenerate : handleEssayGuideGenerate}
                    isLoading={loading}
                    buttonText={essayMode === 'generate' ? '开始生成作文' : '获取写作思路'}
                  />
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="max-w-5xl mx-auto py-6">
                  <div className="mb-4">
                    <Button
                      onClick={essayMode === 'generate' ? resetEssay : resetGuide}
                      variant="outline"
                      className="gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      {essayMode === 'generate' ? '重新创作' : '重新获取引导'}
                    </Button>
                  </div>

                  {essayMode === 'generate' ? (
                    <EssayResult
                      essay={essayResult!}
                      topic={essayTopic}
                      grade={essayGrade}
                      essayType={essayType}
                      onRegenerate={() => handleEssayGenerate({ topic: essayTopic, grade: essayGrade, essayType, wordCount: essayWordCount })}
                      isRegenerating={loading}
                    />
                  ) : (
                    <EssayGuideResult
                      guide={guideResult!}
                      topic={guideTopic}
                      grade={guideGrade}
                      essayType={guideType}
                      onRegenerate={() => handleEssayGuideGenerate({ topic: guideTopic, grade: guideGrade, essayType: guideType })}
                      isRegenerating={loading}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- Removed Tab: Essay Guide (Merged into Essay) --- */}

      </main>


    </div>
  );
}