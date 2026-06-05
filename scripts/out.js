import { jsx, jsxs } from "react/jsx-runtime";
import { DraggableGrid } from "./ui/DraggableGrid";
import { useState } from "react";
import {
  ShieldCheck,
  Scale,
  AlertTriangle,
  FileText,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Eye,
  Gavel,
  ShieldAlert,
  Download
} from "lucide-react";
import { cn } from "../lib/utils";
const MOCK_BRANDS = [
  { id: "BRD-001", brandName: "Samsung Official Store", ownerId: "SEL-001", registrationDate: "10/01/2024", status: "verified", documents: ["GPKD.pdf", "Trademark.pdf"] },
  { id: "BRD-002", brandName: "Louis Vuitton Vietnam", ownerId: "SEL-099", registrationDate: "01/03/2024", status: "pending", documents: ["LV_Global_Auth.pdf"] }
];
const MOCK_DISPUTES = [
  { id: "DSP-102", orderId: "ORD-5541", type: "counterfeit", reporterId: "USR-882", evidence: ["img1.jpg", "video.mp4"], status: "investigating" },
  { id: "DSP-103", orderId: "ORD-8821", type: "ip_infringement", reporterId: "BRAND-OWNER-02", evidence: ["proof.pdf"], status: "open" }
];
function Compliance() {
  const [activeTab, setActiveTab] = useState("brand");
  return /* @__PURE__ */ jsxs("div", { className: "space-y-8 animate-in fade-in slide-in- duration-500 pb-12", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("div", { className: "header-title", children: [
        /* @__PURE__ */ jsx("h1", { className: "font-serif tracking-tight text-2xl font-semibold text-[#111827]", children: "Ph\xE1p ch\u1EBF & B\u1EA3o v\u1EC7 th\u01B0\u01A1ng hi\u1EC7u" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-[#6B7280] mt-1", children: "Qu\u1EA3n l\xFD b\u1EA3n quy\u1EC1n th\u01B0\u01A1ng hi\u1EC7u, x\u1EED l\xFD tranh ch\u1EA5p h\xE0ng gi\u1EA3 v\xE0 gi\xE1m s\xE1t tu\xE2n th\u1EE7 s\xE0n." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-3", children: [
        /* @__PURE__ */ jsxs("button", { className: "bg-white border border-slate-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Download, { className: "w-4 h-4" }),
          "T\u1EA3i b\xE1o c\xE1o tu\xE2n th\u1EE7"
        ] }),
        /* @__PURE__ */ jsxs("button", { className: "bg-[#2563EB] text-[#FAF9F5] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-800 transition-all shadow-sm flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(ShieldCheck, { className: "w-4 h-4" }),
          "\u0110\u0103ng k\xFD b\u1EA3o quy\u1EC1n m\u1EDBi"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(DraggableGrid, { className: "grid grid-cols-1 md:grid-cols-4 gap-6", columns: 4, gap: 24, children: [
      /* @__PURE__ */ jsxs("div", { className: "bg-white p-5 rounded-lg border border-slate-300 shadow-sm", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start mb-2", children: [
          /* @__PURE__ */ jsx("span", { className: "text-[10px] text-[#6B7280] font-bold uppercase", children: "Th\u01B0\u01A1ng hi\u1EC7u \u0111\xE3 b\u1EA3o quy\u1EC1n" }),
          /* @__PURE__ */ jsx(ShieldCheck, { className: "w-4 h-4 text-[#2563EB]" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold text-[#111827]", children: "842" }),
        /* @__PURE__ */ jsx("p", { className: "text-[10px] text-[#10B981] font-medium mt-1", children: "\u0110\xE3 x\xE1c th\u1EF1c s\u1EDF h\u1EEFu tr\xED tu\u1EC7" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-white p-5 rounded-lg border border-slate-300 shadow-sm", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start mb-2", children: [
          /* @__PURE__ */ jsx("span", { className: "text-[10px] text-[#6B7280] font-bold uppercase", children: "Tranh ch\u1EA5p \u0111ang x\u1EED l\xFD" }),
          /* @__PURE__ */ jsx(Gavel, { className: "w-4 h-4 text-orange-500" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold text-[#111827]", children: "15" }),
        /* @__PURE__ */ jsx("p", { className: "text-[10px] text-orange-600 font-medium mt-1", children: "C\u1EA7n Admin th\u1EA9m \u0111\u1ECBnh b\u1EB1ng ch\u1EE9ng" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-white p-5 rounded-lg border border-slate-300 shadow-sm", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start mb-2", children: [
          /* @__PURE__ */ jsx("span", { className: "text-[10px] text-[#6B7280] font-bold uppercase", children: "C\u1EA3nh b\xE1o vi ph\u1EA1m (Policy)" }),
          /* @__PURE__ */ jsx(AlertTriangle, { className: "w-4 h-4 text-red-500" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold text-[#111827]", children: "124" }),
        /* @__PURE__ */ jsx("p", { className: "text-[10px] text-red-600 font-medium mt-1", children: "S\u1EA3n ph\u1EA9m b\u1ECB g\u1EE1 b\u1ECF do vi ph\u1EA1m" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-white p-5 rounded-lg border border-slate-300 shadow-sm", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start mb-2", children: [
          /* @__PURE__ */ jsx("span", { className: "text-[10px] text-[#6B7280] font-bold uppercase", children: "Compliance Score" }),
          /* @__PURE__ */ jsx(Scale, { className: "w-4 h-4 text-emerald-500" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold text-emerald-600", children: "98/100" }),
        /* @__PURE__ */ jsx("p", { className: "text-[10px] text-[#6B7280] mt-1", children: "Ch\u1EC9 s\u1ED1 tu\xE2n th\u1EE7 ph\xE1p lu\u1EADt s\xE0n" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-lg border border-slate-300 shadow-sm overflow-hidden", children: [
      /* @__PURE__ */ jsx("div", { className: "flex border-b border-[#F3F4F6]", children: [
        { id: "brand", label: "Brand Portal (B\u1EA3n quy\u1EC1n)", icon: ShieldCheck },
        { id: "dispute", label: "Gi\u1EA3i quy\u1EBFt Tranh ch\u1EA5p", icon: Gavel },
        { id: "policy", label: "Gi\xE1m s\xE1t Tu\xE2n th\u1EE7", icon: ShieldAlert }
      ].map((tab) => /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => setActiveTab(tab.id),
          className: cn(
            "px-6 py-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2",
            activeTab === tab.id ? "border-[#2563EB] text-[#2563EB] bg-slate-100/30" : "border-transparent text-[#6B7280] hover:text-[#111827]"
          ),
          children: [
            /* @__PURE__ */ jsx(tab.icon, { className: "w-4 h-4" }),
            " ",
            tab.label
          ]
        },
        tab.id
      )) }),
      /* @__PURE__ */ jsx("div", { className: "p-4 bg-[#F9FAFB] border-b border-[#F3F4F6] flex justify-between items-center", children: /* @__PURE__ */ jsxs("div", { className: "flex gap-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              placeholder: "T\xECm th\u01B0\u01A1ng hi\u1EC7u, m\xE3 tranh ch\u1EA5p...",
              className: "bg-white border border-slate-300 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none w-72"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("button", { className: "bg-white border border-slate-300 px-3 py-2 rounded-lg text-sm text-[#4B5563] flex items-center gap-2 font-medium", children: [
          /* @__PURE__ */ jsx(Filter, { className: "w-4 h-4" }),
          " L\u1ECDc tr\u1EA1ng th\xE1i"
        ] })
      ] }) }),
      /* @__PURE__ */ jsx("div", { className: "overflow-x-auto min-w-0", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse whitespace-nowrap", children: [
        /* @__PURE__ */ jsxs("thead", { children: [
          activeTab === "brand" && /* @__PURE__ */ jsxs("tr", { className: "bg-[#F9FAFB] border-b border-[#F3F4F6]", children: [
            /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase", children: "T\xEAn th\u01B0\u01A1ng hi\u1EC7u" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase", children: "M\xE3 s\u1EDF h\u1EEFu" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase", children: "Ng\xE0y \u0111\u0103ng k\xFD" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase", children: "T\u1EC7p \u0111\xEDnh k\xE8m" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase text-center", children: "Tr\u1EA1ng th\xE1i" })
          ] }),
          activeTab === "dispute" && /* @__PURE__ */ jsxs("tr", { className: "bg-[#F9FAFB] border-b border-[#F3F4F6]", children: [
            /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase", children: "M\xE3 tranh ch\u1EA5p" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase", children: "Lo\u1EA1i vi ph\u1EA1m" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase", children: "\u0110\u01A1n h\xE0ng / \u0110\u1ED1i t\u01B0\u1EE3ng" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase", children: "B\u1EB1ng ch\u1EE9ng" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase text-center", children: "Tr\u1EA1ng th\xE1i" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("tbody", { className: "divide-y divide-[#F3F4F6]", children: [
          activeTab === "brand" && MOCK_BRANDS.map((brand) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-slate-50 transition-colors", children: [
            /* @__PURE__ */ jsxs("td", { className: "px-6 py-4", children: [
              /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-[#111827]", children: brand.brandName }),
              /* @__PURE__ */ jsxs("p", { className: "text-[10px] text-slate-600 font-mono", children: [
                "Owner: ",
                brand.ownerId
              ] })
            ] }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-xs font-mono text-slate-700", children: brand.id }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-xs text-slate-600", children: brand.registrationDate }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4", children: /* @__PURE__ */ jsx("div", { className: "flex gap-2", children: brand.documents.map((doc, idx) => /* @__PURE__ */ jsxs("span", { className: "px-2 py-0.5 bg-slate-100 text-[#6B7280] text-[9px] font-bold rounded flex items-center gap-1 cursor-pointer hover:bg-slate-200", children: [
              /* @__PURE__ */ jsx(FileText, { className: "w-3 h-3" }),
              " ",
              doc
            ] }, idx)) }) }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4", children: /* @__PURE__ */ jsx("div", { className: "flex justify-center", children: /* @__PURE__ */ jsxs("span", { className: cn(
              "px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1",
              brand.status === "verified" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
            ), children: [
              brand.status === "verified" ? /* @__PURE__ */ jsx(CheckCircle2, { className: "w-3 h-3" }) : /* @__PURE__ */ jsx(Clock, { className: "w-3 h-3" }),
              brand.status === "verified" ? "\u0110\xC3 X\xC1C TH\u1EF0C" : "\u0110ANG CH\u1EDC"
            ] }) }) })
          ] }, brand.id)),
          activeTab === "dispute" && MOCK_DISPUTES.map((dispute) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-slate-50 transition-colors text-xs", children: [
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4 font-bold text-[#111827] font-mono", children: dispute.id }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4 uppercase font-bold text-red-600", children: dispute.type }),
            /* @__PURE__ */ jsxs("td", { className: "px-6 py-4", children: [
              /* @__PURE__ */ jsxs("p", { className: "font-bold", children: [
                "Order: ",
                dispute.orderId
              ] }),
              /* @__PURE__ */ jsxs("p", { className: "text-[10px] text-slate-600", children: [
                "Ng\u01B0\u1EDDi b\xE1o: ",
                dispute.reporterId
              ] })
            ] }),
            /* @__PURE__ */ jsxs("td", { className: "px-6 py-4 text-[#2563EB] font-medium cursor-pointer flex items-center gap-1", children: [
              /* @__PURE__ */ jsx(Eye, { className: "w-3.5 h-3.5" }),
              " Xem ",
              dispute.evidence.length,
              " b\u1EB1ng ch\u1EE9ng"
            ] }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-center", children: /* @__PURE__ */ jsx("span", { className: cn(
              "px-2 py-0.5 rounded-full text-[10px] font-bold",
              dispute.status === "investigating" ? "bg-slate-100 text-orange-700" : "bg-red-50 text-red-600"
            ), children: dispute.status.toUpperCase() }) })
          ] }, dispute.id))
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "bg-slate-900 text-[#FAF9F5] p-6 rounded-lg overflow-hidden relative border border-slate-800", children: /* @__PURE__ */ jsxs("div", { className: "relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6 items-center", children: [
      /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx("div", { className: "p-3 bg-red-600 rounded-lg shadow-sm shadow-red-600/20", children: /* @__PURE__ */ jsx(ShieldAlert, { className: "w-6 h-6" }) }),
          /* @__PURE__ */ jsx("h3", { className: "text-xl font-bold italic font-serif tracking-tight", children: "AI Compliance Guardian" })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-slate-500 text-sm leading-relaxed max-w-lg", children: "H\u1EC7 th\u1ED1ng t\u1EF1 \u0111\u1ED9ng r\xE0 qu\xE9t s\u1EA3n ph\u1EA9m d\u1EF1a tr\xEAn AI \u0111\u1EC3 ph\xE1t hi\u1EC7n t\u1EEB kh\xF3a c\u1EA5m, h\xECnh \u1EA3nh nh\u1EA1y c\u1EA3m v\xE0 c\xE1c s\u1EA3n ph\u1EA9m vi ph\u1EA1m b\u1EA3n quy\u1EC1n th\u01B0\u01A1ng hi\u1EC7u. T\u1EF1 \u0111\u1ED9ng t\u1EA1m kh\xF3a c\xE1c shop c\xF3 Compliance Score d\u01B0\u1EDBi 60." }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-4 pt-4", children: [
          /* @__PURE__ */ jsx("button", { className: "px-6 py-3 bg-white text-slate-900 font-bold rounded-lg text-xs hover:bg-slate-100 transition-all uppercase tracking-widest", children: "C\u1EA5u h\xECnh Lu\u1EADt s\xE0n" }),
          /* @__PURE__ */ jsx("button", { className: "px-6 py-3 border border-slate-700 font-bold rounded-lg text-xs hover:bg-slate-800 transition-all uppercase tracking-widest", children: "Logs vi ph\u1EA1m AI" })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "hidden md:block", children: /* @__PURE__ */ jsxs("div", { className: "p-6 bg-slate-800/40 rounded-lg border border-slate-700/50 backdrop-blur-sm space-y-4", children: [
        /* @__PURE__ */ jsxs("h4", { className: "text-xs font-bold text-slate-600 uppercase flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Clock, { className: "w-3.5 h-3.5" }),
          " Real-time Legal Feed"
        ] }),
        /* @__PURE__ */ jsx("div", { className: "space-y-3", children: [1, 2].map((i) => /* @__PURE__ */ jsx("div", { className: "flex gap-3 text-xs border-l-2 border-red-500 pl-4 py-1", children: /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-slate-400 font-bold", children: "Ph\xE1t hi\u1EC7n Seller b\xE1n h\xE0ng gi\u1EA3 m\u1EA1o (Counterfeit)" }),
          /* @__PURE__ */ jsxs("p", { className: "text-slate-600 text-[10px]", children: [
            "M\xE3 shop: SEL-0",
            i,
            "42 \u2022 5 ph\xFAt tr\u01B0\u1EDBc"
          ] })
        ] }) }, i)) })
      ] }) })
    ] }) })
  ] });
}
export {
  Compliance
};
