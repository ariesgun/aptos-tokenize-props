import { entryFunctions } from "econia-labs-sdk";
import { Menu, MenuButton, MenuItem, MenuItems, Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import React, { useMemo, useState } from "react";

import { NO_CUSTODIAN } from "@/constants";
import { useAptos } from "@/contexts/AptosContext";
import { ECONIA_ADDR } from "@/env";
import { useCoinBalance } from "@/hooks/useCoinBalance";
import { useMarketAccountBalance } from "@/hooks/useMarketAccountBalance";
import { type ApiCoin, type ApiMarket } from "../../types/api";
import { toRawCoinAmount } from "@/utils/coin";
import { TypeTag } from "@/utils/TypeTag";
import { Input } from "../../Input";
import { Button } from "../../Button";
import { useGetFungibleAmountByOwner, useGetFungibleAssetBalance } from "@/hooks/useGetFungibleAmount";
import { aptosClient } from "@/utils/aptosClient";
import { wrapToken } from "@/entry-functions/wrap_token";
import { unWrapToken } from "@/entry-functions/unwrap_token";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { AccountAddress } from "@aptos-labs/ts-sdk";

const SelectCoinInput: React.FC<{
  coin: ApiCoin;
  fa: any;
  startAdornment?: string;
  mode: string;
  onSelectCoin: (coin: boolean) => void;
}> = ({ coin, fa, startAdornment, mode, onSelectCoin }) => {
  const { coinListClient } = useAptos();

  const DEFAULT_TOKEN_ICON = "/tokenImages/default.svg";

  const assetIcon = mode === "unwrap"
    ? coinListClient.getCoinInfoByFullName(
      TypeTag.fromString(
        `${coin.account_address}::${coin.module_name}::${coin.struct_name}`,
      ).toString(),
    )?.logo_url || DEFAULT_TOKEN_ICON
    : DEFAULT_TOKEN_ICON;

  console.log("FA", fa)
  return (
    <div className="flex h-10 w-full items-center border border-neutral-600 p-4 pr-0">
      <Menu as="div" className="relative inline-block w-full text-left">
        <MenuButton className="flex w-full items-center justify-between pr-4">
          <p className="font-roboto-mono text-sm font-medium uppercase">
            {startAdornment}
          </p>
          <div className="flex cursor-pointer items-center gap-0">
            <Image
              width={16}
              height={16}
              src={assetIcon}
              alt="token"
              className="mr-[6.75px] h-4 w-4"
            />
            <p className="mr-2 whitespace-nowrap font-roboto-mono text-sm font-medium">
              {mode === "unwrap" ? coin.symbol : fa?.metadata.symbol}
            </p>
            <ChevronDownIcon className="h-[18.06px] w-[17px]" />
          </div>
        </MenuButton>
        <MenuItems className="absolute right-[-1px] top-[calc(100%+16px)]  border border-neutral-600 bg-neutral-800 ring-1 ring-black ring-opacity-5 focus:outline-none">
          {
            mode === "wrap" ?
              <MenuItem
                as="div"
                key={fa?.metadata.symbol}
                onClick={() => onSelectCoin(false)}
                className="w-[97px] cursor-pointer items-center px-8 py-2 text-left font-roboto-mono hover:bg-neutral-600/30"
              >
                <p className="whitespace-nowrap text-sm leading-[18px] text-white">
                  {fa?.metadata.symbol}
                </p>
              </MenuItem>
              :
              <MenuItem
                as="div"
                key={coin.account_address + coin.module_name + coin.struct_name}
                onClick={() => onSelectCoin(true)}
                className="w-[97px] cursor-pointer items-center px-8 py-2 text-left font-roboto-mono hover:bg-neutral-600/30"
              >
                <p className="whitespace-nowrap text-sm leading-[18px] text-white">
                  {coin.symbol}
                </p>
              </MenuItem>
          }
        </MenuItems>
      </Menu>
    </div>
  );
};

const WrapUnwrapForm: React.FC<{
  selectedMarket: ApiMarket;
  token_type: string;
  mode: "wrap" | "unwrap";
}> = ({ selectedMarket, mode, token_type }) => {
  const { account, signAndSubmitTransaction } = useWallet();
  const queryClient = useQueryClient();

  const { data: fungibleAssetBalance } = useGetFungibleAssetBalance(
    account?.address ?? "",
    token_type
  );

  const [selectedCoin, setSelectedCoin] = useState<boolean>(false);

  const { data: marketAccountBalance } = useMarketAccountBalance(
    account?.address,
    selectedMarket.market_id,
    selectedMarket.base,
  );

  const [amount, setAmount] = useState<string>("");
  const { data: balance } = useCoinBalance(
    TypeTag.fromApiCoin(selectedMarket.base),
    account?.address,
  );

  const disabledReason = useMemo(() => {
    return balance == null || fungibleAssetBalance == null
      ? "Loading balance..."
      : (mode === "wrap" && parseFloat(amount) > fungibleAssetBalance?.amount_v2) ||
        (mode === "unwrap" && parseFloat(amount) > balance)
        ? "Not enough coins"
        : null;
  }, [amount, balance, fungibleAssetBalance, mode]);

  const handleSubmit = async () => {
    if (!Number(amount)) {
      return "";
    }
    const payload =
      mode === "wrap"
        ? wrapToken({
          coin_type: TypeTag.fromApiCoin(selectedMarket.base).toString(),
          fa_metadata: token_type,
          amount: parseFloat(amount),
        })
        : unWrapToken({
          coin_type: TypeTag.fromApiCoin(selectedMarket.base).toString(),
          amount: parseFloat(amount),
        })

    const response = await signAndSubmitTransaction(payload);
    await aptosClient().waitForTransaction({ transactionHash: response.hash })

    await queryClient.invalidateQueries({
      queryKey: [
        "useCoinBalance",
        TypeTag.fromApiCoin(selectedMarket.base).toString(),
        account ? AccountAddress.from(account?.address) : null,
      ],
    });
    await queryClient.invalidateQueries({
      queryKey: [
        "fungible-balance",
        account?.address ?? ""
      ],
    });
  };

  return (
    <>
      <div className="w-full">
        <SelectCoinInput
          coin={selectedMarket?.base}
          fa={fungibleAssetBalance}
          mode={mode}
          onSelectCoin={setSelectedCoin}
          startAdornment={mode === "wrap" ? "Wrap Coin" : "Unwrap Coin"}
        />
        <div className="mt-3">
          <Input
            value={amount}
            onChange={setAmount}
            placeholder="0.00"
            startAdornment="AMOUNT"
            type="number"
            autoFocus={true}
          />
        </div>
        <div className="mt-[17.51px] flex w-full justify-between">
          <p className="font-roboto-mono text-[13px] font-light uppercase tracking-[0.26px]">
            Wrapped Coin Amount
          </p>
          <p className="font-roboto-mono text-[13px] font-light uppercase tracking-[0.26px]">
            {balance ?? "--"} {selectedMarket.base.symbol}
          </p>
        </div>
        <div className="mt-3 flex w-full justify-between">
          <p className="font-roboto-mono text-[13px] font-light uppercase tracking-[0.26px]">
            Fungible Token Amount
          </p>
          <p className="font-roboto-mono text-[13px] font-light uppercase tracking-[0.26px]">
            {fungibleAssetBalance?.amount_v2 ?? "--"} {fungibleAssetBalance?.metadata?.symbol}
          </p>
        </div>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabledReason={disabledReason}
          className="mt-[15px] w-full pb-[13px] pt-[15px] text-sm uppercase !leading-3"
          disabled={Number(amount) === 0}
        >
          {Number(amount) === 0
            ? "Enter amount"
            : mode === "wrap"
              ? "Wrap"
              : "Unwrap"}
        </Button>
      </div>
    </>
  );
};

export const WrapUnwrapContent: React.FC<{
  selectedMarket: ApiMarket;
  token_type: string;
  isRegistered: boolean;
}> = ({ selectedMarket, isRegistered, token_type = "0xd9e99bdb67eb7af070cbfb89ae1bec20198b3fbd6d254d796a13bca20389faed" }) => {
  return (
    <div className="px-[34.79px] pb-[33px] pt-[37px]">
      <h2 className="font-jost text-xl font-bold">
        {`Wrap / Unwrap ${selectedMarket.base.symbol}`}
      </h2>
      <TabGroup>
        <TabList className="mt-5 w-full">
          <Tab className="w-1/2 border-b border-b-neutral-600 py-2 font-jost font-bold outline-none data-[selected]:bg-black data-[selected]:text-white">
            Wrap
          </Tab>
          <Tab className="w-1/2 border-b border-b-neutral-600 py-2 font-jost font-bold outline-none data-[selected]:bg-black data-[selected]:text-white">
            Unwrap
          </Tab>
        </TabList>
        <TabPanels className="mt-7 w-full">
          <TabPanel>
            <WrapUnwrapForm
              selectedMarket={selectedMarket}
              token_type={token_type}
              mode="wrap"
            />
          </TabPanel>
          <TabPanel>
            <WrapUnwrapForm
              selectedMarket={selectedMarket}
              token_type={token_type}
              mode="unwrap"
            />
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </div>
  );
};
