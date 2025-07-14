'use client';

import React from 'react';
import { Typography, Card, Divider, BackTop, Button } from 'antd';
import { ArrowUpOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const { Title, Paragraph, Text } = Typography;

export default function TermsPage() {
  const router = useRouter();

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto', backgroundColor: '#f5f5f5' }}>
      <Card style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
        {/* 返回按钮 */}
        <div style={{ marginBottom: '20px', textAlign: 'left' }}>
          <Button 
            type="primary" 
            icon={<ArrowLeftOutlined style={{ color: '#fff' }} />} 
            onClick={() => router.back()}
            style={{ 
              borderRadius: '8px',
              backgroundColor: '#1890ff',
              borderColor: '#1890ff',
              color: '#fff',
              fontSize: '14px',
              height: '36px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <span style={{ color: '#fff', marginLeft: '4px' }}>戻る</span>
          </Button>
        </div>
        
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <Title level={1} style={{ color: '#1890ff', fontSize: '36px', marginBottom: '16px' }}>
            利用規約
          </Title>
          <Text style={{ fontSize: '16px', color: '#666' }}>
            映像工房（EizoKobo）サービス利用規約
          </Text>
          <Divider />
          <Text style={{ fontSize: '14px', color: '#999' }}>
            最終更新日：2025年1月15日
          </Text>
        </div>

        <Typography style={{ lineHeight: '1.8', fontSize: '15px' }}>
          <div style={{ marginBottom: '32px' }}>
            <Text style={{ fontSize: '16px', color: '#555' }}>
              この利用規約（以下「本規約」）は、株式会社PuzzleHunters（以下「当社」）が提供する映像工房（EizoKobo）
              サービス（以下「本サービス」）の利用条件を定めるものです。本サービスをご利用になる前に、必ずお読みください。
            </Text>
          </div>

          <Title level={2} style={{ color: '#1890ff', borderBottom: '2px solid #1890ff', paddingBottom: '8px' }}>
            第1条（定義）
          </Title>
          <Paragraph>
            本規約において使用する用語の定義は以下のとおりです：
            <ul style={{ marginTop: '16px', paddingLeft: '20px' }}>
              <li><strong>当社：</strong>株式会社PuzzleHunters</li>
              <li><strong>本サービス：</strong>当社が提供する映像工房（EizoKobo）AI動画生成サービス</li>
              <li><strong>利用者：</strong>本サービスを利用する個人または法人</li>
              <li><strong>生成コンテンツ：</strong>本サービスのAI機能により生成された動画、画像、音声等のコンテンツ</li>
              <li><strong>投稿コンテンツ：</strong>利用者が本サービスにアップロードまたは入力したコンテンツ</li>
            </ul>
          </Paragraph>

          <Title level={2} style={{ color: '#1890ff', borderBottom: '2px solid #1890ff', paddingBottom: '8px' }}>
            第2条（本規約の適用）
          </Title>
          <Paragraph>
            1. 本規約は、利用者と当社との間の本サービスの利用に関わる一切の関係に適用されます。<br/>
            2. 利用者は、本サービスの利用により、本規約に同意したものとみなされます。<br/>
            3. 未成年者が本サービスを利用する場合は、親権者の同意が必要です。
          </Paragraph>

          <Title level={2} style={{ color: '#1890ff', borderBottom: '2px solid #1890ff', paddingBottom: '8px' }}>
            第3条（アカウント登録）
          </Title>
          <Paragraph>
            1. 本サービスの利用には、当社の定める方法によるアカウント登録が必要です。<br/>
            2. 利用者は、正確かつ最新の情報を登録し、常に最新の状態に保つものとします。<br/>
            3. パスワード等のアカウント情報の管理は利用者の責任において行うものとします。
          </Paragraph>

          <Title level={2} style={{ color: '#1890ff', borderBottom: '2px solid #1890ff', paddingBottom: '8px' }}>
            第4条（AI生成コンテンツに関する特別規定）
          </Title>
          <Paragraph style={{ backgroundColor: '#fff2e8', padding: '20px', borderRadius: '8px', border: '1px solid #ffa940' }}>
            <div style={{ color: '#333' }}>
              <strong style={{ color: '#d46b08' }}>【重要】AI生成コンテンツの使用に関する注意事項</strong><br/>
              1. <strong style={{ color: '#333' }}>生成コンテンツの性質：</strong>本サービスで生成されるコンテンツは人工知能により自動生成されたものであり、実在する人物、場所、出来事等を意図して再現したものではありません。<br/>
              2. <strong style={{ color: '#333' }}>肖像権・プライバシー権：</strong>生成コンテンツが偶然実在する人物に類似した場合でも、当社は一切の責任を負いません。利用者は生成コンテンツの使用前に、第三者の肖像権、プライバシー権等の侵害がないことを確認する責任を負います。<br/>
              3. <strong style={{ color: '#333' }}>商用利用の制限：</strong>生成コンテンツを商用目的で使用する場合、利用者は事前に適切な権利処理を行い、第三者の権利を侵害しないよう注意義務を負います。<br/>
              4. <strong style={{ color: '#333' }}>AIコンテンツ表示義務：</strong>生成コンテンツを公開・配布する際は、AI生成であることを適切に表示する必要があります。
            </div>
          </Paragraph>

          <Title level={2} style={{ color: '#1890ff', borderBottom: '2px solid #1890ff', paddingBottom: '8px' }}>
            第5条（禁止事項）
          </Title>
          <Paragraph>
            利用者は、以下の行為を行ってはなりません：
            <ul style={{ marginTop: '16px', paddingLeft: '20px' }}>
              <li>法令に違反する行為</li>
              <li>公序良俗に反する行為</li>
              <li>第三者の著作権、肖像権、プライバシー権その他の権利を侵害する行為</li>
              <li>実在する人物を無断で模倣した動画の生成・配布</li>
              <li>偽情報（ディープフェイク等）の生成・拡散</li>
              <li>暴力的、差別的、誹謗中傷的なコンテンツの生成</li>
              <li>成人向けコンテンツの生成</li>
              <li>政治的プロパガンダや選挙活動に関連するコンテンツの生成</li>
              <li>医療、法律、金融に関する専門的助言を含むコンテンツの生成</li>
              <li>当社のサービスを悪用した営業妨害行為</li>
            </ul>
          </Paragraph>

          <Title level={2} style={{ color: '#1890ff', borderBottom: '2px solid #1890ff', paddingBottom: '8px' }}>
            第6条（免責事項）
          </Title>
          <Paragraph style={{ backgroundColor: '#f6ffed', padding: '20px', borderRadius: '8px', border: '1px solid #52c41a' }}>
            <div style={{ color: '#333' }}>
              <strong style={{ color: '#389e0d' }}>【免責条項】</strong><br/>
              1. <strong style={{ color: '#333' }}>AI生成コンテンツの品質：</strong>当社は生成コンテンツの精度、品質、完全性について一切保証いたしません。<br/>
              2. <strong style={{ color: '#333' }}>権利侵害に関する免責：</strong>生成コンテンツが第三者の権利を侵害した場合、当社は一切の責任を負いません。利用者が単独で責任を負うものとします。<br/>
              3. <strong style={{ color: '#333' }}>損害に関する免責：</strong>本サービスの利用により利用者に生じた損害について、当社は故意または重大な過失がある場合を除き、一切の責任を負いません。<br/>
              4. <strong style={{ color: '#333' }}>サービス中断：</strong>システムメンテナンス、障害等によるサービス中断について、当社は責任を負いません。
            </div>
          </Paragraph>

          <Title level={2} style={{ color: '#1890ff', borderBottom: '2px solid #1890ff', paddingBottom: '8px' }}>
            第7条（知的財産権）
          </Title>
          <Paragraph>
            1. 本サービス自体の知的財産権は当社に帰属します。<br/>
            2. 利用者が作成した生成コンテンツの権利は利用者に帰属しますが、当社は本サービスの改善等のために生成コンテンツを利用する権利を有します。<br/>
            3. 利用者は投稿コンテンツについて適法な権利を有することを保証するものとします。
          </Paragraph>

          <Title level={2} style={{ color: '#1890ff', borderBottom: '2px solid #1890ff', paddingBottom: '8px' }}>
            第8条（料金・支払い）
          </Title>
          <Paragraph>
            1. 本サービスの料金は当社が別途定める料金表に従います。<br/>
            2. 料金の支払いは事前決済とし、Stripe決済システムを通じて処理されます。<br/>
            3. 一度お支払いいただいた料金の返金は、原則として行いません。
          </Paragraph>

          <Title level={2} style={{ color: '#1890ff', borderBottom: '2px solid #1890ff', paddingBottom: '8px' }}>
            第9条（個人情報の取扱い）
          </Title>
          <Paragraph>
            当社は、利用者の個人情報を<Link href="/privacy" style={{ color: '#1890ff' }}>プライバシーポリシー</Link>
            に従って適切に取り扱います。
          </Paragraph>

          <Title level={2} style={{ color: '#1890ff', borderBottom: '2px solid #1890ff', paddingBottom: '8px' }}>
            第10条（準拠法・管轄裁判所）
          </Title>
          <Paragraph>
            1. 本規約は日本法に準拠して解釈されます。<br/>
            2. 本サービスに関する紛争については、東京地方裁判所を第一審の専属的合意管轄裁判所とします。
          </Paragraph>

          <Title level={2} style={{ color: '#1890ff', borderBottom: '2px solid #1890ff', paddingBottom: '8px' }}>
            第11条（規約の変更）
          </Title>
          <Paragraph>
            当社は、必要に応じて本規約を変更することができます。変更後の規約は、本サービス上での掲載により効力を生じるものとします。
          </Paragraph>
        </Typography>
      </Card>

      <BackTop>
        <div style={{
          height: 40,
          width: 40,
          lineHeight: '40px',
          borderRadius: 4,
          backgroundColor: '#1890ff',
          color: '#fff',
          textAlign: 'center',
          fontSize: 14,
        }}>
          <ArrowUpOutlined />
        </div>
      </BackTop>
    </div>
  );
} 