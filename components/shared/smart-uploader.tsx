'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Upload, X, ArrowUp, ArrowDown, Image as ImageIcon, Plus } from 'lucide-react';
import imageCompression from 'browser-image-compression';

interface ImagePreview {
  id: string;
  file: File;
  preview: string;
}

interface SmartUploaderProps {
  onUpload: (images: File[], totalMaxScore: number) => void;
  maxImages?: number;
}

const SCORE_PRESETS = [100, 120, 150];

export function SmartUploader({ onUpload, maxImages = 5 }: SmartUploaderProps) {
  const [images, setImages] = useState<ImagePreview[]>([]);
  const [maxScore, setMaxScore] = useState<number>(100);
  const [showScoreDialog, setShowScoreDialog] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const processFiles = useCallback(async (files: File[]) => {
    if (images.length + files.length > maxImages) {
      setError(`最多只能上传 ${maxImages} 张图片`);
      return;
    }


    setError(null);

    const processedFiles = await Promise.all(
      files.map(async (file) => {
        const options = {
          maxSizeMB: 2,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
          initialQuality: 0.85,
        };

        try {
          const compressedFile = await imageCompression(file, options);
          const preview = URL.createObjectURL(compressedFile);
          return {
            id: Math.random().toString(36).substring(7),
            file: compressedFile,
            preview,
          };
        } catch (err) {
          console.error('Error compressing image:', err);
          const preview = URL.createObjectURL(file);
          return {
            id: Math.random().toString(36).substring(7),
            file,
            preview,
          };
        }
      })
    );

    setImages((prev) => [...prev, ...processedFiles]);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [images.length, maxImages]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setError(null);
    await processFiles(files);
  }, [processFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files).filter(file =>
      file.type.startsWith('image/')
    );

    if (files.length === 0) {
      setError('请上传图片文件');
      return;
    }

    await processFiles(files);
  }, [processFiles]);

  const handleRemoveImage = useCallback((id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  }, []);

  const handleMoveImage = useCallback((index: number, direction: 'up' | 'down') => {
    const newImages = [...images];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex >= 0 && targetIndex < newImages.length) {
      [newImages[index], newImages[targetIndex]] = [newImages[targetIndex], newImages[index]];
      setImages(newImages);
    }
  }, [images]);

  const handleUpload = useCallback(() => {
    if (images.length === 0) {
      setError('请先上传图片');
      return;
    }
    setShowScoreDialog(true);
  }, [images.length]);

  const confirmUpload = useCallback(() => {
    const files = images.map((img) => img.file);
    onUpload(files, maxScore);
    setShowScoreDialog(false);
    setImages([]);
    setError(null);
  }, [images, maxScore, onUpload]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        <Input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        <Button
          onClick={() => fileInputRef.current?.click()}
          variant="outline"
          className="flex-1 sm:flex-none gap-2 h-12"
        >
          <Upload className="w-5 h-5" />
          <span>上传图片</span>
          <span className="ml-auto px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
            {images.length}/{maxImages}
          </span>
        </Button>
        <Button
          onClick={handleUpload}
          disabled={images.length === 0}
          className="flex-1 sm:flex-none gap-2 h-12"
        >
          <Plus className="w-5 h-5" />
          <span>开始批改</span>
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between gap-4">
          <span className="text-red-800 font-medium flex items-center gap-2">
            <X className="w-5 h-5" />
            {error}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearError}
            className="h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {images.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {images.map((img, index) => (
            <div key={img.id} className="relative group">
              <div className="relative aspect-[3/4] rounded-xl overflow-hidden border-2 border-gray-200 shadow-md hover:shadow-lg transition-all">
                <img
                  src={img.preview}
                  alt={`Page ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-md">
                  {index + 1}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
                  <Button
                    size="icon"
                    variant="secondary"
                    onClick={() => handleMoveImage(index, 'up')}
                    disabled={index === 0}
                    className="rounded-full h-10 w-10"
                  >
                    <ArrowUp className="w-5 h-5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="secondary"
                    onClick={() => handleMoveImage(index, 'down')}
                    disabled={index === images.length - 1}
                    className="rounded-full h-10 w-10"
                  >
                    <ArrowDown className="w-5 h-5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="destructive"
                    onClick={() => handleRemoveImage(img.id)}
                    className="rounded-full h-10 w-10"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          ref={dropZoneRef}
          className={`border-2 border-dashed rounded-xl p-8 sm:p-12 text-center transition-all cursor-pointer
            ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400 bg-gray-50 hover:bg-gray-100'
            }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="space-y-4">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
              <ImageIcon className="w-10 h-10 text-blue-600" />
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-700 mb-2">
                拖拽图片到这里
              </p>
              <p className="text-gray-500">
                或点击上传按钮选择图片
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                1-{maxImages} 张
              </span>
              <span>支持 JPG, PNG, WEBP 格式</span>
            </div>
          </div>
        </div>
      )}

      <Dialog open={showScoreDialog} onOpenChange={setShowScoreDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">设置试卷满分</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 pt-4">
            <div>
              <label className="block text-sm font-semibold mb-3 text-gray-700">
                本套试卷满分是多少？
              </label>
              <Input
                type="number"
                value={maxScore}
                onChange={(e) => setMaxScore(Number(e.target.value))}
                min="1"
                max="1000"
                className="text-lg h-12"
              />
            </div>
            <div className="space-y-3">
              <p className="text-sm text-gray-600 font-medium">快捷选择:</p>
              <div className="grid grid-cols-3 gap-3">
                {SCORE_PRESETS.map((score) => (
                  <Button
                    key={score}
                    variant={maxScore === score ? 'default' : 'outline'}
                    onClick={() => setMaxScore(score)}
                    className="h-12 font-semibold"
                  >
                    {score}分
                  </Button>
                ))}
              </div>
            </div>
            <Button onClick={confirmUpload} className="w-full h-12 text-base font-semibold gap-2">
              <Plus className="w-5 h-5" />
              开始批改
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}