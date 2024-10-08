import { entryFunctions } from "econia-labs-sdk";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { Button } from "../../Button";
import { NO_CUSTODIAN } from "@/constants";
import { useAptos } from "@/contexts/AptosContext";
import { ECONIA_ADDR } from "@/env";
import { type ApiMarket } from "../../types/api";
import { type MarketAccount, type MarketAccounts } from "../../types/econia";
import { makeMarketAccountId } from "@/utils/econia";
import { TypeTag } from "@/utils/TypeTag";

export const InitialContent: React.FC<{
  selectedMarket?: ApiMarket;
  selectMarket: () => void;
  depositWithdraw: () => void;
}> = ({ selectedMarket, selectMarket, depositWithdraw }) => {
  const { aptosClient, signAndSubmitTransaction, account } = useAptos();

  const { data: marketAccounts } = useQuery({
    queryKey: ["useMarketAccounts", account?.address],
    queryFn: async () => {
      if (!account?.address) return null;
      try {
        const resource = await aptosClient.getAccountResource<MarketAccounts>({
          accountAddress: account.address,
          resourceType: `${ECONIA_ADDR}::user::MarketAccounts`,
        });
        return resource;
      } catch (e) {
        if (e instanceof Error) {
          toast.error(e.message);
        } else {
          console.error(e);
        }
        return null;
      }
    },
  });
  const { data: marketAccount } = useQuery({
    queryKey: ["useMarketAccount", account?.address, selectedMarket?.market_id],
    enabled: !!marketAccounts,
    queryFn: async () => {
      if (!account?.address || !selectedMarket || !marketAccounts) return null;
      try {
        const marketAccount = await aptosClient.getTableItem<MarketAccount>({
          handle: marketAccounts.map.handle,
          data: {
            key_type: "u128",
            value_type: `${ECONIA_ADDR}::user::MarketAccount`,
            key: makeMarketAccountId(selectedMarket.market_id, NO_CUSTODIAN),
          },
        });
        return marketAccount;
      } catch (e) {
        if (e instanceof Error) {
          toast.error(e.message);
        } else {
          console.error(e);
        }
        return null;
      }
    },
  });

  return (
    <div className="flex w-full flex-col items-center gap-6 py-8">
      <p className="font-jost text-3xl font-bold">Select a Market</p>

      {selectedMarket && (
        <div
          className="flex cursor-pointer items-center gap-2"
          onClick={selectMarket}
        >
          <p className="whitespace-nowrap">{selectedMarket.name}</p>
          <ChevronDownIcon className="h-[24px] w-[24px] fill-white" />
        </div>
      )}
      {!marketAccounts || !marketAccount ? (
        <Button
          className="!font-bold"
          onClick={async () => {
            if (!selectedMarket?.base) return;
            const payload = entryFunctions.registerMarketAccount(
              ECONIA_ADDR,
              TypeTag.fromApiCoin(selectedMarket.base).toString(),
              TypeTag.fromApiCoin(selectedMarket.quote).toString(),
              BigInt(selectedMarket.market_id),
              BigInt(NO_CUSTODIAN),
            );
            await signAndSubmitTransaction({ data: payload });
          }}
          variant="primary"
        >
          Create Account
        </Button>
      ) : (
        <Button
          className="!font-bold"
          variant="primary"
          onClick={depositWithdraw}
        >
          Deposit / Withdraw
        </Button>
      )}
    </div>
  );
};
