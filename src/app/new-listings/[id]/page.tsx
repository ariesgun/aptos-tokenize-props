"use client"

import { useQueryClient } from "@tanstack/react-query";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useEffect, useState } from "react";

// import { BannerSection } from "@/pages/Mint/components/BannerSection";
// import { HeroSection } from "@/pages/Mint/components/HeroSection";
// import { StatsSection } from "@/pages/Mint/components/StatsSection";
// import { OurStorySection } from "@/pages/Mint/components/OurStorySection";
// import { HowToMintSection } from "@/pages/Mint/components/HowToMintSection";
// import { OurTeamSection } from "@/pages/Mint/components/OurTeamSection";
// import { FAQSection } from "@/pages/Mint/components/FAQSection";
// import { Socials } from "@/pages/Mint/components/Socials";
// import { ConnectWalletAlert } from "@/pages/Mint/components/ConnectWalletAlert";

import { useGetCollectionData } from "@/hooks/useGetCollectionData";

import { Header } from "@/components/Header";
import { BannerSection } from "@/components/new-listings/BannerSection";
import { HowToMintSection } from "@/components/new-listings/HowToMintSection";
import { OurTeamSection } from "@/components/new-listings/OurTeamSection";
import { FAQSection } from "@/components/new-listings/FAQSection";
import { OurStorySection } from "@/components/new-listings/OurStorySection";
import { StatsSection } from "@/components/new-listings/StatsSection";
import { ConnectWalletAlert } from "@/components/new-listings/ConnectWalletAlert";
import { HeroSection } from "@/components/new-listings/HeroSection";
import { Footer } from "@/components/Footer";
import { MintCard } from "@/components/new-listings/MintCard";
import { useGetTokenData, useGetTokensOfCollection } from "@/hooks/useGetTokensOfCollection";
import { PropertyHeroSection } from "@/components/new-listings/PropertyHeroSection";
import { config } from "@/config";
import { getListings } from "@/view-functions/getListings";
import { useGetListings } from "@/hooks/useGetListings";

export default function Page({ params }: { params: { id: string } }) {

    const listings: Array<any> = useGetListings();
    console.log("lllll", listings)

    const queryClient = useQueryClient();
    const { account } = useWallet();

    const { data, isLoading } = useGetTokensOfCollection();

    const [tokenData, setTokenData] = useState<any>();
    const [tokenMetadata, setTokenMetadata] = useState<any>();

    useEffect(() => {
        queryClient.invalidateQueries();
    }, [account, queryClient]);

    useEffect(() => {
        const filteredData = data?.tokens.filter((el) => el.token_data_id === params.id)
        if (filteredData && filteredData?.length > 0) {
            setTokenData(filteredData[0])
        }
    }, [data]);

    useEffect(() => {
        console.log("aa", tokenData)
        try {
            fetch(tokenData?.token_uri)
                .then((res) => {
                    res.json().then((res_json) => {
                        setTokenMetadata(res_json)
                    })
                })
        } catch (e) {
            console.warn(e);
        }
        getListings();
    }, [tokenData])

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
            <div style={{ overflow: "hidden" }} className="overflow-hidden">
                <main className="flex flex-col gap-10 md:gap-16 mt-6 max-w-screen-lg mx-auto">
                    <ConnectWalletAlert />
                    <PropertyHeroSection
                        tokenId={tokenData?.token_data_id}
                        propertyName={tokenData?.token_name ?? config.defaultCollection?.name}
                        propertyAddress="The address"
                        propertyDescription="The description"
                        propertyMetadata={tokenMetadata}
                    />
                    <MintCard
                        tokenId={tokenData?.token_data_id}
                        propertyName={tokenData?.token_name ?? config.defaultCollection?.name}
                        propertyAddress="The address"
                        propertyDescription="The description"
                        propertyMetadata={tokenMetadata}
                    />
                </main>

            </div>
            <Footer />
        </>
    );
}
