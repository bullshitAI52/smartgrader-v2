'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Copy, CheckCircle2, RefreshCw, BookOpen, Lightbulb, Star } from 'lucide-react';

interface EssayResultProps {
    essay: string;
    topic: string;
    grade: string;
    essayType: string;
    onRegenerate?: () => void;
    isRegenerating?: boolean;
}

const GRADE_LABELS: Record<string, string> = {
    '1': '小学一年级', '2': '小学二年级', '3': '小学三年级',
    '4': '小学四年级', '5': '小学五年级', '6': '小学六年级',
    '7': '初中一年级', '8': '初中二年级', '9': '初中三年级',
    '10': '高中一年级', '11': '高中二年级', '12': '高中三年级',
};

const TYPE_LABELS: Record<string, string> = {
    narrative: '记叙文',
    argumentative: '议论文',
    expository: '说明文',
    descriptive: '描写文',
    practical: '应用文',
    imaginative: '想象作文',
};

export function EssayResult({
    essay,
    topic,
    grade,
    essayType,
    onRegenerate,
    isRegenerating = false,
}: EssayResultProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(essay);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            {/* Header Info */}
            <Card className="border-2 border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50 shadow-lg">
                <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center">
                                    <BookOpen className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800">作文主题</h3>
                                    <p className="text-xl font-semibold text-indigo-900 mt-1">{topic}</p>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 gap-1">
                                    <span className="text-base">🎓</span>
                                    {GRADE_LABELS[grade]}
                                </Badge>
                                <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 gap-1">
                                    <span className="text-base">📄</span>
                                    {TYPE_LABELS[essayType]}
                                </Badge>
                                <Badge className="bg-green-100 text-green-700 hover:bg-green-100 gap-1">
                                    <CheckCircle2 className="w-3 h-3" />
                                    AI 生成
                                </Badge>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                onClick={handleCopy}
                                variant="outline"
                                size="sm"
                                className="gap-2 h-10"
                            >
                                {copied ? (
                                    <>
                                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                                        已复制
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-4 h-4" />
                                        复制
                                    </>
                                )}
                            </Button>
                            {onRegenerate && (
                                <Button
                                    onClick={onRegenerate}
                                    disabled={isRegenerating}
                                    variant="outline"
                                    size="sm"
                                    className="gap-2 h-10"
                                >
                                    <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
                                    重新生成
                                </Button>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Essay Content */}
            <Card className="border-2 border-gray-200 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50 border-b">
                    <CardTitle className="flex items-center gap-2 text-gray-800">
                        <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                        生成的作文
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="prose prose-lg max-w-none">
                        <div className="bg-white rounded-lg p-8 border border-gray-100 shadow-inner">
                            <div
                                className="text-gray-800 leading-loose whitespace-pre-wrap font-serif text-lg"
                                style={{ textIndent: '2em' }}
                            >
                                {essay}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Writing Tips */}
            <Card className="border border-amber-200 bg-amber-50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-amber-900 text-base">
                        <Lightbulb className="w-5 h-5 text-amber-600" />
                        写作提示
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-2 text-sm text-amber-900">
                        <li className="flex items-start gap-2">
                            <span className="text-amber-600 mt-1">•</span>
                            <span>这是 AI 生成的参考作文，建议在此基础上加入自己的真实感受和经历</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-amber-600 mt-1">•</span>
                            <span>注意检查语句是否通顺，标点符号是否正确</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-amber-600 mt-1">•</span>
                            <span>可以根据实际情况调整内容，使作文更加生动有趣</span>
                        </li>
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
}
