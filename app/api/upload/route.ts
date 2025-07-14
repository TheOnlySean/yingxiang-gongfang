import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '../../../lib/auth';
import { put } from '@vercel/blob';
import { IApiResponse, IImageUploadResponse } from '@/types';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function POST(request: NextRequest) {
  try {
    let user = null;
    
    // 使用真实认证
    const authResult = await authenticate(request);
    user = authResult.user;
    
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: authResult.error || 'Authentication required'
          }
        } as IApiResponse,
        { status: 401 }
      );
    }

    // 解析表单数据
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    
    if (!files || files.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'No files provided'
          }
        } as IApiResponse,
        { status: 400 }
      );
    }

    // 验证文件类型和大小
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const uploadResults: IImageUploadResponse[] = [];

    for (const file of files) {
      // 验证文件类型
      if (!allowedTypes.includes(file.type)) {
        uploadResults.push({
          success: false,
          error: `Invalid file type: ${file.type}`
        });
        continue;
      }

      // 验证文件大小
      if (file.size > maxFileSize) {
        uploadResults.push({
          success: false,
          error: `File too large: ${file.name} (${file.size} bytes)`
        });
        continue;
      }

      try {
        const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
        let imageUrl: string;

        // 优先使用 Vercel Blob 存储
        if (blobToken && blobToken !== 'your-blob-token') {
          // 使用 Vercel Blob 存储
          console.log('Using Vercel Blob storage for:', file.name);
          
          // 生成唯一文件名
          const timestamp = Date.now();
          const fileExtension = file.name.split('.').pop();
          const uniqueFileName = `${timestamp}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
          
          const blob = await put(uniqueFileName, file, {
            access: 'public',
            token: blobToken
          });
          
          imageUrl = blob.url;
          console.log('Vercel Blob upload successful:', imageUrl);
        } else {
          // 使用本地存储作为备选方案
          console.log('Using local storage fallback for:', file.name);
          console.warn('建议配置 BLOB_READ_WRITE_TOKEN 以使用 Vercel Blob 存储');
          
          // 创建上传目录
          const uploadDir = join(process.cwd(), 'public', 'uploads');
          try {
            await mkdir(uploadDir, { recursive: true });
          } catch (mkdirError) {
            // 目录已存在，忽略错误
          }

          // 生成唯一文件名
          const timestamp = Date.now();
          const fileExtension = file.name.split('.').pop();
          const fileName = `${timestamp}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
          const filePath = join(uploadDir, fileName);

          // 将文件内容写入本地
          const bytes = await file.arrayBuffer();
          const buffer = Buffer.from(bytes);
          await writeFile(filePath, buffer);

          // 生成可访问的URL
          imageUrl = `/uploads/${fileName}`;
          console.log('Local storage upload successful:', imageUrl);
        }

        uploadResults.push({
          success: true,
          imageUrl: imageUrl
        });

        console.log(`File uploaded successfully: ${file.name} -> ${imageUrl}`);
      } catch (uploadError) {
        console.error('Upload error for file:', file.name, uploadError);
        uploadResults.push({
          success: false,
          error: `Upload failed: ${file.name} - ${uploadError instanceof Error ? uploadError.message : String(uploadError)}`
        });
      }
    }

    // 返回上传结果
    return NextResponse.json(
      {
        success: true,
        data: {
          uploads: uploadResults,
          totalCount: files.length,
          successCount: uploadResults.filter(r => r.success).length
        }
      } as IApiResponse,
      { status: 200 }
    );

  } catch (error) {
    console.error('Upload API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Internal server error'
        }
      } as IApiResponse,
      { status: 500 }
    );
  }
}

// 处理OPTIONS请求（CORS预检）
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
} 