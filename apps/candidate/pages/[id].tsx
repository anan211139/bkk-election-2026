import { GetStaticPaths, GetStaticProps } from 'next/types';
import { CandidatePage } from '../components/subPage/candidatePage';
import { IGovernor } from '../types/business';
import { fetchTheStandardElectionPosts, Post } from 'wordpress-api';
import { useEffect, useState } from 'react';
import { getNocoApi } from '../utils/nocoHandler';
import Metadata from '../components/metadata';
import { getCandidateOG } from '../utils/dict';
import { useRouter } from 'next/router';
import { fallbackGovernorList, getFallbackGovernor } from '../utils/fallbackData';

interface PropsType {
  candidate: IGovernor;
  isComingSoon: boolean;
}

export default function Governor({
  candidate,
  isComingSoon,
}: PropsType) {
  const [news, setNews] = useState<Post[]>([]);
  const [pageUrl, setPageUrl] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    if (candidate.disqualified) {
      router.push('/');
    }
    const getPort = async () => {
      try {
        const res = await fetchTheStandardElectionPosts({
          tag: candidate.name || '',
        });
        setNews(res);
      } catch (error: any) {}
    };
    getPort();
    setPageUrl(window.location.href);
  }, []);

  return (
    <div>
      <Metadata
        title={
          `${candidate.name} ผู้สมัคร ผู้ว่าฯ กทม. เบอร์ ${candidate.number}` ||
          'ข้อมูลผู้สมัคร'
        }
        description={
          candidate.name
            ? `ทำความรู้จัก ประวัติ นโยบาย ${candidate.name} ${candidate.party} ผู้สมัคร ผู้ว่าฯ กทม. เบอร์ ${candidate.number}`
            : undefined
        }
        imageSrc={getCandidateOG(candidate.number || 1)}
      />

      <CandidatePage
        isComingSoon={isComingSoon}
        governor={candidate}
        newsList={news}
        pageUrl={pageUrl}
      />
    </div>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const [res, errMsg] = await getNocoApi('governors');
  const data = errMsg ? fallbackGovernorList : (res.data.list as IGovernor[]);

  const govList = data.filter((gov) => !gov.disqualified);

  const paths = govList.map((gov) => {
    return {
      params: { id: gov.id?.toString() || '' },
    };
  });
  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps<PropsType> = async (context) => {
  const isComingSoon = process.env.COMING_SOON === 'true' ? true : false;
  const id = context.params?.id;
  const [candidateRes, errMsg] = await getNocoApi(`governors/${id}`);
  const candidate = errMsg
    ? getFallbackGovernor(id)
    : (candidateRes.data as IGovernor);
  if (!candidate) {
    return {
      redirect: {
        permanent: true,
        destination: '/',
      },
    };
  }
  if (candidate.disqualified) {
    return {
      redirect: {
        permanent: true,
        destination: '/',
      },
    };
  }
  return {
    props: {
      candidate,
      isComingSoon,
    },
  };
};
