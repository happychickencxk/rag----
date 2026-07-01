/**
 * 问答特殊状态映射。
 * 后端状态统一在这里转换为页面可直接渲染的视图模型。
 */

const STATUS_DEFINITIONS = Object.freeze({
  NoEvidence: {
    code: "NoEvidence",
    tone: "warning",
    icon: "/images/icons/warning-triangle.png",
    title: "未找到足够依据",
    description: "当前知识库中没有可支撑结论的内容，建议换一种问法或切换知识库。",
    hideAnswer: true,
    hideCitations: true,
    allowRetry: true,
  },
  LowConfidence: {
    code: "LowConfidence",
    tone: "warning",
    icon: "/images/icons/warning-triangle.png",
    title: "回答置信度较低",
    description: "请结合引用来源人工确认后再使用本回答。",
    hideAnswer: false,
    hideCitations: false,
    allowRetry: true,
  },
  NoPermission: {
    code: "NoPermission",
    tone: "danger",
    icon: "/images/icons/no-permission.png",
    title: "无访问权限",
    description: "当前账号无权访问该知识库或相关文档内容。",
    hideAnswer: true,
    hideCitations: true,
    allowRetry: false,
  },
  ModelTimeout: {
    code: "ModelTimeout",
    tone: "danger",
    icon: "/images/icons/timeout.png",
    title: "模型响应超时",
    description: "本次生成未完成，请稍后重试。",
    hideAnswer: true,
    hideCitations: true,
    allowRetry: true,
  },
  SensitiveBlocked: {
    code: "SensitiveBlocked",
    tone: "danger",
    icon: "/images/icons/blocked.png",
    title: "问题已被安全策略拦截",
    description: "请调整问题内容后重新提问。",
    hideAnswer: true,
    hideCitations: true,
    allowRetry: false,
  },
});

const STATUS_ALIASES = Object.freeze({
  noevidence: "NoEvidence",
  no_evidence: "NoEvidence",
  lowconfidence: "LowConfidence",
  low_confidence: "LowConfidence",
  nopermission: "NoPermission",
  no_permission: "NoPermission",
  modeltimeout: "ModelTimeout",
  model_timeout: "ModelTimeout",
  sensitiveblocked: "SensitiveBlocked",
  sensitive_blocked: "SensitiveBlocked",
});

function normalizeStatusCode(statusCode) {
  const raw = String(statusCode || "").trim();
  if (!raw || raw.toLowerCase() === "success") return "";
  return STATUS_ALIASES[raw.toLowerCase()] || raw;
}

function resolveQaStatus(statusCode, lowConfidence) {
  const normalized = normalizeStatusCode(statusCode);
  const code = normalized || (lowConfidence ? "LowConfidence" : "");
  const definition = STATUS_DEFINITIONS[code];
  return definition ? { ...definition } : null;
}

function resolveQaErrorStatus(error) {
  if (!error) return null;

  const data = error.data || {};
  const explicit = resolveQaStatus(
    data.status_code || data.statusCode || error.statusCode || error.code,
    false
  );
  if (explicit) return explicit;

  const message = String(error.message || "");
  if (error.httpStatus === 403) {
    return resolveQaStatus("NoPermission", false);
  }
  if (/超时|timeout/i.test(message)) {
    return resolveQaStatus("ModelTimeout", false);
  }
  if (/敏感|安全策略|拦截/.test(message)) {
    return resolveQaStatus("SensitiveBlocked", false);
  }
  return null;
}

function decorateAssistantMessage(message) {
  if (!message || message.role !== "assistant") return message;
  const qaStatus = resolveQaStatus(message.statusCode, message.lowConfidence);
  return {
    ...message,
    qaStatus,
    hideAnswer: Boolean(qaStatus && qaStatus.hideAnswer),
    allowActions: !(qaStatus && ["NoPermission", "SensitiveBlocked"].includes(qaStatus.code)),
    citations:
      qaStatus && qaStatus.hideCitations
        ? []
        : message.citations || [],
  };
}

module.exports = {
  STATUS_DEFINITIONS,
  normalizeStatusCode,
  resolveQaStatus,
  resolveQaErrorStatus,
  decorateAssistantMessage,
};
