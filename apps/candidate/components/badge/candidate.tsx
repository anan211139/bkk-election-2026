import { IGovernor } from '../../types/business';
import candidataImg from '../../static/images/candidate.png';
interface PropType {
  candidate: IGovernor;
  fromHome?: boolean;
  clientSide?: boolean;
}

export function CandidateBadge({
  candidate,
}: PropType) {
  return (
    <div className="h-full max-w-[250px] w-[43vw] md:w-[15vw] relative">
      {candidate.disqualified && (
        <div className="absolute bg-[#333333b3] w-full h-full absolute typo-u4 flex justify-center items-center z-[5] text-white p-[10px]">
          {candidate.disqualified}
        </div>
      )}
      <div
        id={`c-${candidate.number}`}
        className={`h-full max-w-[250px] w-[43vw] md:w-[15vw] m-auto`}
      >
        {/* eslint-disable */}
        <div className="w-[43vw] h-[43vw] md:w-[15vw] md:h-[15vw] max-w-[250px] max-h-[250px] relative">
          <img
            src={candidate.profile_pic || candidataImg.src}
            alt="candidate"
            className={`w-[43vw] h-[43vw] md:w-[15vw] md:h-[15vw] max-w-[250px] max-h-[250px]`}
          />
        </div>
        <div className="flex text-white mt-[10px]">
          <div
            style={{
              color: candidate.color || '#666666',
            }}
            className="typo-h3 mr-[10px]"
          >
            <h3>{candidate.number}</h3>
          </div>
          <div className="flex flex-col justify-center">
            <p className="typo-h8">{candidate.name}</p>
            <p className="typo-b5 text-[#ffffff80]">{candidate.party}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
