import Link from "next/link";
import { WalletSelector } from "./WalletSelector";
import { buttonVariants } from "./ui/button";
import { cn } from "@/lib/utils";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { CREATOR_ADDRESS } from "@/constants";

export function Header() {

  const { account } = useWallet();

  return (
    <div className="flex items-center justify-between px-8 py-10 max-w-screen-xl mx-auto w-full flex-wrap">
      <Link href={"/"}>
        <h1 className="display">AptosProps</h1>
      </Link>

      <div className="flex gap-2 items-center flex-wrap">
        <Link className={buttonVariants({ variant: "link" })} href={"/new-listings"}>
          New Listings
        </Link>
        <Link className={buttonVariants({ variant: "link" })} href={"/marketplace"}>
          Marketplace
        </Link>
        <Link className={buttonVariants({ variant: "link" })} href={"/portfolio"}>
          My Portfolio
        </Link>
        {account?.address === CREATOR_ADDRESS &&
          <Link className={cn(buttonVariants({ variant: "secondary" }), "mx-10")} href={"/tokenize"}>
            Tokenize Property
          </Link>
        }
      </div>

      <WalletSelector />

    </div>
  );
}
