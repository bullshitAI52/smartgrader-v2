'use client';

import { Question } from '@/lib/services/gemini';
import { Check, X, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

interface GradingOverlayProps {
  imageUrl: string;
  questions: Question[];
  imageWidth: number;
  imageHeight: number;
}

export function GradingOverlay({ imageUrl, questions, imageWidth, imageHeight }: GradingOverlayProps) {
  return (
    <div className="relative">
      <img
        src={imageUrl}
        alt="Exam page"
        className="w-full"
        style={{ maxHeight: '80vh' }}
      />
      
      <div className="absolute inset-0 pointer-events-none">
        {questions.map((question) => (
          <QuestionOverlay
            key={question.id}
            question={question}
            imageWidth={imageWidth}
            imageHeight={imageHeight}
          />
        ))}
      </div>
    </div>
  );
}

interface QuestionOverlayProps {
  question: Question;
  imageWidth: number;
  imageHeight: number;
}

function QuestionOverlay({ question, imageWidth, imageHeight }: QuestionOverlayProps) {
  const { box_2d, status, score_obtained, score_max, analysis, error_type } = question;
  
  const [x, y, width] = box_2d;
  
  const left = (x / 1000) * imageWidth;
  const top = (y / 1000) * imageHeight;
  const boxWidth = (width / 1000) * imageWidth;

  const isCorrect = status === 'correct';
  const isPartial = status === 'partial';
  const isWrong = status === 'wrong';
  
  const scoreDiff = score_obtained - score_max;

  const getScoreColor = (status: string) => {
    if (status === 'correct') return 'text-green-500 border-green-500 bg-green-50';
    if (status === 'partial') return 'text-yellow-600 border-yellow-600 bg-yellow-50';
    return 'text-red-500 border-red-500 bg-red-50';
  };

  const getIcon = () => {
    if (isCorrect) return <Check className="w-6 h-6 sm:w-8 sm:h-8" strokeWidth={3} />;
    if (isPartial) return <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8" strokeWidth={3} />;
    return <X className="w-6 h-6 sm:w-8 sm:h-8" strokeWidth={3} />;
  };

  return (
    <div
      className="absolute pointer-events-auto"
      style={{
        left: `${left + boxWidth + 4}px`,
        top: `${top}px`,
        transform: 'translateY(-50%)',
      }}
    >
      <div className="flex items-center gap-1 sm:gap-2">
        <div className={`p-1.5 sm:p-2 rounded-full ${getScoreColor(status)}`}>
          {getIcon()}
        </div>
        {score_max > 0 && (
          <Badge 
            variant="outline" 
            className={`text-xs sm:text-sm px-2 sm:px-2.5 py-0.5 ${getScoreColor(status)}`}
          >
            {isCorrect ? `+${score_max}` : scoreDiff}
          </Badge>
        )}
      </div>
      
      {isWrong && (
        <Sheet>
          <SheetTrigger asChild>
            <div 
              className="absolute inset-0 cursor-pointer hover:opacity-80 transition-opacity rounded-full"
              aria-label="查看解析"
            />
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[85vh] sm:max-h-[80vh] overflow-y-auto">
            <SheetHeader className="pb-4 border-b">
              <SheetTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 rounded-full bg-red-100">
                  <X className="w-6 h-6 text-red-600" />
                </div>
                题目解析
                {error_type && (
                  <Badge variant="destructive" className="ml-auto">
                    {getErrorTypeLabel(error_type)}
                  </Badge>
                )}
              </SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <span className="w-6 h-6 rounded bg-blue-600 text-white flex items-center justify-center text-xs">
                    1
                  </span>
                  得分情况
                </h4>
                <p className="text-blue-800">
                  本题得分：{' '}
                  <span className="font-bold text-2xl text-red-600 mx-2">
                    {score_obtained}
                  </span>
                  {' '}<span className="text-gray-500">/ {score_max} 分</span>
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-red-500 rounded-full transition-all"
                      style={{ width: `${(score_obtained / score_max) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-gray-600">
                    {Math.round((score_obtained / score_max) * 100)}%
                  </span>
                </div>
              </div>
              
              {error_type && (
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-orange-900 mb-2 flex items-center gap-2">
                    <span className="w-6 h-6 rounded bg-orange-600 text-white flex items-center justify-center text-xs">
                      2
                    </span>
                    错误类型
                  </h4>
                  <div className="flex items-start gap-3">
                    <Badge variant="destructive" className="mt-1">
                      {getErrorTypeLabel(error_type)}
                    </Badge>
                    <p className="text-orange-800 flex-1">
                      {getErrorTypeDescription(error_type)}
                    </p>
                  </div>
                </div>
              )}
              
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 rounded bg-green-600 text-white flex items-center justify-center text-xs">
                    3
                  </span>
                  正确解析
                </h4>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-green-200">
                  <pre className="whitespace-pre-wrap text-sm sm:text-base text-gray-800 leading-relaxed">
                    {analysis}
                  </pre>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      )}
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
      return '计算过程中出现的数值或运算错误，如粗心、计算符号错误等。需要多练习计算，提高准确性。';
    case 'concept':
      return '对知识点理解不够深入，概念混淆或理解偏差。建议复习相关知识点，加强对基础概念的理解。';
    case 'logic':
      return '解题思路错误，推理过程不符合逻辑。需要培养逻辑思维能力，多做综合性练习题。';
    default:
      return '答案错误，需要进一步分析。建议仔细审题，理解题意后再作答。';
  }
}