'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Printer, FileSpreadsheet, ArrowLeft, Wrench, Sparkles, Zap, Layers } from 'lucide-react';

const TOOLS = [
  {
    id: 'mistake' as const,
    title: '错题打印机',
    description: '提取历史错题，生成可打印的练习卷',
    icon: Printer,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    status: '即将推出',
    badge: 'HOT',
  },
  {
    id: 'table' as const,
    title: '表格转 Excel',
    description: '识别表格内容并导出为 Excel 文件',
    icon: FileSpreadsheet,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    status: '即将推出',
    badge: 'NEW',
  },
  {
    id: 'coming-soon-1' as const,
    title: '公式识别',
    description: '智能识别数学公式并转换为 LaTeX',
    icon: Zap,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    status: '开发中',
    badge: null,
  },
  {
    id: 'coming-soon-2' as const,
    title: '试卷模板',
    description: '丰富的试卷模板库，快速创建试卷',
    icon: Layers,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    status: '开发中',
    badge: null,
  },
];

export default function ToolboxPage() {
  const [selectedTool, setSelectedTool] = useState<string | null>(null);

  const handleSelectTool = useCallback((toolId: string) => {
    setSelectedTool(toolId);
  }, []);

  const handleBack = useCallback(() => {
    setSelectedTool(null);
  }, []);

  const selectedToolData = TOOLS.find(t => t.id === selectedTool);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-16">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {!selectedTool && (
          <div>
            <div className="mb-8">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Wrench className="w-7 h-7 text-white" />
                </div>
                万能工具箱
              </h1>
              <p className="text-gray-600 mt-3">实用的学习工具，让学习更高效</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {TOOLS.map((tool) => (
                <Card
                  key={tool.id}
                  className="group cursor-pointer hover:shadow-2xl transition-all duration-300 border-2 hover:border-blue-400 overflow-hidden"
                  onClick={() => handleSelectTool(tool.id)}
                >
                  <CardHeader className="space-y-4 pb-6">
                    <div className="flex items-start justify-between">
                      <div className={`p-3 rounded-xl ${tool.bgColor}`}>
                        <tool.icon className={`w-8 h-8 ${tool.color}`} />
                      </div>
                      {tool.badge && (
                        <Badge variant="destructive" className="ml-auto animate-pulse">
                          {tool.badge}
                        </Badge>
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-xl font-semibold mb-2 group-hover:text-blue-600 transition-colors">
                        {tool.title}
                      </CardTitle>
                      <CardDescription className="text-gray-600 leading-relaxed">
                        {tool.description}
                      </CardDescription>
                    </div>
                    <Badge 
                      variant="secondary" 
                      className="ml-auto"
                    >
                      {tool.status}
                    </Badge>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        )}

        {selectedToolData && selectedToolData.status === '即将推出' && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                onClick={handleBack}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                返回
              </Button>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <div className={`p-2 rounded-lg ${selectedToolData.bgColor}`}>
                  <selectedToolData.icon className={`w-6 h-6 ${selectedToolData.color}`} />
                </div>
                {selectedToolData.title}
              </h2>
            </div>

            <Card className="shadow-lg border-2">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b-2">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Sparkles className="w-6 h-6 text-blue-600" />
                  功能即将推出
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-8 space-y-6">
                <div className="text-center space-y-4">
                  <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                    <selectedToolData.icon className={`w-12 h-12 ${selectedToolData.color} animate-bounce`} />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      敬请期待
                    </h3>
                    <p className="text-gray-600 leading-relaxed max-w-md mx-auto">
                      {selectedToolData.title}功能正在紧锣密鼓地开发中，
                      即将在未来的版本中推出。请持续关注我们的更新！
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 p-6 rounded-xl">
                  <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    即将推出的功能特性
                  </h4>
                  <ul className="space-y-2 text-blue-800">
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 mt-2 rounded-full bg-blue-600 flex-shrink-0" />
                      <span>智能错题分类和优先级推荐</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 mt-2 rounded-full bg-blue-600 flex-shrink-0" />
                      <span>自动生成相似题目练习</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 mt-2 rounded-full bg-blue-600 flex-shrink-0" />
                      <span>支持多种导出格式（PDF、Word、Excel）</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 mt-2 rounded-full bg-blue-600 flex-shrink-0" />
                      <span>错题本云端同步和备份</span>
                    </li>
                  </ul>
                </div>

                <div className="flex justify-center">
                  <Button 
                    variant="outline" 
                    onClick={handleBack}
                    className="gap-2 h-12"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    返回工具箱
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {selectedToolData && selectedToolData.status === '开发中' && (
          <Card className="shadow-lg">
            <CardContent className="py-12">
              <div className="text-center space-y-4">
                <div className="w-20 h-20 mx-auto rounded-full bg-gray-100 flex items-center justify-center">
                  <Wrench className="w-10 h-10 text-gray-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {selectedToolData.title}
                  </h3>
                  <p className="text-gray-600">
                    此功能正在开发中，敬请期待！
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}