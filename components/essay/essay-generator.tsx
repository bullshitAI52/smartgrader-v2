'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Upload, X, Sparkles, BookOpen, Camera, Type, RefreshCw, Copy, CheckCircle2 } from 'lucide-react';
import imageCompression from 'browser-image-compression';

interface EssayGeneratorProps {
    onGenerate: (params: {
        topic: string;
        image?: File;
        grade: string;
        essayType: string;
        wordCount: string;
        language?: string;
    }) => Promise<void>;
    isLoading?: boolean;
    buttonText?: string;
}

const GRADES = [
    { value: '1', label: '小学一年级' },
    { value: '2', label: '小学二年级' },
    { value: '3', label: '小学三年级' },
    { value: '4', label: '小学四年级' },
    { value: '5', label: '小学五年级' },
    { value: '6', label: '小学六年级' },
    { value: '7', label: '初中一年级' },
    { value: '8', label: '初中二年级' },
    { value: '9', label: '初中三年级' },
    { value: '10', label: '高中一年级' },
    { value: '11', label: '高中二年级' },
    { value: '12', label: '高中三年级' },
];

const ESSAY_TYPES = [
    { value: 'narrative', label: '记叙文', icon: '📖', description: '讲述故事和经历' },
    { value: 'argumentative', label: '议论文', icon: '💭', description: '表达观点和论证' },
    { value: 'expository', label: '说明文', icon: '📝', description: '介绍事物和知识' },
    { value: 'descriptive', label: '描写文', icon: '🎨', description: '描绘景物和人物' },
    { value: 'practical', label: '应用文', icon: '📝', description: '书信、通知、演讲稿等' },
    { value: 'imaginative', label: '想象作文', icon: '🚀', description: '童话、寓言、科幻故事' },
    { value: 'diary', label: '日记', icon: '📔', description: '记录日常生活点滴' },
    { value: 'weekly_diary', label: '周记', icon: '📅', description: '总结一周的学习生活' },
    { value: 'other', label: '其它/无要求', icon: '✨', description: '无具体限制或自定义' },
];

