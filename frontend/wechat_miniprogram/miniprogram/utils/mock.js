const knowledgeBases = [
  {
    id: "hr",
    name: "人事制度库",
    description: "员工手册、考勤制度、薪酬福利规范",
    department: "人力资源部",
    docCount: 128,
    updatedAt: "7天前",
    permission: "granted",
    permissionText: "可访问",
  },
  {
    id: "product",
    name: "产品资料库",
    description: "产品规格、安装手册、技术参数",
    department: "产品研发部",
    docCount: 342,
    updatedAt: "今天",
    permission: "granted",
    permissionText: "可访问",
  },
  {
    id: "aftersales",
    name: "售后知识库",
    description: "退换货政策、维修流程、售后规范",
    department: "客服中心",
    docCount: 215,
    updatedAt: "3天前",
    permission: "granted",
    permissionText: "可访问",
  },
  {
    id: "tech",
    name: "研发技术库",
    description: "技术架构、API 文档、开发规范",
    department: "技术部",
    docCount: 489,
    updatedAt: "昨天",
    permission: "denied",
    permissionText: "无访问权限",
  },
  {
    id: "training",
    name: "培训资料库",
    description: "新员工培训、技能培训、管理课程",
    department: "人力资源部",
    docCount: 76,
    updatedAt: "2周前",
    permission: "granted",
    permissionText: "可访问",
  },
  {
    id: "faq",
    name: "企业 FAQ",
    description: "常见问题解答、快速指引",
    department: "综合办公室",
    docCount: 56,
    updatedAt: "今天",
    permission: "granted",
    permissionText: "可访问",
  },
];

const examples = [
  "试用期请假是否影响转正？",
  "产品安装失败如何排查？",
  "售后退换货流程是什么？",
  "如何申请远程办公？",
];

const citations = [
  {
    id: "c1",
    title: "员工手册 v4.2",
    kb: "人事制度库",
    path: "第3章 > 考勤制度 > 试用期规定",
    updatedAt: "2024-03-15",
    similarity: "0.92",
    rerank: "0.95",
    rerankPercent: "95%",
    scoreLevel: "good",
    excerpt: "试用期员工享有与正式员工同等的请假权利。试用期内请假不直接影响转正考核，但需按规定提前申请并获批准。",
    highlight: "试用期内请假不直接影响转正考核",
    permitted: true,
  },
  {
    id: "c2",
    title: "HR政策补充说明",
    kb: "人事制度库",
    path: "附录B > 常见问题解答",
    updatedAt: "2024-01-20",
    similarity: "0.87",
    rerank: "0.81",
    rerankPercent: "81%",
    scoreLevel: "warn",
    excerpt: "关于试用期请假：事假累计超过5天、病假累计超过10天可能影响转正评估，建议提前与直属领导沟通。",
    highlight: "事假累计超过5天、病假累计超过10天可能影响转正评估",
    permitted: true,
  },
  {
    id: "c3",
    title: "考勤管理制度2024",
    kb: "人事制度库",
    path: "第2章 > 请假管理",
    updatedAt: "2024-02-01",
    similarity: "0.78",
    rerank: "0.72",
    rerankPercent: "72%",
    scoreLevel: "warn",
    excerpt: "所有类型请假均需通过OA系统提交申请，审批通过后方可生效。紧急情况可事后补办，但需提供相关证明。",
    highlight: "均需通过OA系统提交申请",
    permitted: false,
  },
];

const answerText = "根据人事制度库的相关规定，试用期请假不会直接影响转正，但需注意以下几点：\n\n1. 正常请假：试用期员工享有与正式员工同等的请假权利，合规请假不影响转正考核。\n\n2. 注意事项：事假累计超过 5 天或病假累计超过 10 天，可能在转正评估时被纳入参考，建议提前与直属领导沟通。\n\n3. 请假流程：须通过 OA 系统提前申请，获批准后方可生效。\n\n建议在试用期内保持良好的出勤记录，如有特殊情况，请及时与 HR 沟通说明。";

