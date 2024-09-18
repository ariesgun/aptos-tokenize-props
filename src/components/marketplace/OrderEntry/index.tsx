import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import React, { useState } from "react";

import { Side } from "../types/global";
import { ApiMarket } from "../types/api";

import { LimitOrderEntry } from "./LimitOrderEntry";
import { MarketOrderEntry } from "./MarketOrderEntry";


export const OrderEntry: React.FC<{
  marketData?: ApiMarket;
  defaultSide?: "buy" | "sell";
  onDepositWithdrawClick?: () => void;
}> = ({ marketData, defaultSide = "buy", onDepositWithdrawClick }) => {
  const [side, setSide] = useState<Side>(defaultSide);

  return (
    <div>
      <div className="flex gap-2 md:m-4">
        <button
          onClick={() => setSide("buy")}
          className={`w-full border-2 py-2 font-jost font-bold ${side === "buy"
            ? "border-green bg-green border-opacity-80 text-white"
            : "border-gray-300 bg-gray-200 text-neutral-600"
            }`}
        >
          Buy
        </button>
        <button
          onClick={() => setSide("sell")}
          className={`w-full border-2 font-jost font-bold ${side === "sell"
            ? "border-red bg-red border-opacity-80 text-white"
            : "border-gray-300 bg-gray-200 text-neutral-600"
            }`}
        >
          Sell
        </button>
      </div>
      <TabGroup>
        <TabList className="my-5 flex justify-center gap-[31.25px]">
          <Tab className="text-sm uppercase outline-none ui-selected:font-medium ui-selected:text-white ui-not-selected:font-light ui-not-selected:text-neutral-500">
            Limit
          </Tab>
          <Tab className="text-sm uppercase outline-none ui-selected:font-medium ui-selected:text-white ui-not-selected:font-light ui-not-selected:text-neutral-500">
            Market
          </Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <LimitOrderEntry
              marketData={marketData}
              side={side}
              onDepositWithdrawClick={onDepositWithdrawClick}
            />
          </TabPanel>
          <TabPanel>
            <MarketOrderEntry
              marketData={marketData}
              side={side}
              onDepositWithdrawClick={onDepositWithdrawClick}
            />
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </div>
  );
};
