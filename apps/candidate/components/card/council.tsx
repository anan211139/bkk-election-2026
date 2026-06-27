import Link from 'next/link';
import searchIcon from '../../static/icons/search.svg';
import { ICouncil } from '../../types/business';

interface PropsType {
  council: ICouncil;
}

export function Council(props: PropsType) {
  const council = props.council;

  const specialWord = (district: string) => {
    if (district === 'ป้อมปราบศัตรูพ่าย') {
      return `ป้อมปราบ\nศัตรูพ่าย`;
    }
    return district;
  };

  return (
    <div className="relative w-full max-w-[288px] md:max-w-[1024px]  mb-[40px]">
      {council.disqualified && (
        <div className="absolute bg-white bg-opacity-80 w-full h-full typo-b4 flex justify-center items-center z-[5] p-[10px]">
          <p className="bg-white rounded p-1 max-w-lg">
            {council.disqualified}
          </p>
        </div>
      )}
      <div className="flex border-t border-[#9d9d9d] w-full max-w-[288px] md:max-w-[1024px]">
        <div className=" justify-center w-[100px] md:w-[150px] h-[100px] md:h-[150px] bg-[#333333] text-white flex flex-col">
          <h2 className="typo-h1">{council.number}</h2>
          <h5 className="typo-h6 whitespace-pre-wrap">
            {specialWord(council.district)}
          </h5>
        </div>
        <div className="flex flex-col md:flex-row flex-1">
          <img
            className="w-[60px] h-[60px] md:w-[80px] md:h-[80px] rounded-[100px] object-cover object-top mt-[20px] ml-[20px]"
            src={council.image}
            alt={`council-${council.district}-${council.number}`}
          />
          <div className="flex flex-col ml-[20px] text-left flex-1">
            <p className="typo-h3 mt-[20px] mb-[10px]">{council.name}</p>
            <p className="typo-b3">{council.party}</p>
  
          </div>
        </div>
      </div>
    </div>
  );
}
