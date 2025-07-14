'use client';

import React from 'react';
import { Button, Progress, Tag, Tooltip, Typography } from 'antd';
import { 
  PlayCircleOutlined, 
  DownloadOutlined, 
  CrownOutlined,
  ClockCircleOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { IVideo, IUser } from '@/types';

const { Text } = Typography;

interface VideoHistoryCardProps {
  video: IVideo;
  user: IUser;
  onPlay: (video: IVideo) => void;
  onDownload: (video: IVideo) => void;
  onUpgrade: () => void;
}

export default function VideoHistoryCard({ 
  video, 
  user, 
  onPlay, 
  onDownload, 
  onUpgrade 
}: VideoHistoryCardProps) {
  // 计算剩余天数
  const getRemainingDays = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diffTime = expires.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  // 计算进度百分比
  const getProgressPercentage = (expiresAt: string, createdAt: string) => {
    const now = new Date();
    const created = new Date(createdAt);
    const expires = new Date(expiresAt);
    const totalTime = expires.getTime() - created.getTime();
    const elapsedTime = now.getTime() - created.getTime();
    return Math.min(100, Math.max(0, (elapsedTime / totalTime) * 100));
  };

  const remainingDays = getRemainingDays(video.kieAiExpiresAt || video.localExpiresAt || '');
  const progressPercentage = getProgressPercentage(video.kieAiExpiresAt || video.localExpiresAt || '', video.createdAt);
  const isPremium = user.plan === 'premium';
  const isExpiring = remainingDays <= 3 && remainingDays > 0;
  const isExpired = remainingDays === 0;

  // 获取进度条颜色
  const getProgressColor = () => {
    if (isExpired) return '#ff4d4f';
    if (isExpiring) return '#fa8c16';
    if (isPremium) return '#fadb14';
    return '#1890ff';
  };

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.05)',
      borderRadius: '16px',
      padding: '24px',
      backdropFilter: 'blur(8px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      marginBottom: '20px',
      position: 'relative'
    }}>
      {/* 状态标签 */}
      <div style={{
        position: 'absolute',
        top: '16px',
        right: '16px',
        display: 'flex',
        gap: '8px',
        zIndex: 10
      }}>
        {isPremium && (
          <Tag 
            icon={<CrownOutlined />} 
            color="gold"
            style={{ 
              fontSize: '12px',
              padding: '4px 8px',
              border: 'none'
            }}
          >
            Premium
          </Tag>
        )}
        
        {isExpiring && !isExpired && (
          <Tag 
            icon={<WarningOutlined />} 
            color="orange"
            style={{ 
              fontSize: '12px',
              padding: '4px 8px',
              border: 'none'
            }}
          >
            期限切れ近し
          </Tag>
        )}
        
        {isExpired && (
          <Tag 
            color="red"
            style={{ 
              fontSize: '12px',
              padding: '4px 8px',
              border: 'none'
            }}
          >
            期限切れ
          </Tag>
        )}
      </div>

      {/* 视频预览区域 */}
      {video.videoUrl ? (
        <video
          src={video.videoUrl}
          controls
          style={{
            width: '100%',
            borderRadius: '12px',
            marginBottom: '16px'
          }}
        />
      ) : (
        <div style={{
          width: '100%',
          height: '300px',
          background: video.thumbnailUrl 
            ? `url(${video.thumbnailUrl}) center/cover` 
            : 'linear-gradient(135deg, rgba(230, 0, 51, 0.2), rgba(255, 107, 122, 0.2))',
          borderRadius: '12px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden'
        }} onClick={() => onPlay(video)}>
          {/* 播放按钮覆盖层 */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.3s ease'
          }}>
            <PlayCircleOutlined style={{ 
              fontSize: '64px', 
              color: '#ffffff',
              background: 'rgba(0, 0, 0, 0.6)',
              borderRadius: '50%',
              padding: '16px'
            }} />
          </div>
        </div>
      )}

      {/* 进度条 */}
      <Progress
        percent={progressPercentage}
        strokeColor={getProgressColor()}
        showInfo={false}
        size="small"
        style={{ marginBottom: '16px' }}
      />
      
      {/* 视频信息 */}
      <div style={{ marginBottom: '16px' }}>
        <Tooltip title={video.originalPrompt}>
          <Text style={{
            color: '#ffffff',
            fontSize: '16px',
            fontWeight: '500',
            display: 'block',
            marginBottom: '8px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {video.originalPrompt}
          </Text>
        </Tooltip>
        
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Text style={{
            color: '#a0a0a0',
            fontSize: '14px'
          }}>
            {new Date(video.createdAt).toLocaleDateString('ja-JP')}
          </Text>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            color: isExpired ? '#ff4d4f' : isExpiring ? '#fa8c16' : '#a0a0a0',
            fontSize: '14px'
          }}>
            <ClockCircleOutlined />
            {isExpired ? '期限切れ' : `${remainingDays}日残り`}
          </div>
        </div>
      </div>

      {/* 操作按钮 */}
      <div style={{ 
        display: 'flex', 
        gap: '12px',
        justifyContent: 'center'
      }}>
        <Button
          icon={<PlayCircleOutlined />}
          onClick={() => onPlay(video)}
          style={{ 
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#ffffff'
          }}
        >
          再生
        </Button>
        
        {video.status === 'completed' && video.videoUrl && (
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={() => onDownload(video)}
          >
            ダウンロード
          </Button>
        )}
      </div>

      {/* 升级提示 */}
      {!isPremium && isExpiring && (
        <div style={{
          marginTop: '16px',
          padding: '12px',
          background: 'rgba(250, 140, 22, 0.1)',
          borderRadius: '8px',
          border: '1px solid rgba(250, 140, 22, 0.3)',
          textAlign: 'center'
        }}>
          <Text style={{
            fontSize: '12px',
            color: '#fa8c16',
            marginBottom: '8px',
            display: 'block'
          }}>
            まもなく期限切れです
          </Text>
          <Button
            type="link"
            size="small"
            onClick={() => onUpgrade()}
            style={{ 
              fontSize: '12px',
              padding: 0,
              height: 'auto',
              color: '#fa8c16'
            }}
          >
            Premium にアップグレード →
          </Button>
        </div>
      )}
    </div>
  );
} 