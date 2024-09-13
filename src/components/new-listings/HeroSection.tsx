import { FC, FormEvent, useState } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useQueryClient } from "@tanstack/react-query";
// Internal assets
import Copy from "@/assets/icons/copy.svg";
import ExternalLink from "@/assets/icons/external-link.svg";
import Placeholder1 from "@/assets/placeholders/bear-1.png";
// Internal utils
import { truncateAddress } from "@/utils/truncateAddress";
import { clampNumber } from "@/utils/clampNumber";
import { formatDate } from "@/utils/formatDate";
import { aptosClient } from "@/utils/aptosClient";
// Internal hooks
import { useGetCollectionData } from "@/hooks/useGetCollectionData";
// Internal components
import { Image } from "@/components/ui/image";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
// import { Socials } from "@/pages/Mint/components/Socials";
// Internal constants
import { NETWORK } from "@/constants";
// Internal config
import { config } from "@/config";
// Internal enrty functions
import { mintNFT } from "@/entry-functions/mint_nft";

interface HeroSectionProps { }

export const HeroSection: React.FC<HeroSectionProps> = () => {
  const { data } = useGetCollectionData();
  const queryClient = useQueryClient();
  const { account, signAndSubmitTransaction } = useWallet();
  const [nftCount, setNftCount] = useState(1);

  const { userMintBalance = 0, collection, totalMinted = 0, maxSupply = 1 } = data ?? {};
  const mintUpTo = Math.min(userMintBalance, maxSupply - totalMinted);

  const mintNft = async (e: FormEvent) => {
    e.preventDefault();
    if (!account || !data?.isMintActive) return;
    if (!collection?.collection_id) return;

    const response = await signAndSubmitTransaction(
      mintNFT({ collectionId: collection.collection_id, amount: nftCount }),
    );
    await aptosClient().waitForTransaction({ transactionHash: response.hash });
    queryClient.invalidateQueries();
    setNftCount(1);
  };

  return (
    <section className="hero-container flex flex-col md:flex-row gap-6 px-4 max-w-screen-xl mx-auto w-full">
      <div className="grid gap-4 md:basis-2/5 w-full">
        <div>
          <Image
            src={collection?.cdn_asset_uris.cdn_image_uri ?? collection?.cdn_asset_uris.cdn_animation_uri ?? Placeholder1.src}
            className="w-full aspect-square object-cover self-center rounded-lg"
          />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Image className="h-auto max-w-full rounded-lg" src="https://flowbite.s3.amazonaws.com/docs/gallery/square/image-1.jpg" alt="" />
          </div>
          <div>
            <Image className="h-auto max-w-full rounded-lg" src="https://flowbite.s3.amazonaws.com/docs/gallery/square/image-1.jpg" alt="" />
          </div>
          <div>
            <Image className="h-auto max-w-full rounded-lg" src="https://flowbite.s3.amazonaws.com/docs/gallery/square/image-2.jpg" alt="" />
          </div>
          <div>
            <Image className="h-auto max-w-full rounded-lg" src="https://flowbite.s3.amazonaws.com/docs/gallery/square/image-3.jpg" alt="" />
          </div>
          <div>
            <Image className="h-auto max-w-full rounded-lg" src="https://flowbite.s3.amazonaws.com/docs/gallery/square/image-4.jpg" alt="" />
          </div>
          <div>
            <Image className="h-auto max-w-full rounded-lg" src="https://flowbite.s3.amazonaws.com/docs/gallery/square/image-5.jpg" alt="" />
          </div>
        </div>
      </div>

      <div className="basis-3/5 flex flex-col gap-4">
        <h1 className="title-md">{collection?.collection_name ?? config.defaultCollection?.name}</h1>
        {/* <Socials /> */}
        <p className="body-sm">{collection?.description ?? config.defaultCollection?.description}</p>

        <div className="flex flex-row gap-6 w-full">
          <div className="flex flex-col gap-4 w-full items-center border border-indigo-800 rounded-lg py-4 shadow-md">
            <p className="text-base font-bold text-center">Property Fair Value</p>
            <p className="text-base font-normal text-secondary-text">$ 425000</p>
          </div>
          <div className="flex flex-col gap-4 w-full items-center border border-indigo-800 rounded-lg py-4 shadow-md">
            <p className="text-base font-bold text-center">Annual Rental Yield</p>
            <p className="text-base font-normal text-secondary-text">14 %</p>
          </div>
        </div>

        <div className="flex gap-x-2 items-center flex-wrap justify-between">
          <p className="whitespace-nowrap body-sm-semibold">Collection Address</p>

          <div className="flex gap-x-2">
            <AddressButton address={collection?.collection_id ?? ""} />
            <a
              className={buttonVariants({ variant: "link" })}
              target="_blank"
              href={`https://explorer.aptoslabs.com/account/${collection?.collection_id}?network=${NETWORK}`}
            >
              View on Explorer <Image src={ExternalLink.src} />
            </a>
          </div>
        </div>

        <div>
          {data?.startDate && new Date() < data.startDate && (
            <div className="flex gap-x-2 justify-between flex-wrap">
              <p className="body-sm-semibold">Minting starts</p>
              <p className="body-sm">{formatDate(data.startDate)}</p>
            </div>
          )}

          {data?.endDate && new Date() < data.endDate && !data.isMintInfinite && (
            <div className="flex gap-x-2 justify-between flex-wrap">
              <p className="body-sm-semibold">Minting ends</p>
              <p className="body-sm">{formatDate(data.endDate)}</p>
            </div>
          )}

          {data?.endDate && new Date() > data.endDate && <p className="body-sm-semibold">Minting has ended</p>}
        </div>
      </div>
    </section>
  );
};

const AddressButton: FC<{ address: string }> = ({ address }) => {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    if (copied) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  }

  return (
    <Button onClick={onCopy} className="whitespace-nowrap flex gap-1 px-0 py-0" variant="link">
      {copied ? (
        "Copied!"
      ) : (
        <>
          {truncateAddress(address)}
          <Image src={Copy.src} className="dark:invert" />
        </>
      )}
    </Button>
  );
};
