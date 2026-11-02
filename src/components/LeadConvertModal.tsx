"use client";

import React, { useState } from "react";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { convertLeadToDealAction } from "@/app/actions/crm";
import { ArrowRight, CheckCircle2 } from "lucide-react";

interface PipelineStageOption {
  id: string;
  name: string;
  color: string;
}

interface LeadConvertModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: {
    id: string;
    title: string;
    estimatedValue: number;
    contact?: { firstName: string; lastName: string } | null;
    organization?: { name: string } | null;
  };
  stages: PipelineStageOption[];
  onSuccess?: () => void;
}

export function LeadConvertModal({
  isOpen,
  onClose,
  lead,
  stages,
  onSuccess,
}: LeadConvertModalProps) {
  const [dealTitle, setDealTitle] = useState(lead.title);
  const [stageId, setStageId] = useState(stages[0]?.id || "");
  const [value, setValue] = useState(lead.estimatedValue || 0);
  const [currency, setCurrency] = useState("USD");
  const [expectedCloseDate, setExpectedCloseDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConvert(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await convertLeadToDealAction({
        leadId: lead.id,
        dealTitle,
        stageId,
        value: Number(value),
        currency,
        expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate).toISOString() : null,
      });

      if (res?.success) {
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setError("Failed to convert lead.");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during conversion.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Convert Lead to Deal"
      description="Create a qualified sales deal and advance through your pipeline."
    >
      <form onSubmit={handleConvert} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-700">
            {error}
          </div>
        )}

        {/* Lead Context Summary */}
        <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
          <p>
            <span className="font-semibold text-slate-800">Source Lead:</span> {lead.title}
          </p>
          {lead.organization && (
            <p>
              <span className="font-semibold text-slate-800">Company:</span>{" "}
              {lead.organization.name}
            </p>
          )}
          {lead.contact && (
            <p>
              <span className="font-semibold text-slate-800">Contact:</span>{" "}
              {lead.contact.firstName} {lead.contact.lastName}
            </p>
          )}
        </div>

        {/* Deal Title */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            New Deal Title <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={dealTitle}
            onChange={(e) => setDealTitle(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Destination Stage */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Initial Pipeline Stage <span className="text-rose-500">*</span>
          </label>
          <select
            value={stageId}
            onChange={(e) => setStageId(e.target.value)}
            required
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            {stages.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Value & Currency */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Deal Value</label>
            <input
              type="number"
              min="0"
              step="any"
              value={value}
              onChange={(e) => setValue(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="SEK">SEK (kr)</option>
            </select>
          </div>
        </div>

        {/* Expected Close Date */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Target Close Date
          </label>
          <input
            type="date"
            value={expectedCloseDate}
            onChange={(e) => setExpectedCloseDate(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            <CheckCircle2 className="w-4 h-4 mr-1" />
            Complete Conversion
          </Button>
        </div>
      </form>
    </Modal>
  );
}
