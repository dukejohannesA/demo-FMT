import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import type { EngineResults } from "@/lib/engine";
import { fmt } from "@/lib/engine";
import type { Assumptions } from "@/lib/engine";

export function buildContext(r: EngineResults, a: Assumptions): string {
  const v = r.verdicts;
  return `PROJECT: Alfred's City Urban Electrification | 10-Year Model (2025–2034)
Total HH Target (input): ${a.totalHH} HH
Households connected by Year 10: ${r.cumHH[9]} HH
Total CapEx: NAD ${fmt.nadm(r.totalCapex10)}m
10-yr Revenue: NAD ${fmt.nadm(r.totalRevenue10)}m
10-yr EBITDA: NAD ${fmt.nadm(r.totalEBITDA10)}m
Project IRR: ${r.irr == null ? "n/a" : (r.irr * 100).toFixed(1) + "%"}
NPV (8%): NAD ${fmt.nadm(r.npv)}m
Avg DSCR: ${r.avgDSCR.toFixed(2)}×
Total Grant Required: NAD ${fmt.nadm(r.totalGrant10)}m
Grant per HH: NAD ${fmt.num(r.grantPerHH, 0)}
Financing gap: NAD ${fmt.nadm(r.financingGap.reduce((a,b)=>a+b,0))}m
Blended tariff: ${r.blendedTariff.toFixed(2)} NAD/kWh
Margin/kWh: ${r.marginPerKWhBlended.toFixed(2)}
Cross-subsidy loss/kWh: ${r.crossSubsidyLossPerKWh.toFixed(2)}

YEAR-BY-YEAR FCF (NADm): ${r.fcf.map((v)=>(v/1e6).toFixed(1)).join(", ")}
YEAR-BY-YEAR DSCR: ${r.dscr.map((d)=>d==null?"—":(d as number).toFixed(2)).join(", ")}
YEAR-BY-YEAR EBITDA (NADm): ${r.ebitda.map((v)=>(v/1e6).toFixed(1)).join(", ")}

LAYER VERDICTS:
- Urban Planning: ${v.layer1 ? "PASS" : "WARN"}
- RED Grid: ${v.layer2 ? "PASS – positive margin" : "WARN – negative margin"}
- Tariff Viability: ${v.layer3 ? "PASS" : `WARN – cross-subsidy of NAD ${v.layer3Loss.toFixed(2)}/kWh`}
- Financing: ${v.layer4 ? "PASS" : `WARN – grant share ${(v.layer4GrantPct*100).toFixed(0)}%`}
- Macroeconomic: ${v.layer5 ? "PASS – GDP > CapEx" : "WARN"}
- OVERALL: ${v.overall}

SOLAR SCENARIOS:
- No Solar 10-yr bulk cost: NAD ${fmt.nadm(r.solar.noSolar.totalCost)}m
- 5MW Solar 10-yr saving: NAD ${fmt.nadm(r.solar.fiveMW.totalSaving)}m
- 10MW Solar 10-yr saving: NAD ${fmt.nadm(r.solar.tenMW.totalSaving)}m
- CO₂ avoided (5MW): ${fmt.num(r.solar.fiveMW.totalCO2, 0)} tCO₂`;
}

export function ChatPanel({ r, a }: { r: EngineResults; a: Assumptions }) {
  const [expanded, setExpanded] = useState(false);
  const [open, setOpen] = useState(true);
  const [input, setInput] = useState("");
  const [updated, setUpdated] = useState(false);
  const ctxRef = useRef(buildContext(r, a));


  useEffect(() => {
    ctxRef.current = buildContext(r, a);
    setUpdated(true);
    const t = setTimeout(() => setUpdated(false), 1500);
    return () => clearTimeout(t);
  }, [r]);

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: () => ({ context: ctxRef.current }),
    }),
  });
  const isLoading = status === "submitted" || status === "streaming";

  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function send(text: string) {
    if (!text.trim() || isLoading) return;
    sendMessage({ text: text.trim() });
    setInput("");
  }

  const height = !open ? "h-10" : expanded ? "h-[50vh]" : "h-[260px]";

  return (
    <section className={`border-t border-border bg-panel transition-all ${height} flex flex-col`}>
      <div className="flex items-center justify-between px-3 py-2 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">AI Chat — Groq / Llama 3.3</span>
          {updated && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary border border-primary/40">
              Context updated
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs">
          {open && (
            <>
              <button onClick={() => send("Give me a plain-language summary of all five layer verdicts and the overall investment viability.")} className="px-2 py-0.5 rounded border border-border hover:bg-accent">
                Explain current results
              </button>
              <button onClick={() => send("What changed in the latest assumption update? Refer only to the current numbers.")} className="px-2 py-0.5 rounded border border-border hover:bg-accent">
                What changed?
              </button>
              <button onClick={() => setExpanded((e) => !e)} className="px-2 py-0.5 rounded border border-border hover:bg-accent">
                {expanded ? "Shrink" : "Expand"}
              </button>
            </>
          )}
          <button onClick={() => setOpen((o) => !o)} className="px-2 py-0.5 rounded border border-border hover:bg-accent">
            {open ? "Hide ▼" : "Show ▲"}
          </button>
        </div>
      </div>

      {open && (
        <>
          <div className="flex-1 overflow-y-auto scrollbar-thin px-3 py-2 space-y-2 text-sm">
            {messages.length === 0 && (
              <div className="text-muted-foreground text-xs">
                Ask about NPV, IRR, DSCR, grant dependency, cross-subsidy, solar savings, or any layer verdict. The assistant explains the numbers but never recalculates them.
              </div>
            )}
            {messages.map((m) => {
              const text = m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
              const isUser = m.role === "user";
              return (
                <div key={m.id} className={isUser ? "flex justify-end" : ""}>
                  <div className={
                    isUser
                      ? "max-w-[80%] rounded px-3 py-1.5 bg-primary text-primary-foreground text-sm"
                      : "max-w-[90%] text-foreground text-sm leading-relaxed [&_strong]:font-semibold [&_strong]:text-white [&_ol]:list-decimal [&_ol]:pl-4 [&_ol]:space-y-1 [&_ul]:list-disc [&_ul]:pl-4 [&_ul]:space-y-1 [&_p]:mb-2 [&_h3]:font-semibold [&_h3]:text-white [&_h3]:mt-2"
                  }>
                    {isUser ? text : <ReactMarkdown>{text}</ReactMarkdown>}
                  </div>
                </div>
              );
            })}
            {isLoading && <div className="text-xs text-muted-foreground italic">Thinking…</div>}
            {error && <div className="text-xs text-neg">{error.message}</div>}
            <div ref={endRef} />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="border-t border-border p-2 flex gap-2 shrink-0"
          >
            <input
              autoFocus
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about the financial model results…"
              className="flex-1 bg-input rounded px-3 py-1.5 text-sm border border-border focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-3 py-1.5 rounded bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </>
      )}
    </section>
  );
}