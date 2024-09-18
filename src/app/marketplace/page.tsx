"use client";

import { AccountInfo } from "@/components/AccountInfo";
import { Header } from "@/components/Header";
import { MessageBoard } from "@/components/MessageBoard";
import { NetworkInfo } from "@/components/NetworkInfo";
import { TransferAPT } from "@/components/TransferAPT";
import { WalletDetails } from "@/components/WalletDetails";
import { OrderbookTable } from "@/components/marketplace/OrderBookTable";
import { OrderEntry } from "@/components/marketplace/OrderEntry";
import { OrdersTable } from "@/components/marketplace/OrderTable";
import { DepositWithdrawFlowModal } from "@/components/marketplace/modals/flows/DepositWithdrawFlowModal";
// Internal Components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderEntryContextProvider } from "@/contexts/OrderEntryContext";
import { useOrderBook } from "@/hooks/useOrderbook";
import { store } from "@/store/store";
import { getAllMarket } from "@/utils/helpers";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useEffect, useState } from "react";
import { Provider } from "react-redux";

function App() {
  const { connected } = useWallet();

  const [marketData, setMarketData] = useState<Array<any>>([]);
  const [depositWithdrawModalOpen, setDepositWithdrawModalOpen] = useState<boolean>(false);



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

  return (
    <>
      <OrderEntryContextProvider>
        <Header />
        <div className="flex items-center justify-center flex-col">
          {connected ? (
            <Card>
              <CardContent className="flex flex-col gap-10 pt-6">
                <OrderEntry
                  marketData={marketData[0]}
                  onDepositWithdrawClick={() => setDepositWithdrawModalOpen(true)}
                />
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
                <WalletDetails />
                <NetworkInfo />
                <AccountInfo />
                <TransferAPT />
                {/* <MessageBoard /> */}
              </CardContent>
            </Card>
          ) : (
            <CardHeader>
              <CardTitle>To get started Connect a wallet</CardTitle>
            </CardHeader>
          )}
        </div>
      </OrderEntryContextProvider>
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
