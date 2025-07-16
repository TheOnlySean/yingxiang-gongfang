'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Typography, Space, Spin, message, Modal, Badge } from 'antd';
import { 
  PlayCircleOutlined, 
  DownloadOutlined, 
  ClockCircleOutlined, 
  ShareAltOutlined,
  MoreOutlined,
  DeleteOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import { IVideo } from '@/types';
import MobileLayout from './MobileLayout';

const { Text } = Typography;

interface MobileVideoHistoryProps {
  videos: IVideo[];
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onPlay: (video: IVideo) => void;
  onDownload?: (video: IVideo) => void;
  onDelete?: (video: IVideo) => void;
  onBack?: () => void;
}

export default function MobileVideoHistory({ 
  videos = [], 
  loading, 
  hasMore, 
  onLoadMore, 
  onPlay,
  onDownload,
  onDelete,
  onBack
}: MobileVideoHistoryProps) {
  const [selectedVideo, setSelectedVideo] = useState<IVideo | null>(null);
  const [showActions, setShowActions] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [videoThumbnails, setVideoThumbnails] = useState<Record<string, string>>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  // 计算剩余天数
  const getRemainingDays = (video: IVideo) => {
    const expiresAt = video.kieAiExpiresAt || video.localExpiresAt;
    if (!expiresAt) {
      // 如果没有过期时间，计算从创建时间开始的14天
      const createdDate = new Date(video.createdAt);
      const expiresDate = new Date(createdDate.getTime() + 14 * 24 * 60 * 60 * 1000);
      const now = new Date();
      const diffTime = expiresDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return Math.max(0, diffDays);
    }
    
    const now = new Date();
    const expires = new Date(expiresAt);
    const diffTime = expires.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  // 生成视频缩略图
  const generateThumbnail = async (videoUrl: string, videoId: string) => {
    if (videoThumbnails[videoId]) return videoThumbnails[videoId];
    
    try {
      const video = document.createElement('video');
      video.src = videoUrl;
      video.crossOrigin = 'anonymous';
      video.currentTime = 1;
      
      return new Promise<string>((resolve) => {
        video.onloadeddata = () => {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(video, 0, 0);
          
          const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8);
          setVideoThumbnails(prev => ({
            ...prev,
            [videoId]: thumbnailUrl
          }));
          resolve(thumbnailUrl);
        };
      });
    } catch (error) {
      console.error('Failed to generate thumbnail:', error);
      return '';
    }
  };

  // 处理视频播放
  const handlePlay = (video: IVideo) => {
    onPlay(video);
  };

  // 处理视频下载
  const handleDownload = async (video: IVideo) => {
    if (onDownload) {
      onDownload(video);
    } else {
      // 默认下载逻辑
      try {
        if (!video.videoUrl) {
          message.error('動画URLが見つかりません');
          return;
        }
        
        const response = await fetch(video.videoUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `video_${video.id}.mp4`;
        a.click();
        window.URL.revokeObjectURL(url);
        message.success('ダウンロードが開始されました');
      } catch (error) {
        message.error('ダウンロードに失敗しました');
      }
    }
  };

  // 处理长按操作
  const handleLongPress = (video: IVideo) => {
    setSelectedVideo(video);
    setShowActions(true);
  };

  // 切换卡片展开状态
  const toggleCardExpansion = (videoId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(videoId)) {
        newSet.delete(videoId);
      } else {
        newSet.add(videoId);
      }
      return newSet;
    });
  };

  // 视频卡片组件
  const VideoCard = ({ video, index }: { video: IVideo; index: number }) => {
    const remainingDays = getRemainingDays(video);
    const isExpiring = remainingDays <= 3 && remainingDays > 0;
    const isExpired = remainingDays === 0;
    const isExpanded = expandedCards.has(video.id);
    const [thumbnailUrl, setThumbnailUrl] = useState<string>('');
    const [isPressed, setIsPressed] = useState(false);

    useEffect(() => {
      if (video.videoUrl && !thumbnailUrl) {
        generateThumbnail(video.videoUrl, video.id).then(setThumbnailUrl);
      }
    }, [video.videoUrl, video.id, thumbnailUrl]);

    return (
      <Card
        style={{
          marginBottom: '16px',
          background: isPressed ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)',
          border: index === 0 ? '2px solid #e60033' : '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          position: 'relative',
          transform: isPressed ? 'scale(0.98)' : 'scale(1)',
          transition: 'all 0.2s ease',
          touchAction: 'manipulation'
        }}
        onTouchStart={() => setIsPressed(true)}
        onTouchEnd={() => setIsPressed(false)}
        onTouchCancel={() => setIsPressed(false)}
      >
        {/* 标签 */}
        <div style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          display: 'flex',
          gap: '8px',
          zIndex: 1
        }}>
          {index === 0 && (
            <Badge 
              count="最新" 
              style={{ 
                backgroundColor: '#e60033',
                fontSize: '10px',
                height: '20px',
                lineHeight: '20px',
                minWidth: '32px'
              }} 
            />
          )}
          {isExpiring && (
            <Badge 
              count="期限切れ近し" 
              style={{ 
                backgroundColor: '#fa8c16',
                fontSize: '10px',
                height: '20px',
                lineHeight: '20px',
                minWidth: '60px'
              }} 
            />
          )}
        </div>

        {/* 视频预览 */}
        <div 
          style={{
            width: '100%',
            height: '200px',
            borderRadius: '12px',
            marginBottom: '12px',
            overflow: 'hidden',
            position: 'relative',
            background: '#000',
            cursor: 'pointer',
            touchAction: 'manipulation'
          }}
          onClick={() => handlePlay(video)}
        >
          {thumbnailUrl || video.thumbnailUrl ? (
            <img
              src={thumbnailUrl || video.thumbnailUrl}
              alt="Video thumbnail"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
          ) : (
            <div style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, rgba(230, 0, 51, 0.2), rgba(255, 107, 122, 0.2))'
            }}>
              <Spin size="large" />
            </div>
          )}
          
          {/* 播放按钮覆盖层 */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.4)', // 增加背景透明度
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(230, 0, 51, 0.9)', // 使用品牌红色背景
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)', // 增强阴影
              border: '2px solid rgba(255, 255, 255, 0.8)', // 添加白色边框
            }}>
              <PlayCircleOutlined style={{
                fontSize: '36px', // 增大图标
                color: '#ffffff', // 改为白色图标
                marginLeft: '4px' // 调整播放图标位置
              }} />
            </div>
          </div>
        </div>

        {/* 视频信息 */}
        <div style={{ marginBottom: '12px' }}>
          <Text 
            style={{
              color: '#ffffff',
              fontSize: '16px',
              fontWeight: '500',
              display: 'block',
              marginBottom: '8px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: isExpanded ? 'normal' : 'nowrap',
              lineHeight: '1.4'
            }}
          >
            {video.originalPrompt || 'プロンプトなし'}
          </Text>
          
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px'
          }}>
            <Text style={{ color: '#a0a0a0', fontSize: '14px' }}>
              {new Date(video.createdAt).toLocaleDateString('ja-JP')}
            </Text>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              color: isExpired ? '#ff4d4f' : isExpiring ? '#fa8c16' : '#a0a0a0',
              fontSize: '12px'
            }}>
              <ClockCircleOutlined />
              {isExpired ? '期限切れ' : `${remainingDays}日残り`}
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div style={{
          display: 'flex',
          gap: '8px',
          justifyContent: 'center'
        }}>
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={() => handlePlay(video)}
            style={{
              flex: 1,
              background: 'linear-gradient(135deg, #e60033, #ff6b7a)',
              borderColor: 'transparent',
              borderRadius: '8px',
              minHeight: '44px',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            再生
          </Button>
          
          <Button
            icon={<DownloadOutlined />}
            onClick={() => handleDownload(video)}
            style={{
              flex: 1,
              background: 'rgba(255, 255, 255, 0.1)',
              borderColor: 'rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
              borderRadius: '8px',
              minHeight: '44px',
              fontSize: '14px'
            }}
          >
            ダウンロード
          </Button>
          
          <Button
            icon={<MoreOutlined />}
            onClick={() => handleLongPress(video)}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              borderColor: 'rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
              borderRadius: '8px',
              minHeight: '44px',
              minWidth: '44px'
            }}
          />
        </div>

        {/* 展开按钮 */}
        {(video.originalPrompt || '')?.length > 50 && (
          <div style={{ textAlign: 'center', marginTop: '8px' }}>
            <Button
              type="text"
              size="small"
              onClick={() => toggleCardExpansion(video.id)}
              style={{
                color: '#a0a0a0',
                fontSize: '12px',
                height: '24px',
                padding: '0 8px'
              }}
            >
              {isExpanded ? '折りたたむ' : 'もっと見る'}
            </Button>
          </div>
        )}
      </Card>
    );
  };

  return (
    <MobileLayout
      header={{
        title: '動画履歴',
        actions: onBack ? (
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={onBack}
            style={{
              color: '#ffffff',
              minWidth: '44px',
              minHeight: '44px',
              borderRadius: '8px'
            }}
          />
        ) : undefined
      }}
    >
      <div style={{ padding: '16px' }}>
        {loading && videos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <Spin size="large" />
            <Text style={{ 
              color: '#a0a0a0', 
              display: 'block', 
              marginTop: '16px',
              fontSize: '16px'
            }}>
              動画を読み込み中...
            </Text>
          </div>
        ) : videos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <Text style={{ 
              color: '#a0a0a0', 
              fontSize: '16px',
              display: 'block',
              marginBottom: '16px'
            }}>
              まだ動画がありません
            </Text>
            <Text style={{ 
              color: '#666', 
              fontSize: '14px'
            }}>
              動画を生成して履歴を確認しましょう
            </Text>
          </div>
        ) : (
          <div ref={scrollRef}>
            {videos.map((video, index) => (
              <VideoCard key={video.id} video={video} index={index} />
            ))}
            
            {/* 加载更多按钮 */}
            {hasMore && (
              <div style={{ textAlign: 'center', marginTop: '16px' }}>
                <Button
                  type="dashed"
                  loading={loading}
                  onClick={onLoadMore}
                  style={{
                    width: '100%',
                    border: '1px dashed rgba(255, 255, 255, 0.3)',
                    color: '#ffffff',
                    background: 'transparent',
                    borderRadius: '8px',
                    minHeight: '44px',
                    fontSize: '14px'
                  }}
                >
                  {loading ? '読み込み中...' : 'さらに読み込む'}
                </Button>
              </div>
            )}
            
            {/* 加载完成提示 */}
            {!hasMore && videos.length > 0 && (
              <div style={{ textAlign: 'center', marginTop: '16px' }}>
                <Text style={{ 
                  color: '#a0a0a0', 
                  fontSize: '14px'
                }}>
                  すべての動画を表示しました
                </Text>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 操作菜单 */}
      <Modal
        title="動画操作"
        open={showActions}
        onCancel={() => setShowActions(false)}
        footer={null}
        style={{ top: '50%' }}
      >
        {selectedVideo && (
          <div>
            <Text style={{ display: 'block', marginBottom: '16px', fontSize: '14px' }}>
              {selectedVideo.originalPrompt || 'プロンプトなし'}
            </Text>
            
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button
                type="primary"
                icon={<PlayCircleOutlined />}
                onClick={() => {
                  handlePlay(selectedVideo);
                  setShowActions(false);
                }}
                block
                style={{
                  background: 'linear-gradient(135deg, #e60033, #ff6b7a)',
                  borderColor: 'transparent',
                  minHeight: '44px'
                }}
              >
                再生
              </Button>
              
              <Button
                icon={<DownloadOutlined />}
                onClick={() => {
                  handleDownload(selectedVideo);
                  setShowActions(false);
                }}
                block
                style={{ minHeight: '44px' }}
              >
                ダウンロード
              </Button>
              
              <Button
                icon={<ShareAltOutlined />}
                onClick={() => {
                  if (navigator.share && selectedVideo.videoUrl) {
                    navigator.share({
                      title: '動画を共有',
                      url: selectedVideo.videoUrl
                    });
                  }
                  setShowActions(false);
                }}
                block
                style={{ minHeight: '44px' }}
              >
                共有
              </Button>
              
              {onDelete && (
                <Button
                  icon={<DeleteOutlined />}
                  onClick={() => {
                    onDelete(selectedVideo);
                    setShowActions(false);
                  }}
                  block
                  danger
                  style={{ minHeight: '44px' }}
                >
                  削除
                </Button>
              )}
            </Space>
          </div>
        )}
      </Modal>
    </MobileLayout>
  );
} 