"use client";

import { AccountInfo } from "@/components/AccountInfo";
import { Header } from "@/components/Header";
import { MessageBoard } from "@/components/MessageBoard";
import { NetworkInfo } from "@/components/NetworkInfo";
import { TransferAPT } from "@/components/TransferAPT";
import { WalletDetails } from "@/components/WalletDetails";
import { DepthChart } from "@/components/marketplace/DepthChart";
import { OrderbookTable } from "@/components/marketplace/OrderBookTable";
import { OrderEntry } from "@/components/marketplace/OrderEntry";
import { OrdersTable } from "@/components/marketplace/OrderTable";
import { StatsBar } from "@/components/marketplace/StatsBar";
import { TradeHistoryTable } from "@/components/marketplace/TradeHistoryTable";
import { DepositWithdrawFlowModal } from "@/components/marketplace/modals/flows/DepositWithdrawFlowModal";
import { ApiMarket } from "@/components/marketplace/types/api";
// Internal Components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderEntryContextProvider } from "@/contexts/OrderEntryContext";
import { useOrderBook } from "@/hooks/useOrderbook";
import { store } from "@/store/store";
import { getAllMarket } from "@/utils/helpers";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import dynamic from "next/dynamic";
import Script from "next/script";
import { useEffect, useMemo, useState } from "react";
import { Provider } from "react-redux";


let ChartContainer = dynamic(
  () => {
    return import("@/components/marketplace/LightweightChartsContainer").then(
      (mod) => mod.LightweightChartsContainer,
    );
  },
  { ssr: false },
);

function App() {
  const { connected } = useWallet();

  const [marketData, setMarketData] = useState<Array<any>>([]);
  const [depositWithdrawModalOpen, setDepositWithdrawModalOpen] = useState<boolean>(false);
  const [isScriptReady, setIsScriptReady] = useState(false);

  const {
    data: orderbookData,
    isFetching: orderbookIsFetching,
    isLoading: orderbookIsLoading,
  } = useOrderBook(marketData.length ? marketData[0].market_id : 0);

  useEffect(() => {

    const run = async () => {
      const res = await getAllMarket();

      const filtered_res = res.filter((el) => el.market_id === 38)
      setMarketData(filtered_res);
    }

    run();
  }, [])

  const defaultTVChartProps = useMemo(() => {
    return {
      symbol: `${marketData[0]?.name ?? ""}`,
      selectedMarket: marketData[0] as ApiMarket,
      allMarketData: marketData as ApiMarket[],
    };
  }, [marketData]);

  return (
    <>
      <OrderEntryContextProvider>
        <Header />
        <div className="flex items-center justify-center flex-col max-w-screen-2xl mx-auto">
          {connected ? (
            <>
              <div className="flex flex-row gap-4 p-3 mx-auto">
                <div className="basis-4/6 flex flex-col gap-2">
                  <Card>
                    <CardContent className="flex flex-col pt-6">

                      {
                        marketData && marketData.length &&
                        <>
                          <StatsBar allMarketData={marketData} selectedMarket={marketData[0]} />
                          <div className="flex h-full min-h-[680px] w-full grow flex-col gap-3 md:flex-row">
                            <div className=" flex flex-col w-full">
                              <div className="flex h-full min-h-[400px]">
                                <ChartContainer {...defaultTVChartProps} />
                              </div>

                              <div className="hidden h-[140px] tall:block">
                                <DepthChart
                                  marketData={marketData[0]} />
                              </div>
                            </div>
                          </div>
                        </>
                      }
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="flex flex-col gap-6 pt-6">
                      <OrderbookTable
                        marketData={marketData[0]}
                        data={orderbookData}
                        isFetching={orderbookIsFetching}
                        isLoading={orderbookIsLoading}
                      />
                      <OrdersTable
                        market_id={marketData[0].market_id}
                        marketData={marketData[0]}
                      />
                      <TradeHistoryTable
                        marketData={marketData[0]}
                        marketId={marketData[0].market_id}
                      />
                    </CardContent>
                  </Card>
                </div>
                <div className="basis-2/6">
                  <Card>
                    <CardContent className="flex flex-col gap-10 pt-6">
                      <OrderEntry
                        marketData={marketData[0]}
                        onDepositWithdrawClick={() => setDepositWithdrawModalOpen(true)}
                      />
                    </CardContent>
                  </Card>
                </div>
              </div>

            </>
          ) : (
            <CardHeader>
              <CardTitle>To get started Connect a wallet</CardTitle>
            </CardHeader>
          )}
        </div >
      </OrderEntryContextProvider >
      <DepositWithdrawFlowModal
        selectedMarket={marketData[0]}
        isOpen={depositWithdrawModalOpen}
        onClose={() => {
          setDepositWithdrawModalOpen(false);
        }}
        allMarketData={marketData}
      />

    </>
  );
}

export default App;
