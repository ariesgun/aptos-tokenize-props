import { AccountAddress, GetCollectionDataResponse } from "@aptos-labs/ts-sdk";
import { useState, useEffect } from "react";

import { aptosClient } from "@/utils/aptosClient";
import { getRegistry } from "@/view-functions/getRegistry";
import { getListings } from "@/view-functions/getListings";

/**
 * A react hook to get all collections under the current contract.
 *
 * This call can be pretty expensive when fetching a big number of collections,
 * therefore it is not recommended to use it in production
 *
 */
export function useGetListings() {
    const [collections, setCollections] = useState<Array<GetCollectionDataResponse>>([]);
    const [listings, setListings] = useState<Array<any>>([]);

    useEffect(() => {
        async function run() {
            // fetch the contract registry address
            const registry = await getListings();
            // fetch collections objects created under that contract registry address
            const objects = await getObjects(registry);
            // get each collection object data
            //   const collections = await getCollections(objects);
            //   setCollections(collections);
            setListings(objects)
        }

        run();
    }, []);

    return listings;
}

const getObjects = async (registry: [{ inner: string }]) => {
    const objects = await Promise.all(
        registry.map(async (register: { inner: string }) => {
            const formattedRegistry = AccountAddress.from(register.inner).toString();
            const object = await aptosClient().getObjectDataByObjectAddress({
                objectAddress: formattedRegistry,
            });

            return object;
        }),
    );
    return objects;
};

const getCollections = async (objects: Array<string>) => {
    const collections = await Promise.all(
        objects.map(async (object: string) => {
            const formattedObjectAddress = AccountAddress.from(object).toString();

            const collection = await aptosClient().getCollectionDataByCreatorAddress({
                creatorAddress: formattedObjectAddress,
            });

            return collection;
        }),
    );
    return collections;
};
