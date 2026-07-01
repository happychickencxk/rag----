/**
 * 判断页面内会话是否已经与全局知识库状态失配。
 */
function shouldResetLocalSession(localSessionId, storedSession, selectedKbId) {
  if (!localSessionId) return false;
  if (!storedSession || storedSession.id !== localSessionId) return true;
  return storedSession.kb_id !== selectedKbId;
}

module.exports = {
  shouldResetLocalSession,
};