const answerBlocks = [
  {
    id: "p1",
    segments: [
      { id: "p1-s1", text: "根据人事制度库的相关规定，" },
      { id: "p1-s2", text: "试用期请假不会直接影响转正", strong: true },
      { id: "p1-s3", text: "，但需注意以下几点：" },
    ],
  },
  {
    id: "p2",
    segments: [
      { id: "p2-s1", text: "1. " },
      { id: "p2-s2", text: "正常请假：", strong: true },
      { id: "p2-s3", text: "试用期员工享有与正式员工同等的请假权利，合规请假不影响转正考核。" },
    ],
  },
  {
    id: "p3",
    segments: [
      { id: "p3-s1", text: "2. " },
      { id: "p3-s2", text: "注意事项：", strong: true },
      { id: "p3-s3", text: "事假累计超过 5 天或病假累计超过 10 天，可能在转正评估时被纳入参考，建议提前与直属领导沟通。" },
    ],
  },
  {
    id: "p4",
    segments: [
      { id: "p4-s1", text: "3. " },
      { id: "p4-s2", text: "请假流程：", strong: true },
      { id: "p4-s3", text: "须通过 OA 系统提前申请，获批准后方可生效。" },
    ],
  },
  {
    id: "p5",
    segments: [
      { id: "p5-s1", text: "建议在试用期内保持良好的出勤记录，如有特殊情况，请及时与 HR 沟通说明。" },
    ],
  },
];

const sessions = [
  { id: "s1", title: "试用期请假是否影响转正", kb: "人事制度库", preview: "试用期请假不会直接影响转正，但事假超5天需注意...", messageCount: 3, time: "14:30", group: "今天" },
  { id: "s2", title: "售后退换货流程是什么", kb: "售后知识库", preview: "客户在收货7日内可申请无理由退货，需提供原包装...", messageCount: 5, time: "10:15", group: "今天" },
  { id: "s3", title: "产品安装故障排查步骤", kb: "产品资料库", preview: "安装失败通常由驱动版本不匹配导致，建议先检查...", messageCount: 8, time: "16:42", group: "昨天" },
  { id: "s4", title: "如何申请远程办公", kb: "人事制度库", preview: "远程办公申请需填写OA表单，经直属领导和HR审批...", messageCount: 2, time: "09:20", group: "昨天" },
  { id: "s5", title: "报销发票有哪些要求", kb: "人事制度库", preview: "须提供增值税专用发票或普通发票，注意抬头一致...", messageCount: 4, time: "", group: "近7天" },
  { id: "s6", title: "设备固件升级失败处理", kb: "产品资料库", preview: "升级失败可尝试检查网络稳定性，重启设备后重试...", messageCount: 6, time: "", group: "近7天" },
];

const statusCards = [
  { type: "loading", icon: "/images/icons/regenerate.png", title: "AI 正在检索企业知识库", desc: "正在匹配可访问文档片段，请稍候。" },
  { type: "streaming", icon: "/images/icons/ai-assistant.png", title: "正在基于知识库生成回答", desc: "已找到相关引用，正在流式输出。" },
  { type: "no-evidence", icon: "/images/icons/warning-triangle.png", title: "未找到足够依据", desc: "建议换一种问法或切换知识库。" },
  { type: "low-confidence", icon: "/images/icons/warning-circle.png", title: "回答置信度较低", desc: "请结合引用来源人工确认。" },
  { type: "no-permission", icon: "/images/icons/no-permission.png", title: "无访问权限", desc: "你无权访问该知识库或文档片段。" },
  { type: "timeout", icon: "/images/icons/timeout.png", title: "模型服务响应超时", desc: "可稍后重试。" },
  { type: "blocked", icon: "/images/icons/blocked.png", title: "内容已拦截", desc: "问题包含敏感内容，系统已拦截。" },
  { type: "empty-history", icon: "/images/icons/history.png", title: "暂无历史会话", desc: "去提问后记录会展示在这里。" },
  { type: "empty-kb", icon: "/images/icons/knowledge-base.png", title: "暂无可访问知识库", desc: "请联系管理员配置权限。" },
];

function findKnowledgeBase(id) {
  return knowledgeBases.find((item) => item.id === id) || knowledgeBases[2];
}

function findCitation(id) {
  return citations.find((item) => item.id === id) || citations[0];
}

function groupSessions() {
  const groups = [];
  sessions.forEach((session) => {
    let group = groups.find((item) => item.name === session.group);
    if (!group) {
      group = { name: session.group, items: [] };
      groups.push(group);
    }
    group.items.push({
      ...session,
      displayTime: session.time || session.group,
    });
  });
  return groups;
}

module.exports = {
  knowledgeBases,
  examples,
  citations,
  answerText,
  answerBlocks,
  sessions,
  statusCards,
  findKnowledgeBase,
  findCitation,
  groupSessions,
};
