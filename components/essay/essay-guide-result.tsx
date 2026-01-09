
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RefreshCw, Copy, PenTool } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface EssayGuideResultProps {
    guide: string;
    topic: string;
    grade: string;
    essayType: string;
    onRegenerate: () => void;
    isRegenerating: boolean;
}

export function EssayGuideResult({
    guide,
    topic,
    grade,
    essayType,
    onRegenerate,
    isRegenerating,
}: EssayGuideResultProps) {
    const handleCopy = () => {
        navigator.clipboard.writeText(guide);
    };

    const GRADES = {
        '1': '小学一年级', '2': '小学二年级', '3': '小学三年级',
        '4': '小学四年级', '5': '小学五年级', '6': '小学六年级',
        '7': '初中一年级', '8': '初中二年级', '9': '初中三年级',
        '10': '高中一年级', '11': '高中二年级', '12': '高中三年级',
    };
    const gradeLabel = GRADES[grade as keyof typeof GRADES] || grade;

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            {/* Header / Meta Info */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                        <span className="bg-amber-100 text-amber-700 p-2 rounded-lg">
                            <PenTool className="w-5 h-5" />
                        </span>
                        <h2 className="text-xl font-bold text-gray-800">写作引导：{topic}</h2>
                    </div>
                    <div className="flex gap-2 pl-12 text-sm text-gray-500">
                        <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600">{gradeLabel}</span>
                        <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600">类型: {essayType}</span>
                    </div>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <Button variant="outline" onClick={handleCopy} className="md:w-32 gap-2 hover:bg-gray-50">
                        <Copy className="w-4 h-4" /> 复制引导
                    </Button>
                    <Button onClick={onRegenerate} disabled={isRegenerating} className="md:w-32 bg-indigo-600 hover:bg-indigo-700 gap-2 text-white shadow-md hover:shadow-lg transition-all">
                        {isRegenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                        换个思路
                    </Button>
                </div>
            </div>

            {/* Guide Content */}
            <Card className="border border-gray-100 shadow-md bg-white overflow-hidden rounded-2xl">
                <div className="p-8 md:p-10">
                    <div className="prose prose-lg prose-indigo max-w-none prose-headings:font-bold prose-headings:text-indigo-800 prose-p:text-gray-700 prose-li:text-gray-700 bg-amber-50/30 p-6 rounded-xl border border-amber-100/50">
                        <ReactMarkdown>{guide}</ReactMarkdown>
                    </div>
                </div>
            </Card>
        </div>
    );
}
