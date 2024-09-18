import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "../ui/dialog";

import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { aptosClient } from "@/utils/aptosClient";
import { claimReward } from "@/entry-functions/claim_reward";
//
interface ClaimRewardDialogProps {
  tokenShare: string;
  tokenSymbol: string;
  listingInfo: any;
  children: any;
}

export const ClaimRewardDialog: React.FC<ClaimRewardDialogProps> = ({
  listingInfo,
  tokenShare,
  tokenSymbol,
  children
}) => {

  const { account, signAndSubmitTransaction } = useWallet();

  const onClaimReward = async (_: any) => {
    if (!account) return;
    if (!listingInfo) return;

    const response = await signAndSubmitTransaction(
      claimReward({ rewardPool: listingInfo.reward_pool }),
    );
    await aptosClient().waitForTransaction({ transactionHash: response.hash });
  }

  console.log(listingInfo)
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Claim Rewards</DialogTitle>
          <DialogDescription>
            Claim the dividend earned from this property. The amount is proportional to the number of your shares.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Number of Shares
            </Label>
            <Input
              id="name"
              disabled
              value={`${tokenShare} $${tokenSymbol}`}
              className="col-span-3 disabled:opacity-80"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="username" className="text-right">
              Rewards
            </Label>
            <Input
              id="username"
              disabled
              value={`0 $${tokenSymbol}`}
              className="col-span-3 disabled:opacity-80"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onClaimReward}>Claim</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