export function EssayGenerator({ onGenerate, isLoading = false, buttonText = '开始创作' }: EssayGeneratorProps) {
    const [topic, setTopic] = useState('');
    const [image, setImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [grade, setGrade] = useState('6');
    const [essayType, setEssayType] = useState('narrative');
    const [wordCount, setWordCount] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [inputMode, setInputMode] = useState<'text' | 'image'>('text');
    const [language, setLanguage] = useState<'chinese' | 'english'>('chinese');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setError(null);
            const options = {
                maxSizeMB: 2,
                maxWidthOrHeight: 1024,
                useWebWorker: true,
                initialQuality: 0.85,
            };
            const compressedFile = await imageCompression(file, options);
            setImage(compressedFile);
            setImagePreview(URL.createObjectURL(compressedFile));
        } catch (err) {
            console.error('Image compression failed:', err);
            setImage(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleRemoveImage = () => {
        setImage(null);
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = async () => {
        setError(null);

        // Validation
        if (inputMode === 'text' && !topic.trim()) {
            setError('请输入作文主题');
            return;
        }

        if (inputMode === 'image' && !image) {
            setError('请上传包含作文主题的图片');
            return;
        }

        if (!grade) {
            setError('请选择年级');
            return;
        }

        if (!essayType) {
            setError('请选择作文类型');
            return;
        }

        await onGenerate({
            topic: inputMode === 'text' ? topic : '',
            image: inputMode === 'image' ? image || undefined : undefined,
            grade,
            essayType,
            wordCount,
            language,
        });
    };

    return (
        <div className="w-full space-y-6">
            {/* Input Mode Selector */}
            <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-gray-600">输入方式：</span>
                <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
                    <button
                        onClick={() => setInputMode('text')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${inputMode === 'text'
                            ? 'bg-white text-indigo-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <Type className="w-4 h-4" />
                        文字输入
                    </button>
                    <button
                        onClick={() => setInputMode('image')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${inputMode === 'image'
                            ? 'bg-white text-indigo-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <Camera className="w-4 h-4" />
                        图片识别
                    </button>
                </div>
            </div>

            {/* Language Selector */}
            <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-gray-600">写作语言：</span>
                <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
                    <button
                        onClick={() => setLanguage('chinese')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${language === 'chinese'
                            ? 'bg-white text-indigo-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        🇨🇳 中文
                    </button>
                    <button
                        onClick={() => setLanguage('english')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${language === 'english'
                            ? 'bg-white text-indigo-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        🇺🇸 English
                    </button>
                </div>
            </div>

            {/* Main Input Card */}
            <Card className="border-2 border-gray-200 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b">
                    <CardTitle className="flex items-center gap-2 text-indigo-900">
                        <BookOpen className="w-5 h-5" />
                        {inputMode === 'text' ? '作文主题' : '上传主题图片'}
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    {inputMode === 'text' ? (
                        <div className="space-y-3">
                            <Input
                                type="text"
                                placeholder="例如：我的暑假生活"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                className="text-lg h-14 bg-gray-50 border-gray-200 focus:bg-white focus:border-indigo-400 transition-all"
                            />
                            <p className="text-xs text-gray-500 flex items-start gap-1">
                                💡 <span>提示：输入简洁明确的作文主题，AI 会根据年级和作文类型生成相应内容</span>
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {!imagePreview ? (
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-indigo-400 hover:bg-indigo-50/30 transition-all cursor-pointer"
                                >
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="hidden"
                                    />
                                    <div className="space-y-3">
                                        <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                                            <Upload className="w-8 h-8 text-indigo-600" />
                                        </div>
                                        <div>
                                            <p className="text-lg font-semibold text-gray-700">点击上传作文主题图片</p>
                                            <p className="text-sm text-gray-500 mt-1">支持 JPG、PNG、WEBP 格式</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="relative group">
                                    <img
                                        src={imagePreview}
                                        alt="Topic"
                                        className="w-full rounded-lg border-2 border-gray-200 shadow-md"
                                    />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-3">
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="gap-2"
                                        >
                                            <Upload className="w-4 h-4" />
                                            重新上传
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={handleRemoveImage}
                                            className="gap-2"
                                        >
                                            <X className="w-4 h-4" />
                                            删除
                                        </Button>
                                    </div>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="hidden"
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Configuration Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Grade and Word Count Selector */}
                <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2 text-gray-700">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                                <span className="text-lg">🎓</span>
                            </div>
                            年级与字数
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-3 gap-4">
                        <div className="col-span-2 space-y-2">
                            <Select value={grade} onValueChange={setGrade}>
                                <SelectTrigger className="h-12 text-base bg-gray-50 hover:bg-white transition-colors">
                                    <SelectValue placeholder="选择年级" />
                                </SelectTrigger>
                                <SelectContent className="max-h-80">
                                    {GRADES.map((g) => (
                                        <SelectItem key={g.value} value={g.value} className="text-base py-3">
                                            {g.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="col-span-1 space-y-2">
                            <Input
                                value={wordCount}
                                onChange={(e) => setWordCount(e.target.value)}
                                placeholder="字数(可选)"
                                className="h-12 text-base bg-gray-50 hover:bg-white transition-colors"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Essay Type Selector */}
                <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2 text-gray-700">
                            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                                <span className="text-lg">📄</span>
                            </div>
                            作文类型
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Select value={essayType} onValueChange={setEssayType}>
                            <SelectTrigger className="h-12 text-base bg-gray-50 hover:bg-white transition-colors">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {ESSAY_TYPES.map((type) => (
                                    <SelectItem key={type.value} value={type.value} className="py-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg">{type.icon}</span>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{type.label}</span>
                                                <span className="text-xs text-gray-500">{type.description}</span>
                                            </div>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </CardContent>
                </Card>
                {/* Selected Options Summary */}
                <div className="flex flex-wrap items-center gap-2 p-4 bg-indigo-50 rounded-lg border border-indigo-100 dark:bg-indigo-900/20 dark:border-indigo-800">
                    <span className="text-sm font-semibold text-indigo-900 dark:text-indigo-300">已选择：</span>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/40 dark:text-blue-300">
                        {language === 'chinese' ? '中文' : '英文'}
                    </Badge>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/40 dark:text-blue-300">
                        {GRADES.find((g) => g.value === grade)?.label}
                    </Badge>
                    <Badge variant="secondary" className="bg-purple-100 text-purple-700 hover:bg-purple-100 dark:bg-purple-900/40 dark:text-purple-300">
                        {ESSAY_TYPES.find((t) => t.value === essayType)?.label}
                    </Badge>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
                        <span className="text-red-800 font-medium flex items-center gap-2">
                            <X className="w-5 h-5" />
                            {error}
                        </span>
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

                {/* Submit Button */}
                <Button
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="w-full h-14 text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all gap-3"
                >
                    {isLoading ? (
                        <>
                            <RefreshCw className="w-6 h-6 animate-spin" />
                            AI 正在创作中...
                        </>
                    ) : (
                        <>
                            <Sparkles className="w-6 h-6" />
                            {buttonText}
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
