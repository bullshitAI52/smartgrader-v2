'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ClipboardCheck, GraduationCap, Wrench, BarChart3, Sparkles } from 'lucide-react';

export function Navigation() {
  const pathname = usePathname();

  const navItems = [
    { 
      href: '/', 
      label: '智能阅卷', 
      icon: ClipboardCheck,
      description: 'AI 批改试卷',
      color: 'from-blue-500 to-blue-600'
    },
    { 
      href: '/tutor', 
      label: '作业辅导', 
      icon: GraduationCap,
      description: '苏格拉底式辅导',
      color: 'from-green-500 to-green-600'
    },
    { 
      href: '/toolbox', 
      label: '工具箱', 
      icon: Wrench,
      description: '实用学习工具',
      color: 'from-purple-500 to-purple-600'
    },
    { 
      href: '/dashboard', 
      label: '学情分析', 
      icon: BarChart3,
      description: '学习数据分析',
      color: 'from-orange-500 to-orange-600'
    },
  ];

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 sm:h-20">
          <Link 
            href="/" 
            className="flex items-center gap-3 text-xl sm:text-2xl font-bold text-gray-900 hover:text-blue-600 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="hidden sm:inline">SmartGrader</span>
          </Link>
          
          <div className="flex items-center gap-1 sm:gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group relative"
                >
                  <div 
                    className={`flex items-center gap-2 px-3 sm:px-5 py-2.5 rounded-xl transition-all duration-200 ${
                      isActive
                        ? `bg-gradient-to-r ${item.color} text-white shadow-lg scale-105`
                        : 'text-gray-600 hover:bg-gray-100 hover:scale-105'
                    }`}
                  >
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="hidden sm:inline font-medium">{item.label}</span>
                  </div>
                  {isActive && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}