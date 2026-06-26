import { useState, useRef, useEffect, type ReactNode } from "react";
import {
  MessageSquare, BookOpen, Clock, User,
  ChevronDown, ChevronRight, ChevronLeft, ChevronUp,
  Send, Mic, MoreHorizontal,
  ThumbsUp, ThumbsDown, Copy, RefreshCw, Flag,
  Search, Check, Lock, FileText, Info,
  X, AlertTriangle, Shield, AlertCircle,
  Bell, HelpCircle, Trash2, CheckCircle,
  Sparkles, Timer,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "chat" | "knowledge" | "history" | "profile";
type SubPage = "citation" | "feedback" | "states" | null;

interface Citation {
  id: string;
  title: string;
  kb: string;
  path: string;
  updatedAt: string;
  similarity: number;
  rerank: number;
  excerpt: string;
  highlight: string;
}

interface Message {
  id: string;
  type: "user" | "ai";
  text: string;
  citations?: Citation[];
  aiState?: "no_evidence" | "low_confidence" | "no_permission" | "timeout" | "blocked";
}

interface KnowledgeBase {
  id: string;
  name: string;
  description: string;
  department: string;
  docCount: number;
  updatedAt: string;
  permission: "granted" | "request" | "denied";
}

interface Session {
  id: string;
  title: string;
  kb: string;
  preview: string;
  messageCount: number;
  time: string;
  group: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const KBS: KnowledgeBase[] = [
  { id: "hr", name: "人事制度库", description: "员工手册、考勤制度、薪酬福利规范", department: "人力资源部", docCount: 128, updatedAt: "7天前", permission: "granted" },
  { id: "product", name: "产品资料库", description: "产品规格、安装手册、技术参数", department: "产品研发部", docCount: 342, updatedAt: "今天", permission: "granted" },
  { id: "aftersales", name: "售后知识库", description: "退换货政策、维修流程、售后规范", department: "客服中心", docCount: 215, updatedAt: "3天前", permission: "granted" },
  { id: "tech", name: "研发技术库", description: "技术架构、API文档、开发规范", department: "技术部", docCount: 489, updatedAt: "昨天", permission: "denied" },
  { id: "training", name: "培训资料库", description: "新员工培训、技能培训、管理课程", department: "人力资源部", docCount: 76, updatedAt: "2周前", permission: "granted" },
  { id: "faq", name: "企业 FAQ", description: "常见问题解答、快速指引", department: "综合办公室", docCount: 56, updatedAt: "今天", permission: "granted" },
];

const EXAMPLES = [
  "试用期请假是否影响转正？",
  "产品安装失败如何排查？",
  "售后退换货流程是什么？",
  "如何申请远程办公？",
];

const CITATIONS: Citation[] = [
  {
    id: "c1",
    title: "员工手册 v4.2",
    kb: "人事制度库",
    path: "第3章 > 考勤制度 > 试用期规定",
    updatedAt: "2024-03-15",
    similarity: 0.92,
    rerank: 0.95,
    excerpt: "试用期员工享有与正式员工同等的请假权利。试用期内请假不直接影响转正考核，但需按规定提前申请并获批准。",
    highlight: "试用期内请假不直接影响转正考核",
  },
  {
    id: "c2",
    title: "HR政策补充说明",
    kb: "人事制度库",
    path: "附录B > 常见问题解答",
    updatedAt: "2024-01-20",
    similarity: 0.87,
    rerank: 0.81,
    excerpt: "关于试用期请假：事假累计超过5天、病假累计超过10天可能影响转正评估，建议提前与直属领导沟通。",
    highlight: "事假累计超过5天、病假累计超过10天可能影响转正评估",
  },
  {
    id: "c3",
    title: "考勤管理制度2024",
    kb: "人事制度库",
    path: "第2章 > 请假管理",
    updatedAt: "2024-02-01",
    similarity: 0.78,
    rerank: 0.72,
    excerpt: "所有类型请假均需通过OA系统提交申请，审批通过后方可生效。紧急情况可事后补办，但需提供相关证明。",
    highlight: "均需通过OA系统提交申请",
  },
];

const AI_ANSWER = `根据人事制度库的相关规定，**试用期请假不会直接影响转正**，但需注意以下几点：

1. **正常请假**：试用期员工享有与正式员工同等的请假权利，合规请假不影响转正考核。

2. **注意事项**：事假累计超过 5 天或病假累计超过 10 天，可能在转正评估时被纳入参考，建议提前与直属领导沟通。

3. **请假流程**：须通过 OA 系统提前申请，获批准后方可生效。

建议在试用期内保持良好的出勤记录，如有特殊情况，请及时与 HR 沟通说明。`;

const SESSIONS: Session[] = [
  { id: "s1", title: "试用期请假是否影响转正", kb: "人事制度库", preview: "试用期请假不会直接影响转正，但事假超5天需注意...", messageCount: 3, time: "14:30", group: "今天" },
  { id: "s2", title: "售后退换货流程是什么", kb: "售后知识库", preview: "客户在收货7日内可申请无理由退货，需提供原包装...", messageCount: 5, time: "10:15", group: "今天" },
  { id: "s3", title: "产品安装故障排查步骤", kb: "产品资料库", preview: "安装失败通常由驱动版本不匹配导致，建议先检查...", messageCount: 8, time: "16:42", group: "昨天" },
  { id: "s4", title: "如何申请远程办公", kb: "人事制度库", preview: "远程办公申请需填写OA表单，经直属领导和HR审批...", messageCount: 2, time: "09:20", group: "昨天" },
  { id: "s5", title: "报销发票有哪些要求", kb: "人事制度库", preview: "须提供增值税专用发票或普通发票，注意抬头一致...", messageCount: 4, time: "", group: "近7天" },
  { id: "s6", title: "设备固件升级失败处理", kb: "产品资料库", preview: "升级失败可尝试检查网络稳定性，重启设备后重试...", messageCount: 6, time: "", group: "近7天" },
];

// ─── Color Tokens ─────────────────────────────────────────────────────────────

const C = {
  primary: "#1677FF",
  primaryLight: "#E6F0FF",
  success: "#10B981",
  successLight: "#ECFDF5",
  warning: "#F59E0B",
  warningLight: "#FFFBEB",
  danger: "#EF4444",
  dangerLight: "#FEF2F2",
  bgPage: "#F7F8FA",
  bgCard: "#FFFFFF",
  bgInput: "#F5F5F5",
  t1: "#1A1A1A",
  t2: "#888888",
  t3: "#BDBDBD",
  border: "#EDEDED",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreColors(score: number) {
  if (score >= 0.85) return { bg: C.successLight, text: C.success };
  if (score >= 0.70) return { bg: C.warningLight, text: C.warning };
  return { bg: C.dangerLight, text: C.danger };
}

function renderMd(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**")
      ? <strong key={i} style={{ color: C.t1, fontWeight: 600 }}>{part.slice(2, -2)}</strong>
      : <span key={i}>{part}</span>
  );
}

// ─── StatusBar ────────────────────────────────────────────────────────────────

function StatusBar({ bg = C.bgCard }: { bg?: string }) {
  return (
    <div style={{ backgroundColor: bg, height: "44px" }} className="flex items-center justify-between px-5 flex-none">
      <span style={{ color: C.t1, fontSize: "15px", fontWeight: 600 }}>9:41</span>
      <div className="flex items-center gap-2">
        <svg width="16" height="12" viewBox="0 0 16 12" fill={C.t1}>
          <rect x="0" y="5" width="2.5" height="7" rx="0.5" />
          <rect x="4" y="3" width="2.5" height="9" rx="0.5" />
          <rect x="8" y="1" width="2.5" height="11" rx="0.5" />
          <rect x="12" y="0" width="2.5" height="12" rx="0.5" opacity="0.25" />
        </svg>
        <svg width="15" height="11" viewBox="0 0 15 11" fill="none">
          <circle cx="7.5" cy="9.5" r="1.2" fill={C.t1} />
          <path d="M4.2 7.2a4.7 4.7 0 016.6 0" stroke={C.t1} strokeWidth="1.3" strokeLinecap="round" />
          <path d="M1.2 4.5a9.0 9.0 0 0112.6 0" stroke={C.t1} strokeWidth="1.3" strokeLinecap="round" />
        </svg>
        <div className="flex items-center">
          <div style={{ width: "22px", height: "11px", border: `1.5px solid ${C.t1}`, borderRadius: "3px", padding: "1.5px", position: "relative" }}>
            <div style={{ width: "75%", height: "100%", backgroundColor: C.t1, borderRadius: "1px" }} />
          </div>
          <div style={{ width: "2px", height: "5px", backgroundColor: C.t1, borderRadius: "0 1px 1px 0", marginLeft: "-1px" }} />
        </div>
      </div>
    </div>
  );
}

// ─── NavBar ───────────────────────────────────────────────────────────────────

function NavBar({ title, onBack, right }: { title: string; onBack?: () => void; right?: ReactNode }) {
  return (
    <div style={{ backgroundColor: C.bgCard, height: "44px", borderBottom: `1px solid ${C.border}` }} className="flex items-center justify-between px-4 flex-none">
      <div style={{ width: "40px" }}>
        {onBack && (
          <button onClick={onBack} className="flex items-center" style={{ color: C.primary }}>
            <ChevronLeft size={22} />
          </button>
        )}
      </div>
      <span style={{ color: C.t1, fontSize: "17px", fontWeight: 600 }}>{title}</span>
      <div className="flex items-center gap-3">{right ?? <div style={{ width: "40px" }} />}</div>
    </div>
  );
}

// ─── TabBar ───────────────────────────────────────────────────────────────────

const TABS = [
  { key: "chat" as Tab, label: "问答", Icon: MessageSquare },
  { key: "knowledge" as Tab, label: "知识库", Icon: BookOpen },
  { key: "history" as Tab, label: "历史", Icon: Clock },
  { key: "profile" as Tab, label: "我的", Icon: User },
];

function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <div style={{ backgroundColor: C.bgCard, borderTop: `1px solid ${C.border}`, height: "50px" }} className="flex flex-none">
      {TABS.map(({ key, label, Icon }) => {
        const on = active === key;
        return (
          <button key={key} onClick={() => onChange(key)} className="flex-1 flex flex-col items-center justify-center gap-0.5">
            <Icon size={22} style={{ color: on ? C.primary : C.t3 }} />
            <span style={{ fontSize: "10px", color: on ? C.primary : C.t3, fontWeight: on ? 500 : 400 }}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── KnowledgeBasePicker ──────────────────────────────────────────────────────

function KnowledgeBasePicker({ kb, onClick }: { kb: KnowledgeBase; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ backgroundColor: C.bgCard, borderBottom: `1px solid ${C.border}` }} className="w-full flex items-center justify-between px-4 py-2.5 flex-none">
      <div className="flex items-center gap-2">
        <div style={{ width: "22px", height: "22px", backgroundColor: C.primaryLight, borderRadius: "6px" }} className="flex items-center justify-center flex-none">
          <BookOpen size={12} style={{ color: C.primary }} />
        </div>
        <span style={{ fontSize: "14px", color: C.t1, fontWeight: 500 }}>{kb.name}</span>
        <div style={{ backgroundColor: C.successLight, color: C.success, fontSize: "10px", padding: "1px 6px", borderRadius: "4px", fontWeight: 500 }}>已连接</div>
      </div>
      <div className="flex items-center gap-1">
        <span style={{ fontSize: "12px", color: C.t2 }}>切换</span>
        <ChevronDown size={14} style={{ color: C.t2 }} />
      </div>
    </button>
  );
}

// ─── WelcomeCard ──────────────────────────────────────────────────────────────

function WelcomeCard({ kb }: { kb: KnowledgeBase }) {
  return (
    <div style={{ backgroundColor: C.bgCard, borderRadius: "12px", margin: "16px 16px 4px", padding: "14px 16px", border: `1px solid ${C.border}` }}>
      <div className="flex items-start gap-3">
        <div style={{ width: "40px", height: "40px", background: `linear-gradient(135deg, ${C.primary} 0%, #4DA3FF 100%)`, borderRadius: "12px", flexShrink: 0 }} className="flex items-center justify-center">
          <Sparkles size={20} style={{ color: "#FFFFFF" }} />
        </div>
        <div>
          <p style={{ fontSize: "15px", fontWeight: 600, color: C.t1, marginBottom: "4px" }}>企业知识库助手</p>
          <p style={{ fontSize: "13px", color: C.t2, lineHeight: 1.65 }}>
            我可以基于{" "}
            <span style={{ color: C.primary, fontWeight: 500 }}>{kb.name}</span>{" "}
            回答你的问题，并提供带引用来源的可信答案。
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── ExampleQuestionChips ─────────────────────────────────────────────────────

function ExampleQuestionChips({ onSelect }: { onSelect: (q: string) => void }) {
  return (
    <div style={{ padding: "12px 16px 4px" }}>
      <p style={{ fontSize: "11px", color: C.t3, fontWeight: 500, marginBottom: "8px", letterSpacing: "0.03em" }}>常见问题</p>
      <div className="flex flex-wrap gap-2">
        {EXAMPLES.map((q) => (
          <button key={q} onClick={() => onSelect(q)}
            style={{ backgroundColor: C.primaryLight, color: C.primary, fontSize: "12px", padding: "5px 11px", borderRadius: "100px", border: `1px solid ${C.primary}25`, lineHeight: 1.4, fontWeight: 500 }}>
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── ChatMessageBubble ────────────────────────────────────────────────────────

function ChatMessageBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-end px-4 mb-3">
      <div style={{ backgroundColor: C.primary, borderRadius: "14px 3px 14px 14px", maxWidth: "76%", padding: "10px 14px" }}>
        <p style={{ fontSize: "14px", color: "#FFFFFF", lineHeight: 1.65 }}>{text}</p>
      </div>
    </div>
  );
}

// ─── CitationCollapseCard ─────────────────────────────────────────────────────

function CitationCollapseCard({ citations, onCitationClick }: { citations: Citation[]; onCitationClick: (c: Citation) => void }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div style={{ backgroundColor: "#F4F8FF", borderRadius: "8px", border: `1px solid ${C.primaryLight}`, marginTop: "10px" }}>
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2">
          <FileText size={13} style={{ color: C.primary }} />
          <span style={{ fontSize: "13px", color: C.primary, fontWeight: 500 }}>查看来源</span>
          <div style={{ backgroundColor: C.primary, color: "#FFFFFF", fontSize: "10px", width: "17px", height: "17px", borderRadius: "9px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>
            {citations.length}
          </div>
        </div>
        {expanded ? <ChevronUp size={14} style={{ color: C.primary }} /> : <ChevronDown size={14} style={{ color: C.primary }} />}
      </button>
      {expanded && (
        <div style={{ padding: "0 12px 10px", borderTop: `1px solid ${C.primaryLight}` }}>
          {citations.map((c, i) => {
            const sc = scoreColors(c.rerank);
            return (
              <button key={c.id} onClick={() => onCitationClick(c)} className="w-full text-left" style={{ padding: "10px 0", borderBottom: i < citations.length - 1 ? `1px solid ${C.border}` : "none" }}>
                <div className="flex items-start gap-2">
                  <div style={{ width: "18px", height: "18px", backgroundColor: C.primary, borderRadius: "5px", flexShrink: 0, marginTop: "1px" }} className="flex items-center justify-center">
                    <span style={{ fontSize: "10px", color: "#FFFFFF", fontWeight: 700 }}>{i + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                      <span style={{ fontSize: "13px", color: C.t1, fontWeight: 500 }} className="truncate">{c.title}</span>
                      <div style={{ backgroundColor: sc.bg, color: sc.text, fontSize: "10px", padding: "1px 5px", borderRadius: "3px", fontWeight: 600, flexShrink: 0 }}>
                        {Math.round(c.rerank * 100)}%
                      </div>
                    </div>
                    <p style={{ fontSize: "11px", color: C.t2, marginBottom: "3px" }}>{c.path}</p>
                    <p style={{ fontSize: "12px", color: C.t2, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{c.excerpt}</p>
                  </div>
                  <ChevronRight size={13} style={{ color: C.t3, flexShrink: 0, marginTop: "3px" }} />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── FeedbackBar ──────────────────────────────────────────────────────────────

function FeedbackBar({ onFeedback }: { onFeedback: (t: string) => void }) {
  const [liked, setLiked] = useState<boolean | null>(null);
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center gap-4 mt-2.5 pt-2.5" style={{ borderTop: `1px solid ${C.border}` }}>
      <button onClick={() => { setLiked(true); onFeedback("like"); }} className="flex items-center gap-1">
        <ThumbsUp size={13} style={{ color: liked === true ? C.primary : C.t3 }} fill={liked === true ? C.primary : "none"} />
        <span style={{ fontSize: "11px", color: liked === true ? C.primary : C.t3 }}>有用</span>
      </button>
      <button onClick={() => { setLiked(false); onFeedback("dislike"); }} className="flex items-center gap-1">
        <ThumbsDown size={13} style={{ color: liked === false ? C.danger : C.t3 }} fill={liked === false ? C.danger : "none"} />
        <span style={{ fontSize: "11px", color: liked === false ? C.danger : C.t3 }}>没用</span>
      </button>
      <button onClick={() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="flex items-center gap-1">
        {copied ? <CheckCircle size={13} style={{ color: C.success }} /> : <Copy size={13} style={{ color: C.t3 }} />}
        <span style={{ fontSize: "11px", color: copied ? C.success : C.t3 }}>{copied ? "已复制" : "复制"}</span>
      </button>
      <button onClick={() => onFeedback("refresh")} className="flex items-center gap-1">
        <RefreshCw size={13} style={{ color: C.t3 }} />
        <span style={{ fontSize: "11px", color: C.t3 }}>重新生成</span>
      </button>
      <button onClick={() => onFeedback("flag")} className="flex items-center gap-1 ml-auto">
        <Flag size={13} style={{ color: C.t3 }} />
        <span style={{ fontSize: "11px", color: C.t3 }}>纠错</span>
      </button>
    </div>
  );
}

// ─── AIAnswerCard ─────────────────────────────────────────────────────────────

function AIAnswerCard({ message, onCitationClick, onFeedback }: {
  message: Message;
  onCitationClick: (c: Citation) => void;
  onFeedback: (t: string) => void;
}) {
  const paragraphs = message.text.split(/\n\n+/).filter(Boolean);
  return (
    <div className="flex items-start gap-2 px-4 mb-3">
      <div style={{ width: "30px", height: "30px", background: `linear-gradient(135deg, ${C.primary}, #4DA3FF)`, borderRadius: "9px", flexShrink: 0 }} className="flex items-center justify-center mt-0.5">
        <Sparkles size={15} style={{ color: "#FFFFFF" }} />
      </div>
      <div style={{ backgroundColor: C.bgCard, borderRadius: "3px 12px 12px 12px", flex: 1, padding: "12px 14px", boxShadow: "0 1px 4px rgba(22,119,255,0.06), 0 0 0 1px rgba(22,119,255,0.06)" }}>
        {message.aiState === "low_confidence" && (
          <div style={{ backgroundColor: C.warningLight, border: `1px solid ${C.warning}30`, borderRadius: "6px", padding: "7px 10px", marginBottom: "10px", display: "flex", alignItems: "flex-start", gap: "6px" }}>
            <AlertCircle size={13} style={{ color: C.warning, flexShrink: 0, marginTop: "1px" }} />
            <span style={{ fontSize: "12px", color: C.warning, lineHeight: 1.5 }}>该回答置信度较低，请结合引用来源人工确认。</span>
          </div>
        )}
        <div style={{ fontSize: "14px", color: C.t1, lineHeight: 1.75 }}>
          {paragraphs.map((para, i) => (
            <p key={i} style={{ marginBottom: i < paragraphs.length - 1 ? "8px" : 0 }}>{renderMd(para)}</p>
          ))}
        </div>
        {message.citations && message.citations.length > 0 && (
          <CitationCollapseCard citations={message.citations} onCitationClick={onCitationClick} />
        )}
        <FeedbackBar onFeedback={onFeedback} />
      </div>
    </div>
  );
}

// ─── AILoadingCard ────────────────────────────────────────────────────────────

function AILoadingCard() {
  return (
    <div className="flex items-start gap-2 px-4 mb-3">
      <div style={{ width: "30px", height: "30px", background: `linear-gradient(135deg, ${C.primary}, #4DA3FF)`, borderRadius: "9px", flexShrink: 0 }} className="flex items-center justify-center mt-0.5">
        <Sparkles size={15} style={{ color: "#FFFFFF" }} />
      </div>
      <div style={{ backgroundColor: C.bgCard, borderRadius: "3px 12px 12px 12px", flex: 1, padding: "12px 14px", boxShadow: "0 1px 4px rgba(22,119,255,0.06), 0 0 0 1px rgba(22,119,255,0.06)" }}>
        <div className="flex items-center gap-1.5 mb-3">
          {[0, 0.18, 0.36].map((d, i) => (
            <span key={i} style={{ width: "6px", height: "6px", borderRadius: "3px", backgroundColor: C.primary, display: "inline-block", animationDelay: `${d}s` }} className="animate-bounce" />
          ))}
          <span style={{ fontSize: "12px", color: C.t2, marginLeft: "4px" }}>正在基于知识库生成回答...</span>
        </div>
        {[78, 56, 38].map((w, i) => (
          <div key={i} style={{ height: "11px", backgroundColor: C.bgInput, borderRadius: "6px", marginBottom: i < 2 ? "7px" : 0, width: `${w}%` }} className="skeleton-shimmer" />
        ))}
      </div>
    </div>
  );
}

// ─── Inline State Cards ───────────────────────────────────────────────────────

function InlineCard({ icon, color, bg, title, subtitle, action, onAction }: {
  icon: ReactNode; color: string; bg: string; title: string; subtitle: string; action?: string; onAction?: () => void;
}) {
  return (
    <div className="flex items-start gap-2 px-4 mb-3">
      <div style={{ width: "30px", height: "30px", backgroundColor: color, borderRadius: "9px", flexShrink: 0 }} className="flex items-center justify-center mt-0.5">
        <Sparkles size={15} style={{ color: "#FFFFFF" }} />
      </div>
      <div style={{ backgroundColor: bg, borderRadius: "3px 12px 12px 12px", flex: 1, padding: "12px 14px", border: `1px solid ${color}25` }}>
        <div className="flex items-start gap-2 mb-2">
          <span style={{ color, flexShrink: 0, marginTop: "1px" }}>{icon}</span>
          <div>
            <p style={{ fontSize: "14px", fontWeight: 600, color, marginBottom: "3px" }}>{title}</p>
            <p style={{ fontSize: "13px", color: C.t2, lineHeight: 1.6 }}>{subtitle}</p>
          </div>
        </div>
        {action && onAction && (
          <button onClick={onAction} style={{ backgroundColor: color, color: "#FFFFFF", fontSize: "13px", padding: "6px 16px", borderRadius: "6px", fontWeight: 500, marginTop: "2px" }}>{action}</button>
        )}
      </div>
    </div>
  );
}

// ─── QuestionInputBar ─────────────────────────────────────────────────────────

function QuestionInputBar({ value, onChange, onSend, onVoice }: {
  value: string; onChange: (v: string) => void; onSend: () => void; onVoice: () => void;
}) {
  const canSend = value.trim().length > 0;
  const taRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 80) + "px";
  }, [value]);
  return (
    <div style={{ backgroundColor: C.bgCard, borderTop: `1px solid ${C.border}`, padding: "8px 12px 10px" }} className="flex items-end gap-2 flex-none">
      <button onClick={onVoice} style={{ width: "36px", height: "36px", borderRadius: "18px", backgroundColor: C.bgInput, flexShrink: 0 }} className="flex items-center justify-center">
        <Mic size={16} style={{ color: C.t2 }} />
      </button>
      <textarea ref={taRef} value={value} onChange={e => onChange(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (canSend) onSend(); } }}
        placeholder="请输入你的问题..." rows={1}
        style={{ flex: 1, backgroundColor: C.bgInput, borderRadius: "8px", padding: "8px 12px", fontSize: "14px", color: C.t1, resize: "none", border: "none", outline: "none", lineHeight: 1.5, fontFamily: "inherit", maxHeight: "80px", minHeight: "36px" }} />
      <button onClick={onSend} disabled={!canSend}
        style={{ width: "36px", height: "36px", borderRadius: "9px", backgroundColor: canSend ? C.primary : C.t3, flexShrink: 0, transition: "background-color 0.15s" }}
        className="flex items-center justify-center">
        <Send size={15} style={{ color: "#FFFFFF" }} />
      </button>
    </div>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────

function EmptyState({ icon, title, subtitle, action, onAction }: {
  icon: ReactNode; title: string; subtitle: string; action?: string; onAction?: () => void;
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 py-16 text-center">
      <div style={{ width: "64px", height: "64px", backgroundColor: C.bgInput, borderRadius: "20px", marginBottom: "16px" }} className="flex items-center justify-center">
        {icon}
      </div>
      <p style={{ fontSize: "16px", fontWeight: 600, color: C.t1, marginBottom: "6px" }}>{title}</p>
      <p style={{ fontSize: "13px", color: C.t2, lineHeight: 1.7, marginBottom: "20px" }}>{subtitle}</p>
      {action && onAction && (
        <button onClick={onAction} style={{ backgroundColor: C.primary, color: "#FFFFFF", fontSize: "14px", padding: "10px 24px", borderRadius: "8px", fontWeight: 500 }}>{action}</button>
      )}
    </div>
  );
}

// ─── KnowledgeBaseCell ────────────────────────────────────────────────────────

function KnowledgeBaseCell({ kb, isSelected, onSelect }: { kb: KnowledgeBase; isSelected: boolean; onSelect: () => void }) {
  const denied = kb.permission === "denied";
  const permC = kb.permission === "granted" ? C.success : kb.permission === "request" ? C.warning : C.danger;
  const permL = kb.permission === "granted" ? "可访问" : kb.permission === "request" ? "需申请" : "无权限";
  return (
    <button onClick={denied ? undefined : onSelect} className="w-full text-left" style={{ opacity: denied ? 0.55 : 1 }}>
      <div style={{ backgroundColor: C.bgCard, borderBottom: `1px solid ${C.border}`, padding: "14px 16px" }} className="flex items-center gap-3">
        <div style={{ width: "46px", height: "46px", backgroundColor: denied ? C.bgInput : C.primaryLight, borderRadius: "13px", flexShrink: 0 }} className="flex items-center justify-center">
          {denied ? <Lock size={20} style={{ color: C.t3 }} /> : <BookOpen size={20} style={{ color: C.primary }} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span style={{ fontSize: "15px", fontWeight: 600, color: C.t1 }}>{kb.name}</span>
            <div style={{ backgroundColor: `${permC}15`, color: permC, fontSize: "10px", padding: "1px 6px", borderRadius: "4px", fontWeight: 500, flexShrink: 0 }}>{permL}</div>
          </div>
          <p style={{ fontSize: "12px", color: C.t2, marginBottom: "3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{kb.description}</p>
          <div className="flex items-center gap-1.5">
            <span style={{ fontSize: "11px", color: C.t3 }}>{kb.department}</span>
            <span style={{ fontSize: "11px", color: C.t3 }}>·</span>
            <span style={{ fontSize: "11px", color: C.t3 }}>{kb.docCount} 份文档</span>
            <span style={{ fontSize: "11px", color: C.t3 }}>·</span>
            <span style={{ fontSize: "11px", color: C.t3 }}>更新于{kb.updatedAt}</span>
          </div>
        </div>
        {isSelected && !denied && <Check size={18} style={{ color: C.primary, flexShrink: 0 }} />}
        {!isSelected && !denied && <ChevronRight size={16} style={{ color: C.t3, flexShrink: 0 }} />}
      </div>
    </button>
  );
}

// ─── HistorySessionCell ───────────────────────────────────────────────────────

function HistorySessionCell({ session, onClick }: { session: Session; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full text-left">
      <div style={{ backgroundColor: C.bgCard, borderBottom: `1px solid ${C.border}`, padding: "12px 16px" }} className="flex items-start gap-3">
        <div style={{ width: "40px", height: "40px", backgroundColor: C.primaryLight, borderRadius: "11px", flexShrink: 0, marginTop: "2px" }} className="flex items-center justify-center">
          <MessageSquare size={17} style={{ color: C.primary }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <span style={{ fontSize: "14px", fontWeight: 600, color: C.t1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{session.title}</span>
            <span style={{ fontSize: "11px", color: C.t3, flexShrink: 0 }}>{session.time || session.group}</span>
          </div>
          <div className="flex items-center gap-1.5 mb-1">
            <div style={{ backgroundColor: C.bgInput, color: C.t2, fontSize: "10px", padding: "1px 6px", borderRadius: "4px", fontWeight: 500 }}>{session.kb}</div>
            <span style={{ fontSize: "11px", color: C.t3 }}>{session.messageCount} 条消息</span>
          </div>
          <p style={{ fontSize: "12px", color: C.t2, lineHeight: 1.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{session.preview}</p>
        </div>
        <ChevronRight size={14} style={{ color: C.t3, flexShrink: 0, marginTop: "6px" }} />
      </div>
    </button>
  );
}

// ─── BottomSheet ──────────────────────────────────────────────────────────────

function BottomSheet({ show, onClose, title, children }: { show: boolean; onClose: () => void; title: string; children: ReactNode }) {
  if (!show) return null;
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 50 }}>
      <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.48)" }} onClick={onClose} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: C.bgCard, borderRadius: "20px 20px 0 0", maxHeight: "72%" }} className="flex flex-col">
        <div style={{ padding: "14px 16px 0", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          <div style={{ width: "36px", height: "4px", borderRadius: "2px", backgroundColor: C.border, margin: "0 auto 12px" }} />
          <div className="flex items-center justify-between mb-3">
            <p style={{ fontSize: "16px", fontWeight: 600, color: C.t1 }}>{title}</p>
            <button onClick={onClose}><X size={20} style={{ color: C.t2 }} /></button>
          </div>
        </div>
        <div style={{ overflowY: "auto" }}>{children}</div>
      </div>
    </div>
  );
}

// ─── Pages ────────────────────────────────────────────────────────────────────

// ── ChatPage ──────────────────────────────────────────────────────────────────

function ChatPage({ kb, onKBClick, onCitationClick, onFeedbackClick }: {
  kb: KnowledgeBase;
  onKBClick: () => void;
  onCitationClick: (c: Citation) => void;
  onFeedbackClick: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, loading]);

  const send = (text: string) => {
    if (!text.trim() || loading) return;
    setMessages(prev => [...prev, { id: Date.now().toString(), type: "user", text }]);
    setInput("");
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      let ai: Message;
      if (text.includes("超时")) {
        ai = { id: `${Date.now()}`, type: "ai", text: "", aiState: "timeout" };
      } else if (text.includes("敏感") || text.includes("密码")) {
        ai = { id: `${Date.now()}`, type: "ai", text: "", aiState: "blocked" };
      } else if (text.includes("研发") || text.includes("代码") || text.includes("研究")) {
        ai = { id: `${Date.now()}`, type: "ai", text: "", aiState: "no_permission" };
      } else if (text.includes("奇怪") || text.includes("不确定")) {
        ai = { id: `${Date.now()}`, type: "ai", text: AI_ANSWER, citations: CITATIONS, aiState: "low_confidence" };
      } else {
        ai = { id: `${Date.now()}`, type: "ai", text: AI_ANSWER, citations: CITATIONS };
      }
      setMessages(prev => [...prev, ai]);
    }, 1800);
  };

  const empty = messages.length === 0 && !loading;

  return (
    <div className="flex flex-col h-full">
      <NavBar title="企业知识库助手" right={
        <div className="flex items-center gap-3">
          <button><Clock size={18} style={{ color: C.t2 }} /></button>
          <button><MoreHorizontal size={18} style={{ color: C.t2 }} /></button>
        </div>
      } />
      <KnowledgeBasePicker kb={kb} onClick={onKBClick} />
      <div ref={scrollRef} className="flex-1 overflow-y-auto" style={{ backgroundColor: C.bgPage }}>
        {empty && (
          <>
            <WelcomeCard kb={kb} />
            <ExampleQuestionChips onSelect={send} />
          </>
        )}
        <div style={{ paddingTop: empty ? "8px" : "12px", paddingBottom: "8px" }}>
          {messages.map(msg => {
            if (msg.type === "user") return <ChatMessageBubble key={msg.id} text={msg.text} />;
            if (msg.aiState === "timeout") return <InlineCard key={msg.id} icon={<Timer size={14} />} color={C.danger} bg={C.dangerLight} title="响应超时" subtitle="模型服务响应超时，请稍后重试。" action="重试" onAction={() => {}} />;
            if (msg.aiState === "blocked") return <InlineCard key={msg.id} icon={<Shield size={14} />} color={C.warning} bg={C.warningLight} title="内容已拦截" subtitle="你的问题包含敏感词，系统已拦截，请调整后重新提问。" />;
            if (msg.aiState === "no_permission") return <InlineCard key={msg.id} icon={<Lock size={14} />} color={C.danger} bg={C.dangerLight} title="无权访问" subtitle="你无权访问该知识库或文档片段，请联系管理员申请权限。" />;
            return <AIAnswerCard key={msg.id} message={msg} onCitationClick={onCitationClick} onFeedback={t => { if (t === "flag") onFeedbackClick(); }} />;
          })}
          {loading && <AILoadingCard />}
        </div>
      </div>
      <QuestionInputBar value={input} onChange={setInput} onSend={() => send(input)} onVoice={() => {}} />
    </div>
  );
}

// ── KnowledgePage ─────────────────────────────────────────────────────────────

function KnowledgePage({ selectedKBId, onSelect }: { selectedKBId: string; onSelect: (id: string) => void }) {
  const [search, setSearch] = useState("");
  const filtered = KBS.filter(kb => kb.name.includes(search) || kb.description.includes(search));
  return (
    <div className="flex flex-col h-full">
      <NavBar title="知识库" />
      <div style={{ backgroundColor: C.bgCard, borderBottom: `1px solid ${C.border}`, padding: "10px 16px" }}>
        <div style={{ backgroundColor: C.bgInput, borderRadius: "9px", padding: "8px 12px" }} className="flex items-center gap-2">
          <Search size={14} style={{ color: C.t3 }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索知识库..."
            style={{ flex: 1, backgroundColor: "transparent", fontSize: "14px", color: C.t1, border: "none", outline: "none" }} />
          {search && <button onClick={() => setSearch("")}><X size={14} style={{ color: C.t3 }} /></button>}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto" style={{ backgroundColor: C.bgPage }}>
        <div style={{ marginTop: "10px" }}>
          {filtered.length === 0
            ? <EmptyState icon={<Search size={28} style={{ color: C.t3 }} />} title="未找到知识库" subtitle="试试其他关键词" />
            : filtered.map(kb => <KnowledgeBaseCell key={kb.id} kb={kb} isSelected={selectedKBId === kb.id} onSelect={() => onSelect(kb.id)} />)
          }
        </div>
      </div>
    </div>
  );
}

// ── HistoryPage ───────────────────────────────────────────────────────────────

function HistoryPage({ onSessionClick }: { onSessionClick: (s: Session) => void }) {
  const [search, setSearch] = useState("");
  const filtered = SESSIONS.filter(s => s.title.includes(search) || s.preview.includes(search));
  const groups = ["今天", "昨天", "近7天"].filter(g => filtered.some(s => s.group === g));
  return (
    <div className="flex flex-col h-full">
      <NavBar title="历史会话" />
      <div style={{ backgroundColor: C.bgCard, borderBottom: `1px solid ${C.border}`, padding: "10px 16px" }}>
        <div style={{ backgroundColor: C.bgInput, borderRadius: "9px", padding: "8px 12px" }} className="flex items-center gap-2">
          <Search size={14} style={{ color: C.t3 }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索历史问题..."
            style={{ flex: 1, backgroundColor: "transparent", fontSize: "14px", color: C.t1, border: "none", outline: "none" }} />
          {search && <button onClick={() => setSearch("")}><X size={14} style={{ color: C.t3 }} /></button>}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto" style={{ backgroundColor: C.bgPage }}>
        {filtered.length === 0
          ? <EmptyState icon={<Clock size={28} style={{ color: C.t3 }} />} title="暂无历史会话" subtitle="你的问答记录会在这里显示" action="去提问" onAction={() => onSessionClick(SESSIONS[0])} />
          : groups.map(g => (
            <div key={g}>
              <div style={{ padding: "12px 16px 4px", fontSize: "12px", color: C.t3, fontWeight: 500 }}>{g}</div>
              {filtered.filter(s => s.group === g).map(s => <HistorySessionCell key={s.id} session={s} onClick={() => onSessionClick(s)} />)}
            </div>
          ))
        }
      </div>
    </div>
  );
}

// ── CitationDetailPage ────────────────────────────────────────────────────────

function CitationDetailPage({ citation, onBack }: { citation: Citation; onBack: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const sc = scoreColors(citation.similarity);
  const rc = scoreColors(citation.rerank);
  return (
    <div className="flex flex-col h-full">
      <NavBar title="引用来源" onBack={onBack} />
      <div className="flex-1 overflow-y-auto" style={{ backgroundColor: C.bgPage }}>
        {/* Document Info Card */}
        <div style={{ backgroundColor: C.bgCard, margin: "12px 16px", borderRadius: "12px", padding: "16px" }}>
          <div className="flex items-start gap-3 mb-3">
            <div style={{ width: "46px", height: "46px", backgroundColor: C.primaryLight, borderRadius: "12px", flexShrink: 0 }} className="flex items-center justify-center">
              <FileText size={22} style={{ color: C.primary }} />
            </div>
            <div className="flex-1">
              <p style={{ fontSize: "15px", fontWeight: 600, color: C.t1, marginBottom: "5px" }}>{citation.title}</p>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", backgroundColor: C.successLight, color: C.success, fontSize: "10px", padding: "2px 8px", borderRadius: "4px", fontWeight: 500 }}>
                <Check size={10} /> 已授权访问
              </div>
            </div>
          </div>
          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: "12px" }}>
            {[["所属知识库", citation.kb], ["章节路径", citation.path], ["更新时间", citation.updatedAt]].map(([l, v]) => (
              <div key={l} className="flex items-start gap-2 mb-2 last:mb-0">
                <span style={{ fontSize: "12px", color: C.t3, minWidth: "64px", flexShrink: 0, paddingTop: "1px" }}>{l}</span>
                <span style={{ fontSize: "13px", color: C.t1, lineHeight: 1.5 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Score Cards */}
        <div style={{ backgroundColor: C.bgCard, margin: "0 16px 12px", borderRadius: "12px", padding: "14px 16px" }}>
          <p style={{ fontSize: "13px", fontWeight: 600, color: C.t1, marginBottom: "12px" }}>命中分数</p>
          <div className="flex gap-3">
            {[{ label: "相似度", score: citation.similarity, colors: sc }, { label: "Rerank 分数", score: citation.rerank, colors: rc }].map(({ label, score, colors }) => (
              <div key={label} style={{ flex: 1, backgroundColor: colors.bg, borderRadius: "9px", padding: "10px 12px" }}>
                <p style={{ fontSize: "11px", color: C.t2, marginBottom: "4px" }}>{label}</p>
                <p style={{ fontSize: "24px", fontWeight: 700, color: colors.text, lineHeight: 1 }}>{Math.round(score * 100)}<span style={{ fontSize: "13px", fontWeight: 500 }}>%</span></p>
              </div>
            ))}
          </div>
        </div>

        {/* Excerpt */}
        <div style={{ backgroundColor: C.bgCard, margin: "0 16px 12px", borderRadius: "12px", padding: "14px 16px" }}>
          <p style={{ fontSize: "13px", fontWeight: 600, color: C.t1, marginBottom: "10px" }}>原文片段</p>
          <div style={{ backgroundColor: C.bgPage, borderRadius: "8px", padding: "12px 14px", lineHeight: 1.8, fontSize: "13px", color: C.t1 }}>
            {citation.excerpt.split(citation.highlight).flatMap((part, i, arr) => i < arr.length - 1
              ? [<span key={i}>{part}</span>, <mark key={`h${i}`} style={{ backgroundColor: "#FFF3B0", color: C.t1, borderRadius: "3px", padding: "0 2px" }}>{citation.highlight}</mark>]
              : [<span key={i}>{part}</span>]
            )}
            {!expanded && (
              <button onClick={() => setExpanded(true)} style={{ color: C.primary, fontSize: "12px", marginLeft: "6px" }}>展开全文</button>
            )}
          </div>
        </div>

        {/* Actions */}
        <div style={{ backgroundColor: C.bgCard, margin: "0 16px 12px", borderRadius: "12px", overflow: "hidden" }}>
          {[
            { icon: <Copy size={16} />, label: "复制引用" },
            { icon: <ChevronRight size={16} />, label: "查看上下文" },
            { icon: <Flag size={16} />, label: "反馈引用错误", color: C.danger },
          ].map(({ icon, label, color }, i, arr) => (
            <button key={label} className="w-full flex items-center justify-between px-4 py-3.5"
              style={{ borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : "none" }}>
              <div className="flex items-center gap-3">
                <span style={{ color: color || C.t2 }}>{icon}</span>
                <span style={{ fontSize: "14px", color: color || C.t1 }}>{label}</span>
              </div>
              <ChevronRight size={14} style={{ color: C.t3 }} />
            </button>
          ))}
        </div>

        {/* Permission notice */}
        <div style={{ margin: "0 16px 24px", backgroundColor: C.warningLight, borderRadius: "9px", padding: "10px 12px", display: "flex", alignItems: "flex-start", gap: "8px" }}>
          <AlertTriangle size={13} style={{ color: C.warning, flexShrink: 0, marginTop: "2px" }} />
          <p style={{ fontSize: "12px", color: C.warning, lineHeight: 1.6 }}>你暂无权限查看该文档完整原文，仅展示可访问摘要。</p>
        </div>
      </div>
    </div>
  );
}

// ── FeedbackPage ──────────────────────────────────────────────────────────────

const FEEDBACK_OPTIONS = ["答案不正确", "引用错误", "没有引用", "答案不完整", "无权限但展示了敏感内容", "其他"];

function FeedbackPage({ onBack }: { onBack: () => void }) {
  const [selected, setSelected] = useState("");
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="flex flex-col h-full">
        <NavBar title="提交反馈" onBack={onBack} />
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
          <div style={{ width: "68px", height: "68px", backgroundColor: C.successLight, borderRadius: "22px", marginBottom: "18px" }} className="flex items-center justify-center">
            <CheckCircle size={34} style={{ color: C.success }} />
          </div>
          <p style={{ fontSize: "18px", fontWeight: 700, color: C.t1, marginBottom: "8px" }}>反馈已提交</p>
          <p style={{ fontSize: "14px", color: C.t2, lineHeight: 1.75 }}>感谢你的反馈，知识库负责人将进行处理，持续改善回答质量。</p>
          <button onClick={onBack} style={{ marginTop: "28px", backgroundColor: C.primary, color: "#FFFFFF", fontSize: "15px", padding: "11px 32px", borderRadius: "10px", fontWeight: 600 }}>返回</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <NavBar title="提交反馈" onBack={onBack} />
      <div className="flex-1 overflow-y-auto" style={{ backgroundColor: C.bgPage }}>
        {/* Context summary */}
        <div style={{ backgroundColor: C.bgCard, margin: "12px 16px", borderRadius: "12px", padding: "14px 16px", border: `1px solid ${C.border}` }}>
          <div style={{ marginBottom: "10px" }}>
            <p style={{ fontSize: "11px", color: C.t3, fontWeight: 500, marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.04em" }}>原问题</p>
            <p style={{ fontSize: "14px", color: C.t1 }}>试用期请假是否影响转正？</p>
          </div>
          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: "10px" }}>
            <p style={{ fontSize: "11px", color: C.t3, fontWeight: 500, marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.04em" }}>AI 回答摘要</p>
            <p style={{ fontSize: "13px", color: C.t2, lineHeight: 1.65 }}>根据人事制度库的规定，试用期请假不会直接影响转正，但需注意累计天数及规范流程...</p>
          </div>
        </div>

        {/* Feedback type */}
        <div style={{ backgroundColor: C.bgCard, margin: "0 16px 12px", borderRadius: "12px", padding: "14px 16px" }}>
          <p style={{ fontSize: "14px", fontWeight: 600, color: C.t1, marginBottom: "12px" }}>反馈类型 <span style={{ color: C.danger, fontSize: "13px" }}>*</span></p>
          {FEEDBACK_OPTIONS.map(opt => (
            <button key={opt} onClick={() => setSelected(opt)} className="w-full flex items-center gap-3 py-2.5">
              <div style={{ width: "20px", height: "20px", borderRadius: "10px", border: `2px solid ${selected === opt ? C.primary : C.border}`, backgroundColor: selected === opt ? C.primary : "transparent", flexShrink: 0 }} className="flex items-center justify-center">
                {selected === opt && <div style={{ width: "7px", height: "7px", borderRadius: "4px", backgroundColor: "#FFFFFF" }} />}
              </div>
              <span style={{ fontSize: "14px", color: selected === opt ? C.primary : C.t1, fontWeight: selected === opt ? 500 : 400 }}>{opt}</span>
            </button>
          ))}
        </div>

        {/* Note */}
        <div style={{ backgroundColor: C.bgCard, margin: "0 16px 12px", borderRadius: "12px", padding: "14px 16px" }}>
          <p style={{ fontSize: "14px", fontWeight: 600, color: C.t1, marginBottom: "10px" }}>补充说明 <span style={{ fontSize: "12px", color: C.t3, fontWeight: 400 }}>选填</span></p>
          <textarea value={note} onChange={e => setNote(e.target.value.slice(0, 200))} placeholder="请描述具体问题，帮助我们改善回答质量..." rows={4}
            style={{ width: "100%", backgroundColor: C.bgInput, borderRadius: "8px", padding: "10px 12px", fontSize: "13px", color: C.t1, resize: "none", border: "none", outline: "none", lineHeight: 1.65, fontFamily: "inherit", boxSizing: "border-box" }} />
          <div style={{ textAlign: "right", marginTop: "4px" }}>
            <span style={{ fontSize: "11px", color: C.t3 }}>{note.length}/200</span>
          </div>
        </div>

        <div style={{ padding: "4px 16px 28px" }}>
          <button onClick={() => selected && setSubmitted(true)} disabled={!selected}
            style={{ width: "100%", backgroundColor: selected ? C.primary : C.t3, color: "#FFFFFF", fontSize: "15px", fontWeight: 600, padding: "13px", borderRadius: "10px", transition: "background-color 0.15s" }}>
            提交反馈
          </button>
        </div>
      </div>
    </div>
  );
}

// ── ProfilePage ───────────────────────────────────────────────────────────────

function ProfilePage({ onStatesClick }: { onStatesClick: () => void }) {
  return (
    <div className="flex flex-col h-full">
      <NavBar title="我的" />
      <div className="flex-1 overflow-y-auto" style={{ backgroundColor: C.bgPage }}>
        {/* User card */}
        <div style={{ backgroundColor: C.bgCard, padding: "20px 16px 18px", display: "flex", alignItems: "center", gap: "14px", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ width: "62px", height: "62px", borderRadius: "31px", background: `linear-gradient(135deg, ${C.primary}, #4DA3FF)`, flexShrink: 0 }} className="flex items-center justify-center">
            <span style={{ fontSize: "24px", fontWeight: 700, color: "#FFFFFF" }}>张</span>
          </div>
          <div>
            <p style={{ fontSize: "19px", fontWeight: 700, color: C.t1, marginBottom: "5px" }}>张明</p>
            <div className="flex items-center gap-2">
              <span style={{ fontSize: "13px", color: C.t2 }}>客服中心</span>
              <span style={{ fontSize: "13px", color: C.t3 }}>·</span>
              <div style={{ backgroundColor: C.primaryLight, color: C.primary, fontSize: "11px", padding: "2px 9px", borderRadius: "5px", fontWeight: 500 }}>客服专员</div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ backgroundColor: C.bgCard, display: "flex", borderBottom: `1px solid ${C.border}` }}>
          {[{ label: "历史问答", value: "48" }, { label: "反馈记录", value: "3" }, { label: "常用知识库", value: "2" }].map((s, i, arr) => (
            <div key={s.label} style={{ flex: 1, textAlign: "center", padding: "14px 0", borderRight: i < arr.length - 1 ? `1px solid ${C.border}` : "none" }}>
              <p style={{ fontSize: "22px", fontWeight: 700, color: C.primary, lineHeight: 1 }}>{s.value}</p>
              <p style={{ fontSize: "11px", color: C.t2, marginTop: "4px" }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Permissions */}
        <div style={{ backgroundColor: C.bgCard, margin: "10px 0 0", padding: "14px 16px" }}>
          <p style={{ fontSize: "13px", fontWeight: 600, color: C.t1, marginBottom: "10px" }}>我的知识库权限</p>
          {KBS.map(kb => (
            <div key={kb.id} className="flex items-center justify-between py-1.5">
              <span style={{ fontSize: "13px", color: kb.permission === "denied" ? C.t3 : C.t1 }}>{kb.name}</span>
              <span style={{ fontSize: "11px", color: kb.permission === "granted" ? C.success : kb.permission === "request" ? C.warning : C.danger, fontWeight: 500 }}>
                {kb.permission === "granted" ? "✓ 可访问" : kb.permission === "request" ? "需申请" : "✗ 无权限"}
              </span>
            </div>
          ))}
        </div>

        {/* Settings */}
        <div style={{ backgroundColor: C.bgCard, margin: "10px 0 0", overflow: "hidden" }}>
          {[
            { icon: <Trash2 size={16} />, label: "清空历史会话" },
            { icon: <Bell size={16} />, label: "消息通知" },
            { icon: <HelpCircle size={16} />, label: "帮助与反馈", onClick: onStatesClick },
            { icon: <Info size={16} />, label: "关于系统" },
          ].map(({ icon, label, onClick }, i, arr) => (
            <button key={label} onClick={onClick} className="w-full flex items-center justify-between px-4 py-3.5"
              style={{ borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : "none" }}>
              <div className="flex items-center gap-3">
                <span style={{ color: C.t2 }}>{icon}</span>
                <span style={{ fontSize: "14px", color: C.t1 }}>{label}</span>
              </div>
              <ChevronRight size={16} style={{ color: C.t3 }} />
            </button>
          ))}
        </div>

        <div style={{ padding: "20px 16px 32px" }}>
          <button style={{ width: "100%", backgroundColor: "transparent", border: `1.5px solid ${C.danger}`, color: C.danger, fontSize: "15px", fontWeight: 600, padding: "12px", borderRadius: "10px" }}>
            退出登录
          </button>
        </div>
      </div>
    </div>
  );
}

// ── StatesPage ────────────────────────────────────────────────────────────────

function StatesPage({ onBack }: { onBack: () => void }) {
  const items = [
    {
      label: "AI 检索中 · Loading",
      node: (
        <div style={{ backgroundColor: C.bgCard, borderRadius: "10px", padding: "14px 16px", display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "38px", height: "38px", background: `linear-gradient(135deg, ${C.primary}, #4DA3FF)`, borderRadius: "10px", flexShrink: 0 }} className="flex items-center justify-center">
            <Sparkles size={18} style={{ color: "#FFFFFF" }} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-1.5 mb-2.5">
              {[0, 0.18, 0.36].map((d, i) => (
                <span key={i} style={{ width: "7px", height: "7px", borderRadius: "4px", backgroundColor: C.primary, display: "inline-block", animationDelay: `${d}s` }} className="animate-bounce" />
              ))}
              <span style={{ fontSize: "12px", color: C.t2, marginLeft: "4px" }}>正在检索企业知识库...</span>
            </div>
            {[80, 58, 36].map((w, i) => (
              <div key={i} style={{ height: "11px", backgroundColor: C.bgInput, borderRadius: "6px", marginBottom: i < 2 ? "7px" : 0, width: `${w}%` }} />
            ))}
          </div>
        </div>
      ),
    },
    {
      label: "未找到依据 · NoEvidence",
      node: (
        <div style={{ backgroundColor: C.warningLight, border: `1px solid ${C.warning}30`, borderRadius: "10px", padding: "14px 16px" }}>
          <div className="flex items-start gap-2">
            <AlertTriangle size={16} style={{ color: C.warning, flexShrink: 0, marginTop: "2px" }} />
            <div>
              <p style={{ fontSize: "14px", fontWeight: 600, color: C.warning, marginBottom: "3px" }}>未找到足够依据</p>
              <p style={{ fontSize: "13px", color: C.t2, lineHeight: 1.65 }}>当前知识库未检索到相关内容，建议换一种问法或切换知识库。</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      label: "低置信度 · LowConfidence",
      node: (
        <div style={{ backgroundColor: C.warningLight, border: `1px solid ${C.warning}30`, borderRadius: "10px", padding: "14px 16px" }}>
          <div className="flex items-start gap-2">
            <AlertCircle size={16} style={{ color: C.warning, flexShrink: 0, marginTop: "2px" }} />
            <div>
              <p style={{ fontSize: "14px", fontWeight: 600, color: C.warning, marginBottom: "3px" }}>回答置信度较低</p>
              <p style={{ fontSize: "13px", color: C.t2, lineHeight: 1.65 }}>该回答基于有限依据生成，请结合引用来源人工确认。</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      label: "无访问权限 · NoPermission",
      node: (
        <div style={{ backgroundColor: C.dangerLight, border: `1px solid ${C.danger}30`, borderRadius: "10px", padding: "14px 16px" }}>
          <div className="flex items-start gap-2">
            <Lock size={16} style={{ color: C.danger, flexShrink: 0, marginTop: "2px" }} />
            <div>
              <p style={{ fontSize: "14px", fontWeight: 600, color: C.danger, marginBottom: "3px" }}>无权访问</p>
              <p style={{ fontSize: "13px", color: C.t2, lineHeight: 1.65 }}>你无权访问该知识库或文档片段，请联系管理员申请权限。</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      label: "模型响应超时 · ModelTimeout",
      node: (
        <div style={{ backgroundColor: C.dangerLight, border: `1px solid ${C.danger}30`, borderRadius: "10px", padding: "14px 16px" }}>
          <div className="flex items-start gap-2 mb-10">
            <Timer size={16} style={{ color: C.danger, flexShrink: 0, marginTop: "2px" }} />
            <div>
              <p style={{ fontSize: "14px", fontWeight: 600, color: C.danger, marginBottom: "3px" }}>响应超时</p>
              <p style={{ fontSize: "13px", color: C.t2 }}>模型服务响应超时，可稍后重试。</p>
            </div>
          </div>
          <button style={{ backgroundColor: C.danger, color: "#FFFFFF", fontSize: "13px", padding: "7px 18px", borderRadius: "7px", fontWeight: 500 }}>重试</button>
        </div>
      ),
    },
    {
      label: "敏感词拦截 · SensitiveBlocked",
      node: (
        <div style={{ backgroundColor: "#FFF8EC", border: `1px solid ${C.warning}30`, borderRadius: "10px", padding: "14px 16px" }}>
          <div className="flex items-start gap-2">
            <Shield size={16} style={{ color: C.warning, flexShrink: 0, marginTop: "2px" }} />
            <div>
              <p style={{ fontSize: "14px", fontWeight: 600, color: C.warning, marginBottom: "3px" }}>内容已拦截</p>
              <p style={{ fontSize: "13px", color: C.t2, lineHeight: 1.65 }}>你的问题包含敏感词，系统已拦截，请调整后重新提问。</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      label: "历史记录为空 · EmptyHistory",
      node: (
        <div style={{ backgroundColor: C.bgCard, borderRadius: "10px", padding: "22px 14px", textAlign: "center" }}>
          <div style={{ width: "52px", height: "52px", backgroundColor: C.bgInput, borderRadius: "15px", margin: "0 auto 12px" }} className="flex items-center justify-center">
            <Clock size={26} style={{ color: C.t3 }} />
          </div>
          <p style={{ fontSize: "14px", fontWeight: 600, color: C.t1, marginBottom: "4px" }}>暂无历史会话</p>
          <p style={{ fontSize: "13px", color: C.t2 }}>去提问吧，记录会在这里显示</p>
        </div>
      ),
    },
    {
      label: "无可访问知识库 · EmptyKnowledgeBase",
      node: (
        <div style={{ backgroundColor: C.bgCard, borderRadius: "10px", padding: "22px 14px", textAlign: "center" }}>
          <div style={{ width: "52px", height: "52px", backgroundColor: C.bgInput, borderRadius: "15px", margin: "0 auto 12px" }} className="flex items-center justify-center">
            <Lock size={26} style={{ color: C.t3 }} />
          </div>
          <p style={{ fontSize: "14px", fontWeight: 600, color: C.t1, marginBottom: "4px" }}>暂无可访问知识库</p>
          <p style={{ fontSize: "13px", color: C.t2, marginBottom: "14px" }}>你当前没有任何知识库的访问权限</p>
          <button style={{ backgroundColor: C.primary, color: "#FFFFFF", fontSize: "13px", padding: "8px 20px", borderRadius: "8px", fontWeight: 500 }}>联系管理员</button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col h-full">
      <NavBar title="异常状态预览" onBack={onBack} />
      <div className="flex-1 overflow-y-auto" style={{ backgroundColor: C.bgPage, padding: "12px 16px" }}>
        {items.map(({ label, node }) => (
          <div key={label} style={{ marginBottom: "14px" }}>
            <p style={{ fontSize: "10px", color: C.t3, fontWeight: 600, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
            {node}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("chat");
  const [subPage, setSubPage] = useState<SubPage>(null);
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);
  const [selectedKBId, setSelectedKBId] = useState("aftersales");
  const [showKBSheet, setShowKBSheet] = useState(false);

  const selectedKB = KBS.find(kb => kb.id === selectedKBId) ?? KBS[0];

  const goTo = (page: SubPage, citation?: Citation) => {
    setSubPage(page);
    if (citation) setSelectedCitation(citation);
  };
  const goBack = () => setSubPage(null);
  const changeTab = (tab: Tab) => { setActiveTab(tab); setSubPage(null); };

  const renderPage = () => {
    if (subPage === "citation" && selectedCitation) return <CitationDetailPage citation={selectedCitation} onBack={goBack} />;
    if (subPage === "feedback") return <FeedbackPage onBack={goBack} />;
    if (subPage === "states") return <StatesPage onBack={goBack} />;
    switch (activeTab) {
      case "chat": return (
        <ChatPage kb={selectedKB} onKBClick={() => setShowKBSheet(true)}
          onCitationClick={c => goTo("citation", c)} onFeedbackClick={() => goTo("feedback")} />
      );
      case "knowledge": return (
        <KnowledgePage selectedKBId={selectedKBId} onSelect={id => { setSelectedKBId(id); changeTab("chat"); }} />
      );
      case "history": return <HistoryPage onSessionClick={() => changeTab("chat")} />;
      case "profile": return <ProfilePage onStatesClick={() => goTo("states")} />;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#D1D5DB", fontFamily: "-apple-system, 'PingFang SC', 'Helvetica Neue', sans-serif" }}>
      <style>{`
        @keyframes bounce { 0%,100%{transform:translateY(0);opacity:.4} 50%{transform:translateY(-4px);opacity:1} }
        .animate-bounce { animation: bounce 1.2s ease-in-out infinite; }
        .skeleton-shimmer { animation: shimmer 1.6s ease-in-out infinite; }
        @keyframes shimmer { 0%,100%{opacity:.45} 50%{opacity:.9} }
        textarea::placeholder,input::placeholder { color:#BDBDBD; }
        ::-webkit-scrollbar { display:none; }
        * { -webkit-tap-highlight-color:transparent; }
      `}</style>

      {/* Phone frame */}
      <div style={{
        width: "375px", height: "812px",
        borderRadius: "50px", overflow: "hidden",
        boxShadow: "0 30px 60px rgba(0,0,0,0.35), 0 0 0 1px rgba(0,0,0,0.12), inset 0 0 0 2px rgba(255,255,255,0.15)",
        backgroundColor: C.bgPage,
        position: "relative",
      }} className="flex flex-col">
        <StatusBar />

        <div className="flex-1 overflow-hidden relative flex flex-col">
          {renderPage()}

          <BottomSheet show={showKBSheet} onClose={() => setShowKBSheet(false)} title="选择知识库">
            {KBS.map(kb => (
              <KnowledgeBaseCell key={kb.id} kb={kb} isSelected={selectedKBId === kb.id}
                onSelect={() => { setSelectedKBId(kb.id); setShowKBSheet(false); }} />
            ))}
            <div style={{ height: "20px" }} />
          </BottomSheet>
        </div>

        {subPage === null && <TabBar active={activeTab} onChange={changeTab} />}
      </div>
    </div>
  );
}
