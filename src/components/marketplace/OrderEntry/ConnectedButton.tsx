import { useWallet } from "@aptos-labs/wallet-adapter-react";
import React, { type PropsWithChildren } from "react";

import { WalletSelector } from "@/components/WalletSelector";

export const ConnectedButton: React.FC<
  PropsWithChildren<{}>
> = ({ children }) => {
  const { connected } = useWallet();

  return (
    <>
      {!connected ? (
        <WalletSelector />
      ) : (
        children
      )}
    </>
  );
};
