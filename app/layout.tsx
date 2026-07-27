import type { Metadata, Viewport } from 'next';
import { site } from '@/lib/content';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: site.title,
  description: site.description,
  verification: { other: { 'naver-site-verification': site.naverVerification } },
  openGraph: {
    type: 'website',
    title: site.title,
    description: site.description,
    url: site.url,
    siteName: site.siteName,
  },
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        {/*
          Pretendard 동적 서브셋(variable).
          원본은 componentDidMount에서 static 전체 CSS를 JS로 주입 → FOUT + 전체 웨이트 로딩.
          동적 서브셋은 실제 쓰인 글자가 속한 subset만 받아서 훨씬 가볍고, JS 없이 즉시 적용됨.
        */}
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard-dynamic-subset.css"
        />
      </head>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: '루네레인',
              alternateName: ['LUNAELANE', '루네레인 주식회사', 'SOHA'],
              url: site.url,
              logo: `${site.url}opengraph-image.png`,
              email: site.contactEmail,
              description: site.description,
            }),
          }}
        />
        {children}
      </body>
    </html>
  );
}
