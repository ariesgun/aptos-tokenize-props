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
import Image from "next/image";
import { Separator } from "@/components/ui/separator";

export function PropertyCardSection(

) {
    const { data } = useGetCollectionData();
    const queryClient = useQueryClient();
    const { account, signAndSubmitTransaction } = useWallet();
    const [nftCount, setNftCount] = useState(1);

    const { userMintBalance = 0, collection, totalMinted = 35, maxSupply = 100 } = data ?? {};
    const mintUpTo = Math.min(userMintBalance, maxSupply - totalMinted);

    return (
        <section>
            <Card shadow="md">
                <CardContent
                    fullPadding
                    className="flex flex-col gap-1 md:justify-between items-start flex-wrap p-0"
                >
                    <Image src="/image1.png" width={480} height={480} alt="" />

                    <div className="p-4 pt-0">
                        <h5 className="mt-4 mb-1 text-xl font-bold text-gray-700 dark:text-gray-400">The Loft</h5>
                        <h5 className="mb-4 text-md font-normal text-gray-700 dark:text-gray-400">Raiffeisenstraat 64, Eindhoven</h5>
                        <p className="text-md font-normal text-gray-700 dark:text-gray-400">
                            Here are the biggest enterprise technology acquisitions of 2021 so far, in reverse chronological order.
                        </p>

                        <Separator className="mt-4 mb-2" />

                        <div className="flex flex-row gap-6 w-full md:basis-1/3">
                            <div className="flex flex-col gap-4 w-full items-center border border-indigo-800 rounded-lg py-4 shadow-md">
                                <p className="text-xs font-bold text-center">Annual Rental Yield</p>
                                <p className="text-xs font-normal text-secondary-text">14 %</p>
                            </div>
                            <div className="flex flex-col gap-4 w-full items-center border border-indigo-800 rounded-lg py-4 shadow-md">
                                <p className="text-xs font-bold text-center">Property Fair Value</p>
                                <p className="text-xs font-normal text-secondary-text">$ 425000</p>
                            </div>
                            <div className="flex flex-col gap-4 w-full items-center border border-indigo-800 rounded-lg py-4 shadow-md">
                                <p className="text-xs font-bold text-center">Individual Token Price</p>
                                <p className="text-xs font-normal text-secondary-text">$ 50</p>
                            </div>
                        </div>

                        <Separator className="my-2" />

                        <div className="flex flex-col gap-2 w-full md:basis-1/3">
                            <p className="text-md font-bold text-secondary-text">Funding Target</p>
                            <p className="text-sm text-secondary-text">
                                {clampNumber(totalMinted)} / {clampNumber(maxSupply)} Minted
                            </p>
                            <Progress value={(totalMinted / maxSupply) * 100} className="h-2" />
                        </div>
                        <Link href={`/new-listings/${1}`}>
                            <Button className="w-full my-8 py-6 mb-0">
                                <p className="text-md">See Details ➡️</p>
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </section >
    );
}
