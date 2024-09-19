import React from "react";
import { ApiMarket } from "./types/api";
import { Card, CardContent } from "../ui/card";

import Placeholder1 from "@/assets/placeholders/bear-1.png";
import Image from "next/image";


export const MarketDetail: React.FC<{
  selectedMarket: ApiMarket;
  propertyName: string | undefined;
  propertyMetadata: any;
}> = ({ selectedMarket, propertyName, propertyMetadata }) => {

  return (
    <>
      <div className="flex space-between w-full border-b border-neutral-600 pb-3">
        <Card className="w-full">
          <CardContent className="flex flex-col gap-6 pt-6">
            <h1 className="text-2xl font-bold">Market Detail</h1>
            <div className="flex flex-row gap-6">
              <div>
                <Image
                  src={propertyMetadata?.image ?? Placeholder1.src}
                  className="object-cover self-center rounded-lg"
                  width={400}
                  height={400}
                  alt="" />

              </div>
              <div className="basis-3/5 flex flex-col gap-2">
                <h1 className="text-lg font-bold">
                  {propertyName}
                </h1>
                <h1 className="text-base">
                  {propertyMetadata?.properties?.address}
                </h1>
                <div className="mt-4">
                  <p className="text-sm">
                    {propertyMetadata?.properties?.marketing_description}
                  </p>
                </div>
                <div className="mt-4">
                  <p className="text-sm font-bold">
                    {`Market: ${selectedMarket.name}`}
                  </p>
                </div>
                <div className="flex flex-row gap-6 mt-4">
                  <div className="flex flex-col gap-2 items-center border border-indigo-800 rounded-lg py-4 px-6 shadow-md">
                    <p className="text-sm font-bold text-center">Property Fair Value</p>
                    <p className="text-sm font-normal text-secondary-text">$ {propertyMetadata?.properties?.property_value}</p>
                  </div>
                  <div className="flex flex-col gap-2 items-center border border-indigo-800 rounded-lg py-4 px-6 shadow-md">
                    <p className="text-sm font-bold text-center">Annual Rental Yield</p>
                    <p className="text-sm font-normal text-secondary-text">{propertyMetadata?.properties?.rental_yield} %</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>


      </div>
    </>
  )

}