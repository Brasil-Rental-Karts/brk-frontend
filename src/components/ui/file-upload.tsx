import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, File, X, ExternalLink, Loader2 } from 'lucide-react';

interface FileUploadProps {
  value?: string;
  onChange: (url: string) => void;
  disabled?: boolean;
  placeholder?: string;
  accept?: string;
  maxSize?: number; // in MB
  label?: string;
  showPreview?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  value = '',
  onChange,
  disabled = false,
  placeholder = "Clique para fazer upload ou insira uma URL",
  accept = "image/*",
  maxSize = 5, // 5MB default
  label = "Arquivo",
  showPreview = true
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const cloudinaryCloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const cloudinaryUploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  const uploadToCloudinary = async (file: File): Promise<string> => {
    if (!cloudinaryCloudName || !cloudinaryUploadPreset) {
      throw new Error('Configuração do Cloudinary não encontrada. Verifique as variáveis de ambiente.');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', cloudinaryUploadPreset);
    formData.append('folder', 'brk-images'); // Organizar em pasta

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudinaryCloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Erro ao fazer upload do arquivo');
    }

    const data = await response.json();
    return data.secure_url;
  };

  const handleFileSelect = async (file: File) => {
    if (!file) return;

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      setUploadError(`Arquivo muito grande. Tamanho máximo: ${maxSize}MB`);
      return;
    }

    // Validate file type
    const acceptedTypes = accept.split(',').map(type => type.trim());
    const isValidType = acceptedTypes.some(type => {
      if (type === 'image/*') return file.type.startsWith('image/');
      if (type.startsWith('.')) return file.name.toLowerCase().endsWith(type.toLowerCase());
      return file.type === type;
    });

    if (!isValidType) {
      setUploadError('Tipo de arquivo não permitido');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const uploadedUrl = await uploadToCloudinary(file);
      onChange(uploadedUrl);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Erro ao fazer upload');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
    
    const file = event.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleUrlChange = (url: string) => {
    onChange(url);
    setUploadError(null);
  };

  const handleRemoveFile = () => {
    onChange('');
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const isImage = (url: string) => {
    return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url);
  };

  return (
    <div className="space-y-3">
      {/* URL Input */}
      <div className="space-y-1">
        <label className="text-sm font-medium">{label}</label>
        <Input
          value={value}
          onChange={(e) => handleUrlChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          type="url"
        />
      </div>

      {/* Upload Area */}
      <Card 
        className={`border-2 border-dashed transition-colors ${
          isDragOver 
            ? 'border-primary bg-primary/5' 
            : 'border-muted-foreground/25 hover:border-muted-foreground/50'
        }`}
      >
        <CardContent className="p-6">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className="text-center space-y-3"
          >
            {isUploading ? (
              <div className="flex flex-col items-center space-y-2">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Fazendo upload...</p>
              </div>
            ) : (
              <>
                <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    Arraste um arquivo aqui ou{' '}
                    <Button
                      type="button"
                      variant="link"
                      onClick={openFileDialog}
                      disabled={disabled}
                      className="h-auto p-0"
                    >
                      clique para selecionar
                    </Button>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Máximo {maxSize}MB • {accept}
                  </p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileInputChange}
        disabled={disabled}
        className="hidden"
      />

      {/* Error Message */}
      {uploadError && (
        <div className="text-sm text-destructive bg-destructive/10 p-2 rounded border">
          {uploadError}
        </div>
      )}

      {/* Preview */}
      {value && showPreview && (
        <Card className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                {isImage(value) ? (
                  <img
                    src={value}
                    alt="Preview"
                    className="w-12 h-12 object-cover rounded border"
                    onError={(e) => {
                      const target = e.currentTarget;
                      const fallback = target.nextElementSibling as HTMLElement;
                      target.style.display = 'none';
                      if (fallback) {
                        fallback.style.display = 'flex';
                      }
                    }}
                  />
                ) : null}
                <File className="w-6 h-6 text-muted-foreground" style={{ display: isImage(value) ? 'none' : 'flex' }} />
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {value.split('/').pop() || 'Arquivo selecionado'}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(value, '_blank')}
                      className="h-6 px-2 text-xs"
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Ver
                    </Button>
                  </div>
                </div>
              </div>
              
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRemoveFile}
                disabled={disabled}
                className="ml-2"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 