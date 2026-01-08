'use client';

import { useRef, useState, useCallback } from 'react';
import html2canvas from 'html2canvas';
import { ExamGradingResult } from '@/lib/services/gemini';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Share2, Check, X, AlertCircle, TrendingUp, AlertTriangle } from 'lucide-react';

interface ExportCanvasProps {
  images: string[];
  gradingResult: ExamGradingResult;
}

export function ExportCanvas({ images, gradingResult }: ExportCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wrongQuestions = gradingResult.pages.flatMap((page, pageIndex) =>
    page.questions
      .filter((q) => q.status !== 'correct')
      .map((q) => ({ ...q, pageIndex }))
  );

  const scorePercentage = Math.round((gradingResult.total_score / gradingResult.total_max_score) * 100);

  const exportImage = useCallback(async () => {
    if (!canvasRef.current) return;
    
    setIsExporting(true);
    setError(null);
    
    try {
      const canvas = await html2canvas(canvasRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      canvas.toBlob(async (blob) => {
        if (!blob) return;
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `exam-result-${gradingResult.total_score}.png`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
        setIsExporting(false);
      }, 'image/png');
    } catch (err) {
      console.error('Error exporting image:', err);
      setError('导出失败，请重试');
      setIsExporting(false);
    }
  }, [gradingResult.total_score]);

  const shareImage = useCallback(async () => {
    if (!canvasRef.current) return;
    
    setIsSharing(true);
    setError(null);
    
    try {
      const canvas = await html2canvas(canvasRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      canvas.toBlob(async (blob) => {
        if (!blob) return;
        
        const file = new File([blob], `exam-result-${gradingResult.total_score}.png`, { type: 'image/png' });
        
        if (navigator.share) {
          try {
            await navigator.share({
              title: '试卷批改结果',
              text: `得分: ${gradingResult.total_score}/${gradingResult.total_max_score}`,
              files: [file],
            });
            setIsSharing(false);
          } catch (err) {
            console.error('Error sharing:', err);
            setError('分享失败，请重试');
            setIsSharing(false);
          }
        } else {
          setError('当前浏览器不支持分享功能');
          setIsSharing(false);
        }
      }, 'image/png');
    } catch (err) {
      console.error('Error sharing image:', err);
      setError('分享失败，请重试');
      setIsSharing(false);
    }
  }, [gradingResult.total_score, gradingResult.total_max_score]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <Button 
          onClick={exportImage} 
          disabled={isExporting || isSharing}
          className="flex-1 h-12 gap-2"
        >
          <Download className="w-5 h-5" />
          {isExporting ? '导出中...' : '导出图片'}
        </Button>
        <Button 
          onClick={shareImage} 
          disabled={isExporting || isSharing}
          variant="outline"
          className="flex-1 h-12 gap-2"
        >
          <Share2 className="w-5 h-5" />
          {isSharing ? '分享中...' : '分享'}
        </Button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {error}
          </span>
          <button 
            onClick={() => setError(null)}
            className="hover:bg-red-100 rounded p-1 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div
        ref={canvasRef}
        className="bg-white p-4 sm:p-8 shadow-xl"
        style={{ maxWidth: '800px', margin: '0 auto' }}
      >
        <div className="mb-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-xl">
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl font-bold mb-4">试卷批改结果</h1>
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-3">
                <span className="text-4xl sm:text-5xl font-bold">
                  {gradingResult.total_score}
                </span>
                <span className="text-xl sm:text-2xl opacity-90">
                  / {gradingResult.total_max_score}
                </span>
              </div>
              <Badge variant="secondary" className="inline-block bg-white/20 text-white border-2 border-white/40 text-base">
                得分率: {scorePercentage}%
              </Badge>
            </div>
          </div>
        </div>

        <div className="space-y-6 sm:space-y-8">
          {images.map((imageUrl, index) => {
            const pageScore = gradingResult.pages[index]?.page_score || 0;
            const pageQuestions = gradingResult.pages[index]?.questions || [];
            const pageCorrect = pageQuestions.filter(q => q.status === 'correct').length;
            const pageWrong = pageQuestions.filter(q => q.status === 'wrong').length;

            return (
              <div key={index} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                      {index + 1}
                    </span>
                    <span className="font-semibold text-gray-800">第 {index + 1} 页</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      <Check className="w-3 h-3 mr-1" />
                      {pageCorrect}
                    </Badge>
                    <Badge variant="outline" className="text-red-600 border-red-600">
                      <X className="w-3 h-3 mr-1" />
                      {pageWrong}
                    </Badge>
                    <Badge variant="secondary" className="font-semibold">
                      得分: {pageScore}
                    </Badge>
                  </div>
                </div>
                <img
                  src={imageUrl}
                  alt={`Page ${index + 1}`}
                  className="w-full border-2 border-gray-200 rounded-lg"
                />
              </div>
            );
          })}
        </div>

        {wrongQuestions.length > 0 && (
          <div className="mt-10 sm:mt-12 border-t-2 border-gray-200 pt-8 sm:pt-10">
            <div className="mb-6">
              <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2 text-red-600">
                <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8" />
                错题解析附录
              </h2>
              <p className="text-gray-600 mt-2">共 {wrongQuestions.length} 道错题需要重点复习</p>
            </div>
            
            <div className="space-y-5 sm:space-y-6">
              {wrongQuestions.map((question) => (
                <div key={question.id} className="border-l-4 border-red-500 pl-4 pr-2">
                  <div className="flex items-start justify-between mb-3 gap-3">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-xs font-bold">
                        {question.id}
                      </span>
                      <span className="font-semibold text-gray-800">题目</span>
                      <Badge variant="outline" className="text-gray-500 border-gray-300 text-xs">
                        第 {question.pageIndex + 1} 页
                      </Badge>
                    </div>
                    <span className="text-red-600 font-bold text-lg whitespace-nowrap">
                      {question.score_obtained}/{question.score_max}
                    </span>
                  </div>

                  {question.error_type && (
                    <div className="mb-3 flex items-start gap-2">
                      <Badge variant="destructive" className="whitespace-nowrap">
                        {getErrorTypeLabel(question.error_type)}
                      </Badge>
                      <span className="text-sm text-gray-700 flex-1">
                        {getErrorTypeDescription(question.error_type)}
                      </span>
                    </div>
                  )}

                  <div className="mb-2">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                      <span className="font-semibold text-gray-800">正确解析</span>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 sm:p-5 rounded-lg border border-green-200">
                      <pre className="whitespace-pre-wrap text-sm sm:text-base text-gray-800 leading-relaxed font-mono">
                        {question.analysis}
                      </pre>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {gradingResult.summary_tags.length > 0 && (
          <div className="mt-10 sm:mt-12 border-t-2 border-gray-200 pt-8 sm:pt-10">
            <div className="mb-6">
              <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2 text-blue-600">
                <Check className="w-6 h-6 sm:w-8 sm:h-8" />
                学情分析
              </h2>
              <p className="text-gray-600 mt-2">基于本次批改结果的综合分析</p>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {gradingResult.summary_tags.map((tag, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="px-4 py-2 text-sm sm:text-base font-medium"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 text-center text-gray-500 text-xs sm:text-sm">
          <p>生成于 {new Date().toLocaleString('zh-CN')}</p>
          <p className="mt-1">SmartGrader 智能阅卷系统</p>
        </div>
      </div>
    </div>
  );
}

function getErrorTypeLabel(error_type?: string): string {
  switch (error_type) {
    case 'calculation':
      return '计算错误';
    case 'concept':
      return '概念错误';
    case 'logic':
      return '逻辑错误';
    default:
      return '错误';
  }
}

function getErrorTypeDescription(error_type?: string): string {
  switch (error_type) {
    case 'calculation':
      return '计算过程中出现的数值或运算错误，如粗心、计算符号错误等';
    case 'concept':
      return '对知识点理解不够深入，概念混淆或理解偏差';
    case 'logic':
      return '解题思路错误，推理过程不符合逻辑';
    default:
      return '答案错误，需要进一步分析';
  }
}