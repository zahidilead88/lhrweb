"use client";

// Phase 1 (docs/BLUEPRINT.md) — custom domain settings screen. The backend
// (set/verify/remove + real DNS TXT verification) already existed; this is
// the first UI that ever calls it.

import { useState } from "react";
import { Globe, CheckCircle2, Clock, Copy, Trash2 } from "lucide-react";
import { ModalShell, inputCls, lblCls } from "./AiModals";

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3000";

export interface DomainState {
  customDomain?: string;
  customDomainVerified?: boolean;
}

export function DomainModal({
  projectSlug,
  domain,
  onSetDomain,
  onVerify,
  onRemove,
  onClose,
}: {
  projectSlug?: string;
  domain: DomainState;
  onSetDomain: (domain: string) => Promise<{ verificationToken: string }>;
  onVerify: () => Promise<{ verified: boolean }>;
  onRemove: () => Promise<void>;
  onClose: () => void;
}) {
  const [input, setInput] = useState(domain.customDomain || "");
  const [pendingToken, setPendingToken] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [verifyFailed, setVerifyFailed] = useState(false);

  const subdomainUrl = `${projectSlug || "your-site"}.${ROOT_DOMAIN}`;
  const hasDomain = !!domain.customDomain;
  const verified = !!domain.customDomainVerified;

  const copy = (text: string) => navigator.clipboard?.writeText(text).catch(() => {});

  return (
    <ModalShell title="Domains" icon={<Globe size={14} />} onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className={lblCls}>Your free URL</label>
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
            <span className="text-[12px] text-gray-600 font-mono truncate flex-1">{subdomainUrl}</span>
            <button onClick={() => copy(subdomainUrl)} className="text-gray-400 hover:text-gray-700 shrink-0" title="Copy">
              <Copy size={13} />
            </button>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <div className="flex items-center justify-between mb-1.5">
            <label className={`${lblCls} mb-0`}>Custom domain</label>
            {hasDomain && (
              verified ? (
                <span className="flex items-center gap-1 text-[10px] font-bold text-green-600"><CheckCircle2 size={11} /> Verified</span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] font-bold text-amber-500"><Clock size={11} /> Pending verification</span>
              )
            )}
          </div>

          {!hasDomain ? (
            <div className="flex gap-2">
              <input
                className={inputCls}
                value={input}
                onChange={(e) => { setInput(e.target.value); setVerifyFailed(false); }}
                placeholder="www.yoursite.com"
              />
              <button
                onClick={async () => {
                  if (!input.trim()) return;
                  setSaving(true);
                  try {
                    const { verificationToken } = await onSetDomain(input.trim());
                    setPendingToken(verificationToken);
                  } finally {
                    setSaving(false);
                  }
                }}
                disabled={saving || !input.trim()}
                className="px-4 rounded-lg bg-gray-900 text-white text-[12px] font-bold disabled:opacity-40 transition-all shrink-0"
              >
                {saving ? "Adding…" : "Add"}
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg mb-3">
                <span className="text-[12px] text-gray-700 font-mono truncate flex-1">{domain.customDomain}</span>
                <button
                  onClick={async () => { setRemoving(true); try { await onRemove(); setInput(""); setPendingToken(null); } finally { setRemoving(false); } }}
                  disabled={removing}
                  className="text-gray-400 hover:text-red-500 shrink-0 disabled:opacity-40"
                  title="Remove domain"
                >
                  <Trash2 size={13} />
                </button>
              </div>

              {!verified && (
                <div className="space-y-3">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-[11.5px] text-amber-800 leading-relaxed">
                    <p className="font-bold mb-1">Add this DNS TXT record to verify ownership:</p>
                    <div className="flex items-center gap-2 bg-white border border-amber-200 rounded-md px-2 py-1.5 mt-1.5">
                      <code className="font-mono text-[11px] text-gray-700 truncate flex-1">
                        _lhrweb-verify.{domain.customDomain}
                      </code>
                      <button onClick={() => copy(`_lhrweb-verify.${domain.customDomain}`)} className="text-gray-400 hover:text-gray-700 shrink-0">
                        <Copy size={12} />
                      </button>
                    </div>
                    {pendingToken && (
                      <div className="flex items-center gap-2 bg-white border border-amber-200 rounded-md px-2 py-1.5 mt-1.5">
                        <code className="font-mono text-[11px] text-gray-700 truncate flex-1">{pendingToken}</code>
                        <button onClick={() => copy(pendingToken)} className="text-gray-400 hover:text-gray-700 shrink-0">
                          <Copy size={12} />
                        </button>
                      </div>
                    )}
                    {!pendingToken && (
                      <p className="mt-1.5 text-amber-700">Re-add the domain if you need the verification value again.</p>
                    )}
                  </div>

                  {verifyFailed && (
                    <p className="text-[11.5px] text-red-500">DNS record not found yet — it can take a few minutes to propagate. Try again shortly.</p>
                  )}

                  <button
                    onClick={async () => {
                      setVerifying(true);
                      setVerifyFailed(false);
                      try {
                        const { verified: ok } = await onVerify();
                        if (!ok) setVerifyFailed(true);
                      } finally {
                        setVerifying(false);
                      }
                    }}
                    disabled={verifying}
                    className="w-full py-2.5 text-[12px] font-bold text-white bg-gray-900 rounded-xl hover:bg-black disabled:opacity-50 transition-all"
                  >
                    {verifying ? "Checking DNS…" : "Verify domain"}
                  </button>
                </div>
              )}

              {verified && (
                <p className="text-[11.5px] text-gray-500">
                  Live at <span className="font-mono text-gray-700">{domain.customDomain}</span>. Point its DNS A/CNAME record at this app to finish going live.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </ModalShell>
  );
}
