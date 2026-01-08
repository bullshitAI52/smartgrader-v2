'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Target, Calendar, Award, BarChart3, AlertCircle, BookOpen, RotateCcw, Sparkles } from 'lucide-react';

export default function DashboardPage() {
  const stats = [
    {
      title: '总批改次数',
      value: '0',
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      trend: '本周 +3',
    },
    {
      title: '平均得分率',
      value: '0%',
      icon: Target,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      trend: '较上周 +5%',
    },
    {
      title: '最高得分',
      value: '0',
      icon: Award,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      trend: '历史最佳',
    },
    {
      title: '错题总数',
      value: '0',
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      trend: '本周 +2',
    },
  ];

  const emptyStates = [
    {
      title: '能力雷达图',
      description: '分析五个维度能力：计算能力、概念理解、逻辑思维、书写规范、空间想象',
      icon: BarChart3,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: '薄弱点追踪',
      description: '追踪高频错误知识点，智能推荐练习重点',
      icon: Target,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      title: '得分趋势',
      description: '可视化展示学习进步曲线，发现成长轨迹',
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: '高频错题类型',
      description: '分析错误类型分布，针对性改进',
      icon: BookOpen,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-16">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <BarChart3 className="w-7 h-7 text-white" />
            </div>
            学情分析
          </h1>
          <p className="text-gray-600">全面了解学习情况，发现成长轨迹</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          {stats.map((stat) => (
            <Card key={stat.title} className="shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-600">
                      {stat.title}
                    </p>
                    <Badge variant="secondary" className="text-xs">
                      {stat.trend}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-3xl sm:text-4xl font-bold text-gray-900">
                      {stat.value}
                    </p>
                    <div className={`${stat.bgColor} p-3 rounded-full shadow-sm`}>
                      <stat.icon className={`w-6 h-6 sm:w-8 sm:h-8 ${stat.color}`} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {emptyStates.map((state) => (
            <Card key={state.title} className="shadow-md">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b-2">
                <CardTitle className="flex items-center gap-3 text-lg sm:text-xl">
                  <div className={`p-2 rounded-lg ${state.bgColor}`}>
                    <state.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${state.color}`} />
                  </div>
                  {state.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-8">
                <div className="flex flex-col items-center justify-center h-64 text-center space-y-4">
                  <div className={`w-20 h-20 rounded-2xl ${state.bgColor} flex items-center justify-center`}>
                    <Sparkles className={`w-10 h-10 ${state.color} animate-pulse`} />
                  </div>
                  <div className="space-y-2">
                    <p className="text-lg font-semibold text-gray-900">
                      功能即将推出
                    </p>
                    <p className="text-sm text-gray-600 max-w-xs sm:max-w-sm mx-auto leading-relaxed">
                      {state.description}
                    </p>
                  </div>
                  <p className="text-xs text-gray-400">
                    首次使用需要批改 1 份试卷
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="shadow-lg border-2 border-blue-200 mt-8">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardTitle className="flex items-center gap-2 text-xl">
              <RotateCcw className="w-6 h-6 text-blue-600" />
              开始学习
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-8">
            <div className="text-center space-y-4">
              <p className="text-gray-600 leading-relaxed">
                批改更多试卷，获取更准确的学情分析。
                随着数据积累，AI 将提供更精准的学习建议。
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                <Badge variant="secondary" className="text-base px-4 py-2 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  错题本：0 题
                </Badge>
                <Badge variant="secondary" className="text-base px-4 py-2 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  知识点覆盖：0 个
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}