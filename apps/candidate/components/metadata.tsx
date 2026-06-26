import { FunctionComponent } from 'react';
import Head from 'next/head';

interface MetadataProps {
  title?: string;
  imageSrc?: string;
  description?: string;
}

const DEFAULT_DESCRIPTION = `เช็คประวัติผู้สมัครผู้ว่าฯ กทม. และ ส.ก. เบอร์ นโยบาย และวิสัยทัศน์ กับการตอบคำถามว่าทำไม คนกรุงเทพฯ ต้องเลือกคุณเป็นผู้ว่าฯ กทม.`;
const BASE_URL = 'https://bangkokvote69.bangkok.go.th';
const DEFAULT_IMAGE = `${BASE_URL}/map/images/og.png`;

const Metadata: FunctionComponent<MetadataProps> = ({
  title,
  imageSrc,
  description = DEFAULT_DESCRIPTION,
}) => {
  const fullTitle = `${title} - Bangkok Vote 2569`;
  const image = normalizeImageUrl(imageSrc);

  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary_large_image" />
    </Head>
  );
};

function normalizeImageUrl(imageSrc?: string) {
  if (!imageSrc) return DEFAULT_IMAGE;
  if (/^https?:\/\//.test(imageSrc)) return imageSrc;
  return `${BASE_URL}${imageSrc.startsWith('/') ? '' : '/'}${imageSrc}`;
}

export default Metadata;
