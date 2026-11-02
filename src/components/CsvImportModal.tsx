"use client";

import React, { useState } from "react";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { Upload, AlertCircle, CheckCircle2, FileText } from "lucide-react";

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultEntity?: "organizations" | "contacts" | "leads";
  onSuccess?: () => void;
}

export function CsvImportModal({
  isOpen,
  onClose,
  defaultEntity = "organizations",
  onSuccess,
}: CsvImportModalProps) {
  const [entity, setEntity] = useState(defaultEntity);
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleImport(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;

    setIsSubmitting(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`/api/import/${entity}`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setResult(data.result);
        if (onSuccess) onSuccess();
      } else {
        setError(data.error || "Failed to process import.");
      }
    } catch (err: any) {
      setError(err.message || "Network error during import.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleReset() {
    setFile(null);
    setResult(null);
    setError(null);
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Import Records via CSV"
      description="Upload a CSV file to batch create records safely in your active workspace."
      maxWidth="lg"
    >
      {!result ? (
        <form onSubmit={handleImport} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Target Entity</label>
            <select
              value={entity}
              onChange={(e) => setEntity(e.target.value as any)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="organizations">Organizations</option>
              <option value="contacts">Contacts</option>
              <option value="leads">Leads</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">CSV File</label>
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-blue-500 transition-colors">
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="hidden"
                id="csv-file-input"
              />
              <label htmlFor="csv-file-input" className="cursor-pointer flex flex-col items-center">
                <Upload className="w-8 h-8 text-slate-400 mb-2" />
                <span className="text-sm font-semibold text-blue-600">Click to choose a file</span>
                <span className="text-xs text-slate-400 mt-0.5">CSV format, UTF-8 encoded</span>
              </label>
              {file && (
                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium">
                  <FileText className="w-4 h-4" />
                  <span>{file.name}</span> ({(file.size / 1024).toFixed(1)} KB)
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={!file} isLoading={isSubmitting}>
              Upload & Import
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <h4 className="text-base font-bold text-slate-900">Import Processing Complete</h4>
            <div className="flex items-center justify-center gap-6 mt-3 text-sm">
              <div>
                <span className="text-slate-400 block text-xs">Total</span>
                <span className="font-bold text-slate-800">{result.totalRows}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-xs">Imported</span>
                <span className="font-bold text-emerald-600">{result.successRows}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-xs">Failed</span>
                <span className="font-bold text-rose-600">{result.failedRows}</span>
              </div>
            </div>
          </div>

          {result.errors && result.errors.length > 0 && (
            <div>
              <h5 className="text-xs font-bold text-slate-700 uppercase mb-2">Row Level Errors</h5>
              <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-lg">
                {result.errors.map((e: any, idx: number) => (
                  <div key={idx} className="p-2.5 text-xs">
                    <span className="font-bold text-rose-600">Row {e.row}:</span>{" "}
                    <span className="text-slate-600">{e.error}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={handleReset}>
              Import Another File
            </Button>
            <Button variant="primary" onClick={onClose}>
              Done
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
