/**
 * 适配层
 * 将后端 snake_case 字段映射为现有页面视图模型。
 * 所有页面必须通过适配层读取后端数据，不直接依赖 snake_case。
 */

// ===== 知识库适配 =====

/**
 * 后端知识库记录 → 视图模型
 * 后端字段：kb_id, name, description, department_name, doc_count, chunk_count,
 *           status, created_at, updated_at
 */
function adaptKnowledgeBase(record) {
  return {
    id: record.kb_id || record.id || "",
    name: record.name || "",
    description: record.description || "",
    department: record.department_name || record.department || "",
    docCount: record.doc_count || 0,
    chunkCount: record.chunk_count || 0,
    status: record.status || "active",
    updatedAt: record.updated_at || "",
    createdAt: record.created_at || "",
    // 权限：普通用户只返回有权限的知识库，
    // 若后端返回了 permission 字段则保留，否则默认可访问
    permission: record.permission || "granted",
    permissionText: record.permission === "denied" ? "无访问权限" : "可访问",
  };
}

/**
 * 知识库分页结果 → 视图模型
 */
function adaptKnowledgeBasePage(pageResult) {
  return {
    list: (pageResult.records || []).map(adaptKnowledgeBase),
    total: pageResult.total || 0,
    page: pageResult.page || 1,
    size: pageResult.size || 10,
    pages: pageResult.pages || 0,
  };
}

// ===== 会话适配 =====

/**
 * 后端会话记录 → 视图模型
 * 后端字段：session_id, title, kb_id, kb_name, message_count, started_at, ended_at
 */
function adaptSession(record) {
  const createdAt = record.started_at || record.created_at || "";
  return {
    id: record.session_id || record.id || "",
    title: record.title || "",
    kbId: record.kb_id || "",
    kbName: record.kb_name || "",
    preview: record.preview || record.title || "",
    messageCount: record.message_count || 0,
    time: formatSessionTime(createdAt),
    createdAt: createdAt,
    updatedAt: record.ended_at || record.updated_at || "",
    // 分组依据
    group: getSessionGroup(createdAt),
  };
}

function adaptSessionPage(pageResult) {
  const records = (pageResult.records || []).map(adaptSession);
  return {
    records: records,
    total: pageResult.total || 0,
    page: pageResult.page || 1,
    size: pageResult.size || 20,
    pages: pageResult.pages || 0,
    // 分组输出
    groups: groupSessionsByTime(records),
  };
}

/**
 * 按今天、昨天、近7天、更早分组
 */
function groupSessionsByTime(sessions) {
  const groups = [
    { name: "今天", items: [] },
    { name: "昨天", items: [] },
    { name: "近7天", items: [] },
    { name: "更早", items: [] },
  ];

  sessions.forEach((session) => {
    const group = session.group;
    const target = groups.find((g) => g.name === group);
    if (target) {
      target.items.push(session);
    } else {
      groups[3].items.push(session);
    }
  });

  return groups.filter((g) => g.items.length > 0);
}

function getSessionGroup(isoString) {
  if (!isoString) return "更早";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "更早";
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 86400000);
    const weekAgo = new Date(today.getTime() - 7 * 86400000);

    if (d >= today) return "今天";
    if (d >= yesterday) return "昨天";
    if (d >= weekAgo) return "近7天";
    return "更早";
  } catch (e) {
    return "更早";
  }
}

function formatSessionTime(isoString) {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "";
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  } catch (e) {
    return "";
  }
}

// ===== 消息适配 =====

/**
 * 后端消息记录 → 视图模型
 * 后端字段：message_id, session_id, role (user/assistant), content, citations, feedback_status,
 *           low_confidence, status_code, created_at
 */
function adaptMessage(record) {
  const msg = {
    id: record.message_id || record.id || "",
    sessionId: record.session_id || "",
    role: record.role || "user",
    text: record.content || "",
    createdAt: record.created_at || "",
  };

  if (record.role === "assistant") {
    msg.citations = (record.citations || []).map(adaptCitation);
    msg.feedbackStatus = record.feedback_status || "";
    msg.lowConfidence = record.low_confidence || false;
    msg.statusCode = record.status_code || "";
    // 解析 content 为段落（用于加粗渲染），保留原始 text
    msg.paragraphs = parseContentToParagraphs(record.content || "");
  }

  return msg;
}

function adaptMessagePage(pageResult) {
  return {
    records: (pageResult.records || []).map(adaptMessage),
    total: pageResult.total || 0,
    page: pageResult.page || 1,
    size: pageResult.size || 50,
    pages: pageResult.pages || 0,
  };
}

/**
 * 将回答文本解析为段落/片段结构，支持加粗标记。
 * 识别 **text** 为加粗片段。
 */
