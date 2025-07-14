'use client';

import React from 'react';
import { Typography, Card, Divider, BackTop, Button } from 'antd';
import { ArrowUpOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const { Title, Paragraph, Text } = Typography;

export default function PrivacyPage() {
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
            プライバシーポリシー
          </Title>
          <Text style={{ fontSize: '16px', color: '#666' }}>
            映像工房（EizoKobo）個人情報保護方針
          </Text>
          <Divider />
          <Text style={{ fontSize: '14px', color: '#999' }}>
            最終更新日：2025年7月15日
          </Text>
        </div>

        <Typography style={{ lineHeight: '1.8', fontSize: '15px' }}>
          <div style={{ marginBottom: '32px' }}>
            <Text style={{ fontSize: '16px', color: '#555' }}>
              株式会社PuzzleHunters（以下「当社」）は、映像工房（EizoKobo）サービス（以下「本サービス」）
              をご利用いただくお客様の個人情報の保護に努め、個人情報の保護に関する法律（以下「個人情報保護法」）
              その他の関連法令を遵守し、適切に取り扱います。
            </Text>
          </div>

          <Title level={2} style={{ color: '#1890ff', borderBottom: '2px solid #1890ff', paddingBottom: '8px' }}>
            1. 個人情報保護方針
          </Title>
          <Paragraph>
            当社は、以下の方針に基づき個人情報を保護いたします：
            <ul style={{ marginTop: '16px', paddingLeft: '20px' }}>
              <li>個人情報保護法その他の関連法令を遵守します</li>
              <li>個人情報の取得、利用、提供については、利用目的を明確にし、適切な範囲で行います</li>
              <li>個人情報の安全管理のため、必要かつ適切な措置を講じます</li>
              <li>個人情報の取扱いに関する内部規程を整備し、継続的に改善します</li>
            </ul>
          </Paragraph>

          <Title level={2} style={{ color: '#1890ff', borderBottom: '2px solid #1890ff', paddingBottom: '8px' }}>
            2. 個人情報の定義
          </Title>
          <Paragraph>
            本ポリシーにおける「個人情報」とは、個人情報保護法第2条第1項に規定する個人情報、
            すなわち生存する個人に関する情報であって、当該情報に含まれる氏名、生年月日その他の記述等により
            特定の個人を識別することができるもの（他の情報と容易に照合することができ、
            それにより特定の個人を識別することができることとなるものを含む）をいいます。
          </Paragraph>

          <Title level={2} style={{ color: '#1890ff', borderBottom: '2px solid #1890ff', paddingBottom: '8px' }}>
            3. 収集する個人情報と利用目的
          </Title>
          <Title level={3} style={{ color: '#1890ff', marginBottom: '16px' }}>
            AI動画生成サービス特有の情報処理について
          </Title>
          <Paragraph style={{ marginBottom: '16px' }}>
            当社のAI動画生成サービスでは、以下の情報を処理いたします：
          </Paragraph>
          <ul style={{ paddingLeft: '20px', marginBottom: '16px' }}>
            <li><strong>画像データ：</strong>アップロードされた画像は動画生成の素材として使用され、AIモデルの学習には使用されません。</li>
            <li><strong>テキストプロンプト：</strong>動画生成の指示として使用され、サービス品質向上のため分析される場合があります。</li>
            <li><strong>生成された動画：</strong>利用者のアカウントに関連付けて保存され、14日間後に自動削除されます。</li>
            <li><strong>利用パターン：</strong>サービス改善とAIモデル最適化のため、匿名化された利用統計を収集します。</li>
            <li><strong>エラーログ：</strong>技術的問題の解決とサービス安定性向上のため収集・分析します。</li>
          </ul>
          <Paragraph style={{ fontSize: '14px', color: '#666', marginBottom: '32px' }}>
            ※ 当社は利用者の同意なく、アップロードされたコンテンツを第三者AIモデルの訓練データとして提供することはありません。
          </Paragraph>

          <Title level={2} style={{ color: '#1890ff', borderBottom: '2px solid #1890ff', paddingBottom: '8px' }}>
            4. AIサービス特有の情報処理
          </Title>
          <Paragraph style={{ backgroundColor: '#fff2e8', padding: '20px', borderRadius: '8px', border: '1px solid #ffa940' }}>
            <div style={{ color: '#333' }}>
              <strong style={{ color: '#d46b08' }}>【重要】AI処理に関する個人情報の取扱い</strong><br/>
              1. <strong style={{ color: '#333' }}>アップロード画像の処理：</strong>利用者がアップロードした画像は、AI動画生成のためにのみ使用され、
              生成処理完了後は当社サーバーから削除されます。<br/>
              2. <strong style={{ color: '#333' }}>生成コンテンツ：</strong>AI により生成されたコンテンツには個人を特定する情報は含まれませんが、
              偶然実在する人物に類似する場合があります。<br/>
              3. <strong style={{ color: '#333' }}>学習データ利用：</strong>当社は、利用者のコンテンツをAIモデルの学習データとして使用いたしません。<br/>
              4. <strong style={{ color: '#333' }}>プロンプトデータ：</strong>利用者が入力したテキストプロンプトは、サービス改善のため統計的に分析される場合がありますが、
              個人を特定できない形で処理されます。
            </div>
          </Paragraph>

          <Title level={2} style={{ color: '#1890ff', borderBottom: '2px solid #1890ff', paddingBottom: '8px' }}>
            5. 個人情報の第三者提供
          </Title>
          <Paragraph>
            当社は、以下の場合を除き、お客様の個人情報を第三者に提供いたしません：
            <ul style={{ marginTop: '16px', paddingLeft: '20px' }}>
              <li>お客様の同意がある場合</li>
              <li>法令に基づく場合</li>
              <li>人の生命、身体または財産の保護のために必要がある場合であって、本人の同意を得ることが困難である場合</li>
              <li>公衆衛生の向上または児童の健全な育成の推進のために特に必要がある場合であって、本人の同意を得ることが困難である場合</li>
              <li>国の機関もしくは地方公共団体またはその委託を受けた者が法令の定める事務を遂行することに対して協力する必要がある場合</li>
            </ul>
          </Paragraph>

          <Title level={2} style={{ color: '#1890ff', borderBottom: '2px solid #1890ff', paddingBottom: '8px' }}>
            6. 業務委託先への情報提供
          </Title>
          <Paragraph>
            当社は、業務の遂行上、以下の業務委託先に個人情報を提供する場合があります：
            <ul style={{ marginTop: '16px', paddingLeft: '20px' }}>
              <li><strong>決済処理業者：</strong>Stripe Inc.（米国）- 決済処理のため</li>
              <li><strong>AIサービスプロバイダー：</strong>Google LLC（米国）- 動画生成処理のため</li>
            </ul>
          </Paragraph>

          <Title level={2} style={{ color: '#1890ff', borderBottom: '2px solid #1890ff', paddingBottom: '8px' }}>
            7. 個人情報の保存期間
          </Title>
          <Paragraph>
            <ul style={{ marginTop: '16px', paddingLeft: '20px' }}>
              <li><strong>アカウント情報：</strong>アカウント削除まで</li>
              <li><strong>アップロード画像：</strong>動画生成処理完了後24時間以内に削除</li>
              <li><strong>生成動画：</strong>14日間保存（Premium Planで延長可能、利用者による削除も可能）</li>
              <li><strong>利用履歴：</strong>最大2年間</li>
              <li><strong>決済情報：</strong>法令で定められた期間</li>
            </ul>
          </Paragraph>

          <Title level={2} style={{ color: '#1890ff', borderBottom: '2px solid #1890ff', paddingBottom: '8px' }}>
            8. お客様の権利
          </Title>
          <Paragraph>
            お客様は、ご自身の個人情報について以下の権利を有します：
            <ul style={{ marginTop: '16px', paddingLeft: '20px' }}>
              <li><strong>削除請求：</strong>個人情報の削除を求める権利</li>
              <li><strong>利用停止請求：</strong>個人情報の利用停止を求める権利</li>
            </ul>
            これらの権利行使をご希望の場合は、アカウント設定から直接操作いただくか、カスタマーサポートまでお問い合わせください。
          </Paragraph>

          <Title level={2} style={{ color: '#1890ff', borderBottom: '2px solid #1890ff', paddingBottom: '8px' }}>
            9. セキュリティ措置
          </Title>
          <Paragraph>
            当社は、個人情報の安全管理のため、以下の措置を講じています：
            <ul style={{ marginTop: '16px', paddingLeft: '20px' }}>
              <li>SSL/TLS暗号化通信の実装</li>
              <li>アクセス制御・認証システムの導入</li>
              <li>定期的なセキュリティ監査の実施</li>
              <li>従業員への教育・研修の実施</li>
              <li>情報システムの監視・ログ管理</li>
            </ul>
          </Paragraph>

          <Title level={2} style={{ color: '#1890ff', borderBottom: '2px solid #1890ff', paddingBottom: '8px' }}>
            10. クッキー（Cookie）の使用
          </Title>
          <Paragraph>
            本サービスでは、サービス向上のためクッキーを使用しています。クッキーの無効化は
            ブラウザ設定で可能ですが、一部機能が制限される場合があります。
          </Paragraph>

          <Title level={2} style={{ color: '#1890ff', borderBottom: '2px solid #1890ff', paddingBottom: '8px' }}>
            11. 未成年者の個人情報
          </Title>
          <Paragraph>
            当社は、18歳未満の方については親権者の同意なしに個人情報を収集いたしません。
            未成年者の方は、必ず親権者の同意を得てからご利用ください。
          </Paragraph>

          <Title level={2} style={{ color: '#1890ff', borderBottom: '2px solid #1890ff', paddingBottom: '8px' }}>
            12. プライバシーポリシーの変更
          </Title>
          <Paragraph>
            当社は、法令の改正やサービスの変更に伴い、本ポリシーを変更する場合があります。
            重要な変更については、本サービス上で事前に通知いたします。
          </Paragraph>

          <Title level={2} style={{ color: '#1890ff', borderBottom: '2px solid #1890ff', paddingBottom: '8px' }}>
            13. 管轄法・準拠法
          </Title>
          <Paragraph>
            本ポリシーは日本法に準拠し、個人情報に関する紛争については東京地方裁判所を専属的合意管轄裁判所とします。
          </Paragraph>

          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <Link href="/terms" style={{ color: '#1890ff', marginRight: '20px' }}>
              利用規約を見る
            </Link>
            <Link href="/" style={{ color: '#1890ff' }}>
              サービストップへ戻る
            </Link>
          </div>
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