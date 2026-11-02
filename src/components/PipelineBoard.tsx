"use client";

import React, { useState } from "react";
import { DollarSign, User, Building, ArrowRight, ArrowLeft, Plus } from "lucide-react";
import { moveDealStageAction } from "@/app/actions/crm";
import { Button } from "./ui/Button";
import Link from "next/link";

interface PipelineStageWithDeals {
  id: string;
  name: string;
  displayOrder: number;
  color: string;
  isWon: boolean;
  isLost: boolean;
  totalValue: number;
  dealCount: number;
  deals: {
    id: string;
    title: string;
    value: number;
    currency: string;
    probability: number;
    organization?: { id: string; name: string } | null;
    contact?: { id: string; firstName: string; lastName: string } | null;
    owner?: { id: string; name: string } | null;
  }[];
}

interface PipelineBoardProps {
  stages: PipelineStageWithDeals[];
  canEdit: boolean;
}

export function PipelineBoard({ stages, canEdit }: PipelineBoardProps) {
  const [movingDealId, setMovingDealId] = useState<string | null>(null);

  async function handleMoveStage(dealId: string, destinationStageId: string) {
    if (!canEdit || movingDealId) return;
    setMovingDealId(dealId);
    try {
      await moveDealStageAction({
        dealId,
        destinationStageId,
      });
    } catch (err: any) {
      alert(err.message || "Failed to advance stage.");
    } finally {
      setMovingDealId(null);
    }
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-6 pt-2 select-none min-h-[calc(100vh-220px)]">
      {stages.map((stage, stageIndex) => {
        const prevStage = stageIndex > 0 ? stages[stageIndex - 1] : null;
        const nextStage = stageIndex < stages.length - 1 ? stages[stageIndex + 1] : null;

        return (
          <div
            key={stage.id}
            className="flex-shrink-0 w-80 bg-slate-50/80 rounded-xl border border-slate-200 flex flex-col max-h-[80vh]"
          >
            {/* Column Header */}
            <div className="p-3.5 border-b border-slate-200/80 bg-white rounded-t-xl">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: stage.color || "#3b82f6" }}
                  />
                  <h3 className="text-sm font-bold text-slate-800">{stage.name}</h3>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {stage.dealCount}
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-500">
                ${stage.totalValue.toLocaleString()}
              </p>
            </div>

            {/* Deal Cards Container */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {stage.deals.map((deal) => {
                const isMoving = movingDealId === deal.id;

                return (
                  <div
                    key={deal.id}
                    className={`bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs hover:shadow-md transition-all ${
                      isMoving ? "opacity-50 pointer-events-none" : ""
                    }`}
                  >
                    <Link
                      href={`/deals/${deal.id}`}
                      className="text-sm font-semibold text-slate-900 hover:text-blue-600 block line-clamp-2 mb-1.5 transition-colors"
                    >
                      {deal.title}
                    </Link>

                    <div className="flex items-center justify-between text-xs font-bold text-emerald-600 mb-2">
                      <span>
                        ${deal.value.toLocaleString()} {deal.currency}
                      </span>
                      <span className="text-[11px] font-normal text-slate-400">
                        {deal.probability}% prob
                      </span>
                    </div>

                    {deal.organization && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1 truncate">
                        <Building className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
                        <span className="truncate">{deal.organization.name}</span>
                      </div>
                    )}

                    {deal.contact && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2 truncate">
                        <User className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
                        <span className="truncate">
                          {deal.contact.firstName} {deal.contact.lastName}
                        </span>
                      </div>
                    )}

                    {/* Quick Move Controls */}
                    {canEdit && (
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-2">
                        {prevStage ? (
                          <button
                            onClick={() => handleMoveStage(deal.id, prevStage.id)}
                            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            title={`Move back to ${prevStage.name}`}
                          >
                            <ArrowLeft className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <div />
                        )}

                        {nextStage ? (
                          <button
                            onClick={() => handleMoveStage(deal.id, nextStage.id)}
                            className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors flex items-center gap-1 text-[11px] font-medium"
                            title={`Advance to ${nextStage.name}`}
                          >
                            <span>Next</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <div />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {stage.deals.length === 0 && (
                <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg">
                  No deals in this stage
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
