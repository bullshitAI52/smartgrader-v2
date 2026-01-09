#!/bin/bash

# SmartGrader V2 VPS 部署脚本
# 使用方法: bash deploy.sh

set -e  # 遇到错误立即退出

echo "========================================="
echo "🚀 SmartGrader V2 VPS 部署脚本"
echo "========================================="

# 检查 PM2 是否安装
if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 未安装，正在安装..."
    npm install -g pm2
    echo "✅ PM2 安装完成"
else
    echo "✅ PM2 已安装"
fi

# 拉取最新代码
echo ""
echo "📥 拉取最新代码..."
git pull origin main || git pull origin master

# 安装依赖
echo ""
echo "📦 安装依赖..."
npm install

# 构建项目
echo ""
echo "🔨 构建项目..."
npm run build

# 创建日志目录
mkdir -p logs

# 停止旧进程
echo ""
echo "🛑 停止旧进程..."
pm2 delete smartgrader-v2 2>/dev/null || echo "没有运行中的进程"

# 启动新进程
echo ""
echo "▶️  启动新进程..."
pm2 start ecosystem.config.js

# 保存 PM2 进程列表（开机自启）
echo ""
echo "💾 保存 PM2 进程列表..."
pm2 save

# 设置开机自启（如果尚未设置）
echo ""
echo "🔧 配置开机自启..."
pm2 startup || echo "开机自启配置可能需要 root 权限，请手动执行 'sudo pm2 startup'"

# 显示状态
echo ""
echo "========================================="
echo "✅ 部署完成！"
echo "========================================="
echo ""
pm2 status
echo ""
echo "📊 查看日志: pm2 logs smartgrader-v2"
echo "📈 查看监控: pm2 monit"
echo "🔄 重启服务: pm2 restart smartgrader-v2"
echo "🛑 停止服务: pm2 stop smartgrader-v2"
echo ""
