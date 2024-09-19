import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useQueryClient } from "@tanstack/react-query";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Separator } from "@/components/ui/separator";

import Placeholder1 from "@/assets/placeholders/bear-1.png";


export interface PropertyMarketplaceCardProps {
    token_data: any;
    listing_info: any;
}

export function PropertyMarketplaceCard({
    token_data,
    listing_info
}: PropertyMarketplaceCardProps) {
    const queryClient = useQueryClient();
    const { account } = useWallet();

    useEffect(() => {
        queryClient.invalidateQueries();
    }, [account, queryClient]);

    const [tokenMetadata, setTokenMetadata] = useState<any>({});

    useEffect(() => {
        const getTokenMetadata = async () => {
            try {
                const res = await fetch(token_data.token_uri)
                const token_metadata = await res.json();
                setTokenMetadata(token_metadata)
            } catch (e) {
                console.warn(e)
            }
        }

        getTokenMetadata();
    }, [token_data]);

    return (
        <section>
            <Card shadow="md">
                <CardContent
                    fullPadding
                    className="flex flex-col gap-1 md:justify-between items-start flex-wrap p-0"
                >
                    <Image
                        src={tokenMetadata?.image ?? Placeholder1.src}
                        width={480}
                        height={480}
                        alt=""
                    />

                    <div className="p-4 pt-0">
                        <h5 className="mt-4 mb-1 text-xl font-bold text-gray-700 dark:text-gray-400">{tokenMetadata.name}</h5>
                        <h5 className="mb-4 text-md font-normal text-gray-700 dark:text-gray-400">{tokenMetadata.address}</h5>
                        <p className="text-md font-normal text-gray-700 dark:text-gray-400">
                            {tokenMetadata.properties?.marketing_description}
                        </p>

                        <Separator className="mt-4 mb-2" />

                        <div className="flex flex-row gap-6 w-full md:basis-1/3">
                            <div className="flex flex-col gap-4 w-full items-center border border-indigo-800 rounded-lg py-4 shadow-md">
                                <p className="text-xs font-bold text-center">Annual Rental Yield</p>
                                <p className="text-xs font-normal text-secondary-text">{tokenMetadata.properties?.rental_yield} %</p>
                            </div>
                            <div className="flex flex-col gap-4 w-full items-center border border-indigo-800 rounded-lg py-4 shadow-md">
                                <p className="text-xs font-bold text-center">Property Fair Value</p>
                                <p className="text-xs font-normal text-secondary-text">$ {tokenMetadata.properties?.property_value}</p>
                            </div>
                        </div>

                        <Separator className="my-2" />

                        {
                            listing_info && listing_info.market_id ?
                                <Link href={`/marketplace/${token_data.token_data_id}`}>
                                    <Button className="w-full my-2 py-6 mb-0">
                                        <p className="text-md">Buy / Sell 💸</p>
                                    </Button>
                                </Link>
                                :
                                <>
                                    <Button disabled className="w-full my-2 py-6 mb-0">
                                        <p className="text-md">Secondary Market Closed</p>
                                    </Button>
                                </>
                        }
                    </div>
                </CardContent>
            </Card>
        </section >
    );
}
