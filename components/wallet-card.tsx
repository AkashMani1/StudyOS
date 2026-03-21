"use client";

import { motion } from "framer-motion";
import { Coins, TrendingDown, TrendingUp } from "lucide-react";
import { Card, Badge } from "@/components/ui";
import { formatDateLabel } from "@/lib/utils";
import type { WalletTransaction } from "@/types/domain";

export function WalletCard({
  coins,
  transactions
}: {
  coins: number;
  transactions: WalletTransaction[];
}) {
  return (
    <Card className="overflow-hidden bg-gradient-to-br from-indigo-950 to-indigo-800 text-white">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-white/70 font-semibold">Wallet</p>
          <h3 className="mt-3 font-display text-4xl font-bold">{coins}</h3>
          <p className="mt-2 text-sm text-white/80">Each session now has weight. Spend carefully.</p>
        </div>
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="rounded-2xl bg-white/10 p-4"
        >
          <Coins className="h-8 w-8" />
        </motion.div>
      </div>

      <div className="mt-6 space-y-3">
        {transactions.slice(0, 4).map((transaction, index) => {
          const positive = transaction.amount > 0;
          return (
            <div
              key={`${transaction.reason}-${index}`}
              className="flex items-center justify-between rounded-xl bg-white/10 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-white/10 p-2">
                  {positive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                </div>
                <div>
                  <p className="text-sm font-semibold">{transaction.reason}</p>
                  <p className="text-xs text-white/70">{formatDateLabel(transaction.timestamp)}</p>
                </div>
              </div>
              <Badge className="bg-white/10 text-white">
                {positive ? "+" : ""}
                {transaction.amount}
              </Badge>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
