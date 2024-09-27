import { FC, useEffect, useState } from "react";
// Internal assets
import Copy from "@/assets/icons/copy.svg";
import ExternalLink from "@/assets/icons/external-link.svg";
import Placeholder1 from "@/assets/placeholders/bear-1.jpg";
// Internal utils
import { truncateAddress } from "@/utils/truncateAddress";
import { formatDate } from "@/utils/formatDate";
// Internal hooks
// Internal components
import { Image } from "@/components/ui/image";
import { Button, buttonVariants } from "@/components/ui/button";
// Internal constants
import { NETWORK } from "@/constants";


interface PropertyHeroSectionProps {
  tokenId: string | undefined;
  propertyName: string | undefined;
  propertyMetadata: any;
  listingInfo: any;
}

export const PropertyHeroSection: React.FC<PropertyHeroSectionProps> = ({
  tokenId,
  propertyName,
  propertyMetadata,
  listingInfo
}) => {
  const [additionalImages, setAdditionalImages] = useState<Array<any>>([])

  const start_date = new Date(listingInfo?.start_date * 1000);
  const end_date = new Date(listingInfo?.end_date * 1000);

  useEffect(() => {
    if (!propertyMetadata) return;

    try {
      fetch(propertyMetadata.properties.additional_images)
        .then((res) => {
          res.json()
            .then((payloads) => {
              let images: Array<string> = []
              for (const [key, _] of Object.entries(payloads.paths)) {
                if (!key.startsWith("main")) {
                  images.push(`${propertyMetadata.properties.additional_images}/${key}`)
                }
              }
              setAdditionalImages(images)
            })
        }
        )
    } catch (e) {
      console.error(e)
    }
  }, [propertyMetadata])

  return (
    <section className="hero-container flex flex-col md:flex-row gap-6 px-4 max-w-screen-xl mx-auto w-full">
      <div className="grid gap-4 md:basis-2/5 w-full">
        <div>
          <Image
            src={propertyMetadata?.image ?? Placeholder1.src}
            className="w-full aspect-square object-cover self-center rounded-lg"
          />
        </div>
        <div className="grid grid-cols-3 gap-4">
          {
            additionalImages?.length > 0 && additionalImages.map((el, idx) => (
              <div key={idx}>
                <Image className="h-auto max-w-full rounded-lg" src={el} alt="" />
              </div>
            ))
          }
        </div>
      </div>

      <div className="basis-3/5 flex flex-col gap-4">
        <h1 className="title-md">
          {propertyName}
        </h1>
        <h1 className="title-sm">
          {propertyMetadata?.properties?.address}
        </h1>
        <p className="body-sm">
          {propertyMetadata?.properties?.marketing_description}
        </p>

        <div className="flex flex-row gap-6 w-full">
          <div className="flex flex-col gap-4 w-full items-center border border-indigo-800 rounded-lg py-4 shadow-md">
            <p className="text-base font-bold text-center">Property Fair Value</p>
            <p className="text-base font-normal text-secondary-text">$ {propertyMetadata?.properties?.property_value}</p>
          </div>
          <div className="flex flex-col gap-4 w-full items-center border border-indigo-800 rounded-lg py-4 shadow-md">
            <p className="text-base font-bold text-center">Annual Rental Yield</p>
            <p className="text-base font-normal text-secondary-text">{propertyMetadata?.properties?.rental_yield} %</p>
          </div>
        </div>

        <div className="flex gap-x-2 items-center flex-wrap justify-between">
          <p className="whitespace-nowrap body-sm-semibold">Token Address</p>

          <div className="flex gap-x-2">
            <AddressButton address={tokenId ?? ""} />
            <a
              className={buttonVariants({ variant: "link" })}
              target="_blank"
              href={`https://explorer.aptoslabs.com/account/${tokenId}?network=${NETWORK}`}
            >
              View on Explorer <Image src={ExternalLink.src} />
            </a>
          </div>
        </div>

        <div>
          {new Date() < start_date && (
            <div className="flex gap-x-2 justify-between flex-wrap">
              <p className="body-sm-semibold">Minting starts</p>
              <p className="body-sm">{formatDate(start_date)}</p>
            </div>
          )}

          {new Date() < end_date && (
            <div className="flex gap-x-2 justify-between flex-wrap">
              <p className="body-sm-semibold">Minting ends</p>
              <p className="body-sm">{formatDate(end_date)}</p>
            </div>
          )}

          {new Date() > end_date && <p className="body-sm-semibold">Minting has ended</p>}
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
