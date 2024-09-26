import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useQueryClient } from "@tanstack/react-query";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { FormEvent, useEffect, useState } from "react";
import { Separator } from "../ui/separator";
import { useGetTokenData } from "@/hooks/useGetTokensOfCollection";
import { aptosClient } from "@/utils/aptosClient";
import { buyShares } from "@/entry-functions/buy_shares";

interface MintCardProps {
    tokenId: string | undefined;
    propertyName: string | undefined;
    propertyAddress: string | undefined;
    propertyDescription: string | undefined;
    propertyMetadata: any;
    listingInfo: any;
}


export const MintCard: React.FC<MintCardProps> = ({
    tokenId,
    propertyMetadata,
    listingInfo,
}) => {
    const { data, isLoading } = useGetTokenData(tokenId!);
    const queryClient = useQueryClient();
    const { account, signAndSubmitTransaction } = useWallet();
    const [nftCount, setNftCount] = useState(1);

    // const { userMintBalance = 0, collection, totalMinted = 0, maxSupply = 1 } = data ?? {};
    let totalMinted = data?.amount_v2 ?? 0
    let maxSupply = propertyMetadata?.properties?.maximum_supply;
    const mintUpTo = maxSupply - totalMinted;

    useEffect(() => {
        queryClient.invalidateQueries();
    }, [account, queryClient]);

    if (isLoading) {
        return (
            <div className="text-center p-8">
                <h1 className="title-md">Loading...</h1>
            </div>
        );
    }

    const mintToken = async (e: FormEvent) => {
        e.preventDefault();
        if (!account) return;
        if (!listingInfo) return;

        const response = await signAndSubmitTransaction(
            buyShares({ listingInfo: listingInfo.address, amount: nftCount }),
        );
        await aptosClient().waitForTransaction({ transactionHash: response.hash });
        queryClient.invalidateQueries();
    };

    return (
        <section className="px-4 text-center max-w-screen-md mx-auto w-full">
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="text-xl">Buy Shares</CardTitle>
                </CardHeader>
                <CardContent
                    fullPadding
                    className="flex flex-col gap-2 md:justify-between items-start md:items-center flex-wrap mx-4 mb-4"
                >
                    <div className="flex flex-row gap-2 w-full justify-between items-center my-2">
                        <div className="flex flex-auto flex-col items-start gap-2 w-full md:basis-1/3">
                            <p className="text-md font-bold">
                                Funding Target
                            </p>
                        </div>
                        <div className="flex-none mx-4 text-2xl">
                            <p className="text-base">
                                $ {listingInfo?.funding_target}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-row gap-2 w-full justify-between items-center my-2">
                        <div className="flex flex-auto flex-col items-start gap-2 w-full md:basis-1/3">
                            <p className="text-md font-bold">
                                Token Price
                            </p>
                        </div>
                        <div className="flex-none mx-4 text-2xl">
                            <p className="text-base">
                                $ {listingInfo?.token_price}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-row gap-8 w-full md:basis-1/3 mb-4">
                        <div className="flex flex-col gap-4 w-full items-center border border-indigo-800 rounded-lg py-4 shadow-md">
                            <p className="text-base font-bold text-center">Maximum Tokens</p>
                            <p className="text-base font-normal text-secondary-text">{maxSupply}</p>
                        </div>
                        <div className="flex flex-col gap-4 w-full items-center border border-indigo-800 rounded-lg py-4 shadow-md">
                            <p className="text-base font-bold text-center">Minted Tokens</p>
                            <p className="text-base font-normal text-secondary-text">{totalMinted}</p>
                        </div>
                        <div className="flex flex-col gap-4 w-full items-center border border-indigo-800 rounded-lg py-4 shadow-md">
                            <p className="text-base font-bold text-center">Available Tokens</p>
                            <p className="text-base font-normal text-secondary-text">{maxSupply - totalMinted}</p>
                        </div>
                    </div>
                    <div className="flex flex-row gap-2 w-full justify-between items-center">
                        <div className="flex flex-auto flex-col items-start gap-2 w-full md:basis-1/3">
                            <p className="text-md">
                                Minted Tokens
                            </p>
                            <Progress value={(totalMinted / maxSupply) * 100} className="h-2" />
                        </div>
                        <div className="flex-none mx-4 py-4 text-2xl font-bold">
                            <p>{((totalMinted / maxSupply) * 100).toFixed(2)} %</p>
                        </div>
                    </div>

                    <Separator className="my-4" />

                    <div className="flex flex-col gap-2 w-full md:basis-1/3">
                        <p className="label-sm">You can mint up to</p>
                        <p className="body-md">{mintUpTo > 1 ? `${mintUpTo} NFTs` : `${mintUpTo} tokens`}</p>
                    </div>

                    <form onSubmit={mintToken} className="flex flex-col gap-4 w-full md:basis-1/4">
                        <Input
                            type="number"
                            disabled={!listingInfo?.is_mint_active}
                            value={nftCount}
                            onChange={(e) => setNftCount(parseInt(e.currentTarget.value, 10))}
                        />
                        <div className="flex flex-row gap-2 w-full justify-between items-center">
                            <div className="flex flex-auto flex-col items-start gap-2 w-full md:basis-1/3">
                                <p className="text-md">
                                    Total Price
                                </p>
                            </div>
                            <div className="flex-none mx-4 py-4 text-xl font-bold">
                                <p>$ {nftCount * listingInfo?.token_price}</p>
                            </div>
                        </div>
                        <Button
                            className="h-16 md:h-auto"
                            type="submit"
                            disabled={!listingInfo?.is_mint_active}
                        >
                            Mint
                        </Button>
                    </form>

                </CardContent>
            </Card>
        </section>
    );
}
