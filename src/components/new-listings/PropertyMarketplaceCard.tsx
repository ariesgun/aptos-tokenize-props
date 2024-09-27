import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useQueryClient } from "@tanstack/react-query";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Separator } from "@/components/ui/separator";

import Placeholder1 from "@/assets/placeholders/bear-1.jpg";
import { createSecondaryMarketStep1, createSecondaryMarketStep2, createSecondaryMarketStep3 } from "@/entry-functions/create_secondary_market_step_1";
import { aptosClient } from "@/utils/aptosClient";
import { TransactionResponse, UserTransactionResponse } from "@aptos-labs/ts-sdk";
import { getCoinTypeFromListing } from "@/view-functions/getCoinType";
import { create } from "@/actions/actions";
import { CREATOR_ADDRESS } from "@/constants";


export interface PropertyMarketplaceCardProps {
    token_data: any;
    listing_info: any;
}

export function PropertyMarketplaceCard({
    token_data,
    listing_info
}: PropertyMarketplaceCardProps) {
    const queryClient = useQueryClient();
    const { account, signAndSubmitTransaction } = useWallet();

    useEffect(() => {
        queryClient.invalidateQueries();
    }, [account, queryClient]);

    const [tokenMetadata, setTokenMetadata] = useState<any>({});

    const [setupStep, setSetupStep] = useState<number>(1);
    const [coinType, setCoinType] = useState<string>("");
    const [registerTransactionHash, setRegisterTransactionHash] = useState<string>("");
    const [marketId, setMarketId] = useState<number>(-1);

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

    const setupMarketplace = async (_e: any) => {
        console.log(account, listing_info)
        if (!account) return;
        if (!listing_info) return;

        if (setupStep == 1) {
            try {

                const payload = await create(listing_info.ownership_token);
                console.log("payload", payload)

                const transaction = createSecondaryMarketStep1({
                    listingInfo: listing_info.address,
                    metadata_serialized: payload.metadata.substring(2),
                    code: payload.byteCode,
                });
                console.log("Transac", transaction)
                const response = await signAndSubmitTransaction(
                    transaction
                );
                await aptosClient().waitForTransaction({
                    transactionHash: response.hash,
                })
                const coin_type = await getCoinTypeFromListing({
                    listingInfo: listing_info.address,
                })

                setCoinType(coin_type)
                setSetupStep(2);
            } catch (e) {
                console.error("Unable to execute create secondary market step 1", e);
                throw e;
            }
        } else if (setupStep === 2) {

            try {
                const response2 = await signAndSubmitTransaction(
                    createSecondaryMarketStep2({
                        listingInfo: listing_info.address,
                        coin_type: coinType
                    })
                );
                await aptosClient().waitForTransaction({ transactionHash: response2.hash })
                setRegisterTransactionHash(response2.hash);
                setSetupStep(3);
            } catch (e) {
                console.error("Unable to cxecute create secondary market step 2", e);
            }

        } else if (setupStep == 3) {
            try {
                const transactions: TransactionResponse = await aptosClient().getTransactionByHash({
                    transactionHash: registerTransactionHash
                })
                console.log("Events", (transactions as UserTransactionResponse).events)
                const registrationEvent = (transactions as UserTransactionResponse).events.filter((el) =>
                    el.type.includes("MarketRegistrationEvent")
                );
                const market_id = parseInt(registrationEvent[0].data.market_id)
                const transaction3 = createSecondaryMarketStep3({
                    listingInfo: listing_info.address,
                    market_id
                });
                console.log("Transac", transaction3)
                const response3 = await signAndSubmitTransaction(
                    transaction3
                );
                await aptosClient().waitForTransaction({ transactionHash: response3.hash })
                setSetupStep(4);
                setMarketId(market_id)
            } catch (e) {
                console.error("Unable to cxecute create secondary market step 3", e);
            }
        }

        queryClient.invalidateQueries();
    }

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

                    <div className="p-4 pt-0 w-full">
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
                            listing_info && (listing_info.market_id || marketId !== -1) ?
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
                                    {
                                        account?.address === CREATOR_ADDRESS && (
                                            <>
                                                {listing_info?.is_mint_active ?
                                                    < Button className="w-full my-2 py-6 mb-0" onClick={setupMarketplace}>
                                                        <p className="text-md">
                                                            {`Setup secondary market (Step ${setupStep} / 3)`}</p>
                                                    </Button>
                                                    : <Button disabled className="w-full my-2 py-6 mb-0">
                                                        <p className="text-md">Minting Period is Still Active</p>
                                                    </Button>
                                                }
                                            </>
                                        )
                                    }
                                </>
                        }
                    </div>
                </CardContent>
            </Card>
        </section >
    );
}
