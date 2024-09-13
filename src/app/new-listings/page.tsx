"use client"

// External packages
import { useRef, useState } from "react";
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

function App() {
    // Wallet Adapter provider
    const aptosWallet = useWallet();
    const { account, wallet, signAndSubmitTransaction } = useWallet();

    // If we are on Production mode, redierct to the public mint page
    // const navigate = useNavigate();
    // if (IS_PROD) navigate("/", { replace: true });

    // Collection data entered by the user on UI
    const [royaltyPercentage, setRoyaltyPercentage] = useState<number>();
    const [preMintAmount, setPreMintAmount] = useState<number>();
    const [publicMintStartDate, setPublicMintStartDate] = useState<Date>();
    const [publicMintStartTime, setPublicMintStartTime] = useState<string>();
    const [publicMintEndDate, setPublicMintEndDate] = useState<Date>();
    const [publicMintEndTime, setPublicMintEndTime] = useState<string>();
    const [publicMintLimitPerAccount, setPublicMintLimitPerAccount] = useState<number>(1);
    const [publicMintFeePerNFT, setPublicMintFeePerNFT] = useState<number>();
    const [files, setFiles] = useState<FileList | null>(null);
    const [fileURLs, setFileURLs] = useState<string[] | null>(null);

    // Internal state
    const [isUploading, setIsUploading] = useState(false);

    // Local Ref
    const inputRef = useRef<HTMLInputElement>(null);

    // On publish mint start date selected
    const onPublicMintStartTime = (event: React.ChangeEvent<HTMLInputElement>) => {
        const timeValue = event.target.value;
        setPublicMintStartTime(timeValue);

        const [hours, minutes] = timeValue.split(":").map(Number);

        publicMintStartDate?.setHours(hours);
        publicMintStartDate?.setMinutes(minutes);
        publicMintStartDate?.setSeconds(0);
        setPublicMintStartDate(publicMintStartDate);
    };

    // On publish mint end date selected
    const onPublicMintEndTime = (event: React.ChangeEvent<HTMLInputElement>) => {
        const timeValue = event.target.value;
        setPublicMintEndTime(timeValue);

        const [hours, minutes] = timeValue.split(":").map(Number);

        publicMintEndDate?.setHours(hours);
        publicMintEndDate?.setMinutes(minutes);
        publicMintEndDate?.setSeconds(0);
        setPublicMintEndDate(publicMintEndDate);
    };

    // On create collection button clicked
    const onCreateCollection = async () => {
        try {
            if (!account) throw new Error("Please connect your wallet");
            if (!files) throw new Error("Please upload files");
            if (account.address !== CREATOR_ADDRESS) throw new Error("Wrong account");
            if (isUploading) throw new Error("Uploading in progress");

            // Set internal isUploading state
            setIsUploading(true);

            // Upload collection files to Irys
            const { collectionName, collectionDescription, maxSupply, projectUri } = await uploadCollectionData(
                aptosWallet,
                files,
            );

            // Submit a create_collection entry function transaction
            const response = await signAndSubmitTransaction(
                createCollection({
                    collectionDescription,
                    collectionName,
                    projectUri,
                    maxSupply,
                    royaltyPercentage,
                    preMintAmount,
                    allowList: undefined,
                    allowListStartDate: undefined,
                    allowListEndDate: undefined,
                    allowListLimitPerAccount: undefined,
                    allowListFeePerNFT: undefined,
                    publicMintStartDate,
                    publicMintEndDate,
                    publicMintLimitPerAccount,
                    publicMintFeePerNFT,
                }),
            );

            // Wait for the transaction to be commited to chain
            const committedTransactionResponse = await aptosClient().waitForTransaction({
                transactionHash: response.hash,
            });

            // Once the transaction has been successfully commited to chain, navigate to the `my-collection` page
            if (committedTransactionResponse.success) {
                // navigate(`/my-collections`, { replace: true });
            }
        } catch (error) {
            alert(error);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <>
            <Header />

            <div className="max-w-screen-xl mx-auto w-full my-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-8 px-4">
                    <PropertyCardSection />
                    <PropertyCardSection />
                    <PropertyCardSection />
                    <PropertyCardSection />
                </div>
            </div>
            <Footer />
        </>
    );
}

export default App;