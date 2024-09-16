"use client"

// External packages
import { useEffect, useRef, useState } from "react";
import { isAptosConnectWallet, useWallet } from "@aptos-labs/wallet-adapter-react";
// import { Link, useNavigate } from "react-router-dom";
// Internal utils
import { aptosClient } from "@/utils/aptosClient";
import { uploadCollectionData } from "@/utils/assetsUploader";
// Internal components
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { CREATOR_ADDRESS, IS_PROD } from "@/constants";
import { WarningAlert } from "@/components/ui/warning-alert";
import { UploadSpinner } from "@/components/UploadSpinner";
import { LabeledInput } from "@/components/ui/labeled-input";
import { DateTimeInput } from "@/components/ui/date-time-input";
import { ConfirmButton } from "@/components/ui/confirm-button";
// Entry functions
import { createCollection } from "@/entry-functions/create_collection";
import Link from "next/link";
import Image from "next/image";
import { PropertyCardSection } from "@/components/new-listings/PropertyCardSection";
import { MintCard } from "@/components/new-listings/MintCard";
import { Footer } from "@/components/Footer";

import { useGetTokensOfCollection } from "@/hooks/useGetTokensOfCollection";
import { useQueryClient } from "@tanstack/react-query";
import { useGetListings } from "@/hooks/useGetListings";

function App() {

    const { data, isLoading } = useGetTokensOfCollection();

    const queryClient = useQueryClient();
    const { account } = useWallet();

    const listings = useGetListings();

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

    return (
        <>
            <Header />

            <div className="max-w-screen-xl mx-auto w-full my-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-8 px-8">
                    {
                        data?.tokens && data?.tokens.length > 0 && data?.tokens.map((el) => {
                            const listing_info = listings.find((listing_el) => listing_el.ownership_token === el.token_data_id)
                            return (
                                <div key={el?.token_data_id}>
                                    <PropertyCardSection
                                        token_data={el}
                                        listing_info={listing_info}
                                    />
                                </div>
                            )
                        })
                    }
                </div>
            </div>
            <Footer />
        </>
    );
}

export default App;