import { useQuery } from "@tanstack/react-query";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import React from "react";

import Skeleton from "@/components/Skeleton";
import { API_URL } from "@/env";
import { type ApiMarket, type TradeHistory } from "./types/api";
import { toDecimalPrice, toDecimalSize } from "@/utils/econia";

import { TokenSymbol } from "./TokenSymbol";

const columnHelper = createColumnHelper<TradeHistory>();

export const TradeHistoryTable: React.FC<{
  className?: string;
  marketData: ApiMarket;
  marketId: number;
}> = ({ className, marketData, marketId }) => {
  const { base, quote } = marketData;
  const baseSymbol = base?.symbol;
  const quoteSymbol = quote?.symbol;

  const { data, isLoading } = useQuery<TradeHistory[]>({
    queryKey: ["useTradeHistory", marketData.market_id],
    queryFn: async () => {
      const response = await fetch(
        `${API_URL}/fill_events_deduped?order=txn_version.desc,event_idx.desc&market_id=eq.${marketId}&limit=100`,
      );
      const data = await response.json();
      return data;
    },
  });

  const table = useReactTable({
    columns: [
      columnHelper.accessor("price", {
        cell: (info) => {
          const price = info.getValue();
          return toDecimalPrice({
            price,
            marketData,
          }).toNumber();
        },
        header: () => (
          <span className="flex items-baseline gap-2 whitespace-nowrap pt-0 md:pt-[2px]">
            PRICE <TokenSymbol symbol={quoteSymbol} />
          </span>
        ),
      }),
      columnHelper.accessor("size", {
        cell: (info) => {
          const size = info.getValue();
          return toDecimalSize({
            size,
            marketData,
          }).toNumber();
        },
        header: () => (
          <span className="flex items-baseline gap-2 whitespace-nowrap pt-0 md:pt-[2px]">
            AMOUNT <TokenSymbol symbol={baseSymbol} />
          </span>
        ),
      }),
      columnHelper.accessor("time", {
        cell: (info) => {
          const timestampString = info.getValue();
          // const timestamp = new Date(timestampString);
          // const currentTime = new Date();
          // const timeDifference = currentTime.getTime() - timestamp.getTime();
          // const hoursDifference = timeDifference / (1000 * 60 * 60);

          return (
            <div className="flex flex-row gap-2 justify-end">
              <p>
                {new Date(timestampString).toLocaleString("en", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "2-digit",
                })}
              </p>
              <p>
                {new Date(timestampString).toLocaleString("en", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                  hour12: false,
                })}
              </p>
            </div>
          );
        },
        header: () => (
          <span className="flex items-baseline justify-end gap-2 whitespace-nowrap pt-0 md:pt-[2px]">
            TIME
          </span>
        ),
      }),
    ],
    data: data || [],
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <>
      <div className="flex grow flex-col gap-2">
        <div className="flex justify-between mb-4">
          <p className="font-jost text-2xl font-bold">Trade History</p>
        </div>
        <table className={`w-full table-fixed ${className || ""}`}>
          <thead className="top-0 bg-neutral-800">
            <>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr
                  className="text-left font-roboto-mono text-base text-neutral-500 [&>th]:font-light"
                  key={headerGroup.id}
                >
                  {headerGroup.headers.map((header, i) => (
                    <th
                      className={`text-sm ${i === 0
                        ? "pl-[16px] text-left md:pl-[17.03px]"
                        : i === 1
                          ? "pl-[13.03px] text-left"
                          : "pr-[12.61px] text-right"
                        } h-[30px] w-full`}
                      key={header.id}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                    </th>
                  ))}
                </tr>
              ))}
            </>
          </thead>
        </table>
        <div className="scrollbar-none h-full w-full overflow-auto">
          <table className={`w-full table-fixed ${className || ""}`}>
            <thead className="top-0 hidden bg-neutral-800 bg-noise">
              <>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr
                    className="text-left font-roboto-mono text-base text-neutral-500 [&>th]:font-light"
                    key={headerGroup.id}
                  >
                    {headerGroup.headers.map((header, i) => (
                      <th
                        className={`text-sm ${i === 0
                          ? "pl-[16px] text-left md:pl-[17.03px]"
                          : i === 1
                            ? "pl-[13.03px] text-left"
                            : "pr-[12.61px] text-right"
                          } h-[30px] w-full`}
                        key={header.id}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                      </th>
                    ))}
                  </tr>
                ))}
                <tr>
                  <td className="p-0">
                    <div className="h-[1px] w-full bg-neutral-600"></div>
                  </td>
                </tr>
              </>
            </thead>
            <tbody>
              {isLoading || !data ? (
                <>
                  <tr>
                    {table.getAllColumns().map((column, i) => (
                      <td
                        className={`text-sm ${i === 0
                          ? "pl-[16px] text-left md:pl-[17.03px]"
                          : i === 1
                            ? "pl-[13.03px] text-left"
                            : "pr-4 text-right"
                          }`}
                        key={column.id}
                      >
                        <div className={"px-1"}>
                          <Skeleton />
                        </div>
                      </td>
                    ))}
                  </tr>
                </>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={7}></td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    className="text-left font-roboto-mono text-base uppercase [&>th]:font-light"
                    key={row.id}
                  >
                    {row.getVisibleCells().map((cell, i) => (
                      <td
                        className={`align-bottom text-sm ${i === 0
                          ? `pl-[16px] text-left md:pl-[17.03px] ${cell.row.original.maker_side
                            ? "text-green"
                            : "text-red"
                          }`
                          : i === 1
                            ? "pl-[13.03px] text-left"
                            : "pr-4 text-right"
                          }`}
                        key={cell.id}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {!isLoading && data && data.length === 0 && (
        <div className="flex h-[calc(100%-69.52px)] flex-col items-center justify-center font-roboto-mono text-sm font-light uppercase tracking-[0.2px] text-neutral-500">
          No orders to show
        </div>
      )}
    </>
  );
};
