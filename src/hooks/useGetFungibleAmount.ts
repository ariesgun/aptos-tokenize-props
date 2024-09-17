import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useQuery } from "@tanstack/react-query";

import { aptosClient } from "@/utils/aptosClient";
import { getActiveOrNextMintStage } from "@/view-functions/getActiveOrNextMintStage";
import { getMintStageStartAndEndTime } from "@/view-functions/getMintStageStartAndEndTime";
import { getUserMintBalance } from "@/view-functions/getUserMintBalance";
import { COLLECTION_ADDRESS } from "@/constants";
import { getMintEnabled } from "@/view-functions/getMintEnabled";

export interface Token {
  token_name: string;
  token_data_id: string;
  token_uri: string;
}

export interface Collection {
  creator_address: string;
  collection_id: string;
  collection_name: string;
  current_supply: number;
  max_supply: number;
  uri: string;
  description: string;
  cdn_asset_uris: {
    cdn_animation_uri: string;
    cdn_image_uri: string;
  };
}

interface MintQueryResult {
  current_token_datas_v2: Array<Token>;
}
interface TokenQueryResult {
  current_fungible_asset_balances: Array<any>;
}

interface MintData {
  maxSupply: number;
  totalMinted: number;
  uniqueHolders: number;
  userMintBalance: number;
  collection: Collection;
  startDate: Date;
  endDate: Date;
  isMintActive: boolean;
  isMintInfinite: boolean;
}

export function useGetFungibleAmountByOwner(owner_address: string, collection_address: string = COLLECTION_ADDRESS) {

  return useQuery({
    queryKey: ["owner-fungible", owner_address],
    refetchInterval: 1000 * 30,
    queryFn: async () => {
      try {
        if (!owner_address) return null;

        const fungible_res = await aptosClient().queryIndexer<TokenQueryResult>({
          query: {
            variables: {
              owner_address: owner_address,
            },
            query: `
						query PropsTokenQuery($owner_address: String) {
							current_fungible_asset_balances(
                  where: { owner_address: { _eq: $owner_address } }
              ) {
                  amount_v2
                  asset_type_v2
                  metadata {
                      icon_uri
                      maximum_v2
                      project_uri
                      supply_aggregator_table_handle_v1
                      supply_aggregator_table_key_v1
                      supply_v2
                      symbol
                      token_standard
                  }
							}
						}`,
          },
        });

        const token_data_res = await aptosClient().queryIndexer<MintQueryResult>({
          query: {
            variables: {
              collection_id: collection_address,
            },
            query: `
              query PropsTokenQuery($collection_id: String) {
                current_token_datas_v2(
                    where: { current_collection: {collection_id: { _eq: $collection_id } } }
                ) {
                    decimals
                    is_deleted_v2
                    is_fungible_v2
                    token_name
                    token_properties
                    token_uri
                    token_data_id
                    collection_id
                    description
                    current_collection {
                        collection_id
                        collection_name
                        collection_properties
                        creator_address
                        current_supply
                        description
                        max_supply
                        table_handle_v1
                        token_standard
                        total_minted_v2
                        uri
                    }
                }
              }`,
          },
        });

        const token_datas = token_data_res.current_token_datas_v2;
        if (!token_datas) return null;

        const fungible_assets = fungible_res.current_fungible_asset_balances;
        if (!fungible_assets || fungible_assets.length == 0) return {};

        return {
          tokens_data: token_datas,
          fungible_assets: fungible_assets
        }
      } catch (error) {
        console.error("Error", error);
        return null;
      }
    },
  });
}
