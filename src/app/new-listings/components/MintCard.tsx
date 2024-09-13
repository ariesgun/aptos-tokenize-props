import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { WalletSelector } from "@/components/WalletSelector";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useQueryClient } from "@tanstack/react-query";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useState } from "react";
import { useGetCollectionData } from "@/hooks/useGetCollectionData";
import { clampNumber } from "@/utils/clampNumber";

export function MintCard(

) {
    const { data } = useGetCollectionData();
    const queryClient = useQueryClient();
    const { account, signAndSubmitTransaction } = useWallet();
    const [nftCount, setNftCount] = useState(1);

    const { userMintBalance = 0, collection, totalMinted = 0, maxSupply = 1 } = data ?? {};
    const mintUpTo = Math.min(userMintBalance, maxSupply - totalMinted);

    return (
        <Card>
            <CardContent
                fullPadding
                className="flex flex-col md:flex-row gap-4 md:justify-between items-start md:items-center flex-wrap"
            >
                <form className="flex flex-col md:flex-row gap-4 w-full md:basis-1/4">
                    <Input
                        type="number"
                        disabled={!data?.isMintActive}
                        value={nftCount}
                        onChange={(e) => setNftCount(parseInt(e.currentTarget.value, 10))}
                    />
                    <Button className="h-16 md:h-auto" type="submit" disabled={!data?.isMintActive}>
                        Mint
                    </Button>
                </form>
                <div className="flex flex-col gap-2 w-full md:basis-1/3">
                    <p className="label-sm">You can mint up to</p>
                    <p className="body-md">{mintUpTo > 1 ? `${mintUpTo} NFTs` : `${mintUpTo} NFT`}</p>
                </div>
                <div className="flex flex-col gap-2 w-full md:basis-1/3">
                    <p className="label-sm text-secondary-text">
                        {clampNumber(totalMinted)} / {clampNumber(maxSupply)} Minted
                    </p>
                    <Progress value={(totalMinted / maxSupply) * 100} className="h-2" />
                </div>
            </CardContent>
        </Card>
    );
}
