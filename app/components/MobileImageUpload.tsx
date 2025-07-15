'use client';

import React, { useState, useRef } from 'react';
import { Card, Button, Typography, message, Modal, Progress, Space } from 'antd';
import { 
  PictureOutlined, 
  CameraOutlined, 
  UploadOutlined, 
  DeleteOutlined, 
  EyeOutlined, 
  CompressOutlined,
  CloseOutlined
} from '@ant-design/icons';
import { IUploadedImage } from '@/types';

const { Title, Text } = Typography;

interface MobileImageUploadProps {
  images: IUploadedImage[];
  onImageUpload: (file: File) => Promise<void>;
  onImageRemove: (uid: string) => void;
  maxImages?: number;
  onPreview?: (url: string) => void;
  disabled?: boolean;
}

export default function MobileImageUpload({
  images,
  onImageUpload,
  onImageRemove,
  maxImages = 1,
  onPreview,
  disabled = false
}: MobileImageUploadProps) {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [previewImage, setPreviewImage] = useState<string>('');
  const [previewVisible, setPreviewVisible] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // 处理文件选择
  const handleFileSelect = async (file: File) => {
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      message.error('画像ファイルを選択してください');
      return;
    }

    // 验证文件大小（10MB）
    if (file.size > 10 * 1024 * 1024) {
      message.error('ファイルサイズは10MB以下にしてください');
      return;
    }

    // 验证图片数量
    if (images.length >= maxImages) {
      message.error(`最大${maxImages}枚まで追加できます`);
      return;
    }

    try {
      // 模拟上传进度
      setUploadProgress(0);
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 100);

      await onImageUpload(file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      setTimeout(() => setUploadProgress(0), 1000);
      setShowUploadModal(false);
    } catch (error) {
      message.error('画像のアップロードに失敗しました');
      setUploadProgress(0);
    }
  };

  // 处理拖拽上传
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0 && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  // 处理图片预览
  const handlePreview = (url: string) => {
    if (onPreview) {
      onPreview(url);
    } else {
      setPreviewImage(url);
      setPreviewVisible(true);
    }
  };

  // 压缩图片
  const compressImage = (file: File, quality: number = 0.8): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // 计算压缩后的尺寸
        const maxWidth = 1920;
        const maxHeight = 1080;
        
        let { width, height } = img;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            });
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        }, file.type, quality);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  // 处理压缩上传
  const handleCompressedUpload = async (file: File) => {
    try {
      const compressedFile = await compressImage(file);
      await handleFileSelect(compressedFile);
      message.success('画像を圧縮してアップロードしました');
    } catch (error) {
      message.error('画像の圧縮に失敗しました');
    }
  };

  return (
    <div>
      <Card
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#ffffff' }}>
              <PictureOutlined style={{ marginRight: '8px' }} />
              画像アップロード
            </span>
            <Text style={{ color: '#a0a0a0', fontSize: '12px' }}>
              {images.length}/{maxImages}
            </Text>
          </div>
        }
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          marginBottom: '16px'
        }}
      >
        {images.length === 0 ? (
          // 空状态 - 上传区域
          <div
            style={{
              border: dragOver ? '2px dashed #e60033' : '2px dashed rgba(255, 255, 255, 0.2)',
              borderRadius: '12px',
              padding: '32px 16px',
              textAlign: 'center',
              background: dragOver ? 'rgba(230, 0, 51, 0.1)' : 'rgba(255, 255, 255, 0.05)',
              transition: 'all 0.3s ease',
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.6 : 1
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !disabled && setShowUploadModal(true)}
          >
            <div style={{ marginBottom: '16px' }}>
              <PictureOutlined style={{ fontSize: '48px', color: '#ffffff' }} />
            </div>
            <Title level={4} style={{ color: '#ffffff', marginBottom: '8px' }}>
              画像をアップロード
            </Title>
            <Text style={{ color: '#a0a0a0', fontSize: '14px', display: 'block', marginBottom: '16px' }}>
              タップしてファイルを選択、またはドラッグ&ドロップ
            </Text>
            <Text style={{ color: '#a0a0a0', fontSize: '12px' }}>
              JPG、PNG、GIF、WebP対応（最大10MB）
            </Text>
          </div>
        ) : (
          // 已上传的图片展示
          <div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
              gap: '12px',
              marginBottom: '16px'
            }}>
              {images.map((image) => (
                <div
                  key={image.uid}
                  style={{
                    position: 'relative',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <img
                    src={image.url}
                    alt={image.name}
                    style={{
                      width: '100%',
                      height: '120px',
                      objectFit: 'cover',
                      display: 'block'
                    }}
                  />
                  
                  {/* 操作按钮覆盖层 */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0,
                    transition: 'opacity 0.3s ease'
                  }}
                  className="image-overlay"
                  >
                    <Space>
                      <Button
                        type="text"
                        icon={<EyeOutlined />}
                        onClick={() => handlePreview(image.url)}
                        style={{
                          color: '#ffffff',
                          background: 'rgba(255, 255, 255, 0.2)',
                          border: 'none',
                          minWidth: '36px',
                          minHeight: '36px',
                          borderRadius: '8px'
                        }}
                      />
                      <Button
                        type="text"
                        icon={<DeleteOutlined />}
                        onClick={() => onImageRemove(image.uid)}
                        style={{
                          color: '#ffffff',
                          background: 'rgba(255, 77, 79, 0.8)',
                          border: 'none',
                          minWidth: '36px',
                          minHeight: '36px',
                          borderRadius: '8px'
                        }}
                      />
                    </Space>
                  </div>
                  
                  {/* 图片名称 */}
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                    padding: '16px 8px 8px',
                    color: '#ffffff',
                    fontSize: '11px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {image.name}
                  </div>
                </div>
              ))}
            </div>
            
            {/* 添加更多图片按钮 */}
            {images.length < maxImages && (
              <Button
                type="dashed"
                icon={<PictureOutlined />}
                onClick={() => setShowUploadModal(true)}
                disabled={disabled}
                block
                style={{
                  border: '1px dashed rgba(255, 255, 255, 0.3)',
                  color: '#ffffff',
                  background: 'transparent',
                  borderRadius: '8px',
                  minHeight: '44px'
                }}
              >
                画像を追加 ({images.length}/{maxImages})
              </Button>
            )}
          </div>
        )}
        
        {/* 上传进度 */}
        {uploadProgress > 0 && uploadProgress < 100 && (
          <div style={{ marginTop: '16px' }}>
            <Progress 
              percent={uploadProgress} 
              size="small" 
              strokeColor="#e60033"
              showInfo={false}
            />
            <Text style={{ color: '#a0a0a0', fontSize: '12px' }}>
              アップロード中... {uploadProgress}%
            </Text>
          </div>
        )}
      </Card>

      {/* 上传方式选择模态框 */}
      <Modal
        open={showUploadModal}
        onCancel={() => setShowUploadModal(false)}
        footer={null}
        title={
          <span style={{ color: '#ffffff' }}>
            画像をアップロード
          </span>
        }
        styles={{
          content: {
            background: 'rgba(0, 0, 0, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }
        }}
      >
        <div style={{ padding: '8px 0' }}>
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            {/* 相机拍摄 */}
            <Button
              type="primary"
              icon={<CameraOutlined />}
              onClick={() => {
                if (cameraInputRef.current) {
                  cameraInputRef.current.click();
                }
              }}
              block
              size="large"
              style={{
                background: 'linear-gradient(135deg, #e60033, #ff6b7a)',
                borderColor: 'transparent',
                minHeight: '56px',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              カメラで撮影
            </Button>
            
            {/* 文件选择 */}
            <Button
              icon={<UploadOutlined />}
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.click();
                }
              }}
              block
              size="large"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                borderColor: 'rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                minHeight: '56px',
                fontSize: '16px'
              }}
            >
              ファイルを選択
            </Button>
            
            {/* 压缩上传 */}
            <Button
              icon={<CompressOutlined />}
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.setAttribute('data-compress', 'true');
                  fileInputRef.current.click();
                }
              }}
              block
              size="large"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                borderColor: 'rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                minHeight: '56px',
                fontSize: '16px'
              }}
            >
              圧縮してアップロード
            </Button>
          </Space>
          
          <Text style={{ 
            color: '#a0a0a0', 
            fontSize: '12px', 
            display: 'block', 
            textAlign: 'center',
            marginTop: '16px'
          }}>
            対応形式：JPG、PNG、GIF、WebP（最大10MB）
          </Text>
        </div>
      </Modal>

      {/* 图片预览模态框 */}
      <Modal
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={null}
        width="90%"
        styles={{
          content: {
            background: 'rgba(0, 0, 0, 0.95)',
            border: 'none',
            padding: 0
          }
        }}
        closeIcon={
          <CloseOutlined style={{ color: '#ffffff', fontSize: '20px' }} />
        }
      >
        <img
          src={previewImage}
          alt="Preview"
          style={{
            width: '100%',
            height: 'auto',
            maxHeight: '80vh',
            objectFit: 'contain'
          }}
        />
      </Modal>

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            const shouldCompress = e.target.getAttribute('data-compress') === 'true';
            if (shouldCompress) {
              handleCompressedUpload(file);
            } else {
              handleFileSelect(file);
            }
            e.target.removeAttribute('data-compress');
          }
        }}
      />
      
      {/* 隐藏的相机输入 */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            handleFileSelect(file);
          }
        }}
      />
      
      {/* 添加CSS样式 */}
      <style jsx>{`
        .image-overlay {
          transition: opacity 0.3s ease;
        }
        .image-overlay:hover {
          opacity: 1 !important;
        }
        
        @media (hover: none) {
          .image-overlay {
            opacity: 0.8;
          }
        }
      `}</style>
    </div>
  );
} 