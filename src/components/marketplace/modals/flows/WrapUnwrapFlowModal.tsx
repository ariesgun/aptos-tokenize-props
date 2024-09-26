import { type ApiMarket } from "../../types/api";

import { BaseModal } from "../BaseModal";
import { WrapUnwrapContent } from "../content/WrapUnwrapContent";

type Props = {
  selectedMarket: ApiMarket;
  allMarketData: ApiMarket[];
  tokenType: string;
  isOpen: boolean;
  onClose: () => void;
};

/**
 * Modal states:
 * 1. Market Account is registered, able to interact and data is available
 * 2. Market account is not registered, unable to interact and data is not available until account is created
 */

export const WrapUnwrapFlowModal: React.FC<Props> = ({
  selectedMarket,
  tokenType,
  isOpen,
  onClose,
}) => {

  return (
    <>
      <BaseModal
        className="!w-[457.093px] !p-0"
        isOpen={isOpen}
        onClose={onClose}
        showCloseButton={true}
        showBackButton={false}
      >
        <WrapUnwrapContent
          selectedMarket={selectedMarket}
          tokenType={tokenType}
        />
      </BaseModal>
    </>
  );
};
