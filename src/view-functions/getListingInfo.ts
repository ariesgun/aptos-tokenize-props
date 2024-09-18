import { AccountAddress } from "@aptos-labs/ts-sdk";
import { aptosClient } from "@/utils/aptosClient";
import { MODULE_ADDRESS } from "@/constants";

type GetListingInfoArguments = {
    listing_obj_addr: string;
};

export const getListingInfo = async ({ listing_obj_addr }: GetListingInfoArguments) => {
    const registry = await aptosClient().view<[[any], ...any]>({
        payload: {
            function: `${AccountAddress.from(MODULE_ADDRESS!)}::controller::get_listing_info`,
            functionArguments: [listing_obj_addr],
        },
    });
    let listing_info = registry;

    return {
        address: listing_obj_addr,
        status: listing_info[0],
        start_date: parseInt(listing_info[1]),
        end_date: parseInt(listing_info[2]),
        funding_target: parseInt(listing_info[3]),
        token_price: parseInt(listing_info[4]),
        minting_fee: parseInt(listing_info[5]),
        ownership_token: listing_info[6],
        reward_pool: listing_info[7]
    }
};
