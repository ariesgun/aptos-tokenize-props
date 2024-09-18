"use client";

import { AccountInfo } from "@/components/AccountInfo";
import { Header } from "@/components/Header";
import { MessageBoard } from "@/components/MessageBoard";
import { NetworkInfo } from "@/components/NetworkInfo";
import { TransferAPT } from "@/components/TransferAPT";
import { WalletDetails } from "@/components/WalletDetails";
import { OrderEntry } from "@/components/marketplace/OrderEntry";
// Internal Components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderEntryContextProvider } from "@/contexts/OrderEntryContext";
import { store } from "@/store/store";
import { getAllMarket } from "@/utils/helpers";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useEffect, useState } from "react";
import { Provider } from "react-redux";

function App() {
  const { connected } = useWallet();

  const [marketData, setMarketData] = useState<Array<any>>([]);
  const [depositWithdrawModalOpen, setDepositWithdrawModalOpen] = useState<boolean>(false);

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
      <Provider store={store}>
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
      </Provider>
    </>
  );
}

export default App;
