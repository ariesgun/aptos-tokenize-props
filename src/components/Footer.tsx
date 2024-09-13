import Link from "next/link";
import { WalletSelector } from "./WalletSelector";
import { buttonVariants } from "./ui/button";
import { cn } from "@/lib/utils";
import { Separator } from "./ui/separator";

export function Footer() {
    return (
        <footer className="flex w-full mx-auto bg-gray rounded-lg m-4 dark:bg-gray-800">
            <div className="flex flex-col w-full mx-auto pt-4 pb-4 gap-8">
                <Separator />
                <span className="text-md text-gray-500 sm:text-center dark:text-gray-400">© 2024 <a href="https://aptosprops.com/" className="hover:underline">Flowbite™</a>.  All Rights Reserved.
                </span>
            </div>
        </footer>
    );
}









