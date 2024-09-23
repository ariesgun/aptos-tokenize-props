import { viewFunctions } from "econia-labs-sdk";
import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";

import { ECONIA_ADDR } from "@/env";
import { type ApiMarket } from "../../types/api";

import { BaseModal } from "../BaseModal";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { aptosClient } from "@/utils/aptosClient";
import { WrapUnwrapContent } from "../content/WrapUnwrapContent";

type Props = {
  selectedMarket: ApiMarket;
  allMarketData: ApiMarket[];
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
  isOpen,
  onClose,
}) => {
  const { account } = useWallet();

  const handleCheckRegisteredMarketAccount = useCallback(async () => {
    try {
      if (!account?.address) {
        return false;
      }
      const isRegistered = await viewFunctions.hasMarketAccountByMarketId(
        aptosClient(),
        ECONIA_ADDR,
        account.address,
        BigInt(selectedMarket?.market_id),
      );
      return isRegistered;
    } catch (error) {
      console.warn(error);
      return false;
    }
  }, [account?.address, aptosClient, selectedMarket]);

  const { data: isRegistered } = useQuery({
    queryKey: [
      "userCheckRegisteredMarketAccount",
      account?.address,
      selectedMarket?.market_id,
    ],
    queryFn: () => {
      return handleCheckRegisteredMarketAccount();
    },
  });

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
          isRegistered={!!isRegistered}
          selectedMarket={selectedMarket}
        />
      </BaseModal>
    </>
  );
};