function parseContentToParagraphs(content) {
  if (!content) return [];
  const lines = content.split("\n");
  const paragraphs = [];
  let paraId = 0;

  for (const line of lines) {
    if (!line.trim()) continue;
    paraId++;
    const segments = [];
    let segId = 0;

    // 解析 **text** 加粗标记
    const regex = /\*\*(.+?)\*\*/g;
    let lastIdx = 0;
    let match;

    while ((match = regex.exec(line)) !== null) {
      // 加粗前的普通文本
      if (match.index > lastIdx) {
        segId++;
        segments.push({
          id: `p${paraId}-s${segId}`,
          text: line.substring(lastIdx, match.index),
          strong: false,
        });
      }
      // 加粗文本
      segId++;
      segments.push({
        id: `p${paraId}-s${segId}`,
        text: match[1],
        strong: true,
      });
      lastIdx = match.index + match[0].length;
    }

    // 剩余普通文本
    if (lastIdx < line.length) {
      segId++;
      segments.push({
        id: `p${paraId}-s${segId}`,
        text: line.substring(lastIdx),
        strong: false,
      });
    }

    if (segments.length > 0) {
      paragraphs.push({ id: `p${paraId}`, segments });
    }
  }

  return paragraphs;
}

// ===== 引用适配 =====

/**
 * 后端引用记录 → 视图模型
 * 后端字段：chunk_id, doc_name, chapter_path, content, similarity_score,
 *           rerank_score, kb_name, updated_at, permission
 */
function adaptCitation(record) {
  const similarity = record.similarity_score != null
    ? record.similarity_score
    : record.similarity;
  const rerank = record.rerank_score != null
    ? record.rerank_score
    : record.rerank;

  return {
    id: record.chunk_id || record.id || "",
    title: record.doc_name || record.document_name || record.title || "",
    kb: record.kb_name || record.kb || "",
    path: record.chapter_path || record.chunk_path || record.path || "",
    updatedAt: formatDisplayDate(record.updated_at || record.updatedAt),
    similarity: similarity != null ? String(similarity) : "",
    rerank: rerank != null ? String(rerank) : "",
    rerankPercent: formatScorePercent(rerank),
    scoreLevel: getScoreLevel(rerank),
    excerpt: record.content || record.excerpt || "",
    highlight: record.highlight || "",
    // 权限保护：permitted 仅由后端返回的 permission 字段决定
    // 若后端未返回 permission 字段或值为 restricted，视为受限
    permitted: record.permission !== "restricted" && record.permission !== "denied",
    permission: record.permission || "granted",
  };
}

function formatDisplayDate(value) {
  if (!value) return "";
  const match = String(value).match(/^\d{4}-\d{2}-\d{2}/);
  return match ? match[0] : String(value);
}

function formatScorePercent(score) {
  if (score == null || score === "") return "";
  const num = parseFloat(score);
  if (isNaN(num)) return "";
  return `${Math.round(num * 100)}%`;
}

function getScoreLevel(score) {
  if (score == null || score === "") return "";
  const num = parseFloat(score);
  if (isNaN(num)) return "";
  if (num >= 0.85) return "good";
  if (num >= 0.7) return "warn";
  return "low";
}

// ===== 用户适配 =====

/**
 * 后端 profile 数据 → 我的页视图模型
 */
function adaptUserProfile(profile) {
  return {
    userId: profile.user_id || "",
    name: profile.name || "",
    avatarUrl: profile.avatar_url || "",
    department: profile.department_name || profile.department || "",
    role: profile.role_name || profile.role || "",
    isNewUser: profile.is_new_user || false,
  };
}

// ===== 反馈映射 =====

/**
 * 反馈映射：UI 细分原因 → API 反馈类型
 *
 * API-Q07 只保证 like、dislike、no_citation 三种类型。
 * 映射规则：
 * - "没有引用" → no_citation
 * - "答案不正确"、"引用错误"、"答案不完整"、"无权限但展示了敏感内容"、"其他" → dislike
 *   细分原因作为 description 前缀提交
 * - 点赞 → like
 */
const FEEDBACK_TYPE_MAP = {
  like: "like",
  dislike: "dislike",
  no_citation: "no_citation",
};

const DETAIL_REASON_MAP = {
  "答案不正确": { type: "dislike", prefix: "[答案不正确]" },
  "引用错误": { type: "dislike", prefix: "[引用错误]" },
  "没有引用": { type: "no_citation", prefix: "" },
  "答案不完整": { type: "dislike", prefix: "[答案不完整]" },
  "无权限但展示了敏感内容": { type: "dislike", prefix: "[敏感内容]" },
  "其他": { type: "dislike", prefix: "[其他]" },
};

/**
 * 将 UI 细分原因映射为 API 反馈类型和描述。
 * @param {string} reason - UI 细分原因
 * @param {string} note - 用户补充说明
 * @returns {{ feedbackType: string, description: string }}
 */
function mapFeedbackReason(reason, note) {
  const mapping = DETAIL_REASON_MAP[reason];
  if (!mapping) {
    return { feedbackType: "dislike", description: note || reason || "" };
  }
  let description = note || "";
  if (mapping.prefix) {
    description = description
      ? `${mapping.prefix} ${description}`
      : mapping.prefix;
  }
  return { feedbackType: mapping.type, description };
}

module.exports = {
  adaptKnowledgeBase,
  adaptKnowledgeBasePage,
  adaptSession,
  adaptSessionPage,
  adaptMessage,
  adaptMessagePage,
  adaptCitation,
  adaptUserProfile,
  mapFeedbackReason,
  FEEDBACK_TYPE_MAP,
  DETAIL_REASON_MAP,
  groupSessionsByTime,
  getSessionGroup,
  formatSessionTime,
  parseContentToParagraphs,
};
