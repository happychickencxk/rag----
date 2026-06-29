/**
 * SSE（Server-Sent Events）纯函数解析器
 * 处理微信小程序分块响应的 SSE 事件解码。
 *
 * 支持的场景：
 * - 一个 chunk 内多个 data 事件
 * - 一个事件被拆到多个 chunk
 * - CRLF 和 LF 行结束符
 * - 中文 UTF-8 字节被分割
 * - 空行分隔事件
 * - done=false 文本追加
 * - done=true 返回 message_id 和 citations
 * - 非 JSON 行、心跳行和结束前残留缓冲
 */

/**
 * 创建可跨网络分块保存 UTF-8 残留字节的解码器。
 * onChunkReceived 可能从一个中文字符中间拆包，不能逐块新建
 * TextDecoder，否则会产生替换字符。
 */
function createUTF8ChunkDecoder() {
  const decoder = typeof TextDecoder !== "undefined"
    ? new TextDecoder("utf-8")
    : null;
  let pending = new Uint8Array(0);

  function toBytes(chunk) {
    if (chunk instanceof Uint8Array) {
      return chunk;
    }
    if (chunk instanceof ArrayBuffer) {
      return new Uint8Array(chunk);
    }
    if (chunk && chunk.buffer instanceof ArrayBuffer) {
      return new Uint8Array(chunk.buffer, chunk.byteOffset || 0, chunk.byteLength);
    }
    return new Uint8Array(0);
  }

  function mergeBytes(left, right) {
    if (left.length === 0) return right;
    const merged = new Uint8Array(left.length + right.length);
    merged.set(left, 0);
    merged.set(right, left.length);
    return merged;
  }

  function expectedLength(byte) {
    if (byte < 0x80) return 1;
    if ((byte & 0xE0) === 0xC0) return 2;
    if ((byte & 0xF0) === 0xE0) return 3;
    if ((byte & 0xF8) === 0xF0) return 4;
    return 1;
  }

  function completePrefixLength(bytes) {
    let index = 0;
    while (index < bytes.length) {
      const length = expectedLength(bytes[index]);
      if (index + length > bytes.length) {
        return index;
      }
      index += length;
    }
    return index;
  }

  function decodeCompleteBytes(bytes) {
    let result = "";
    let index = 0;

    while (index < bytes.length) {
      const first = bytes[index];
      const length = expectedLength(first);
      if (length === 1) {
        result += String.fromCharCode(first);
        index += 1;
        continue;
      }

      let codePoint = first & (0x7F >> length);
      let valid = true;
      for (let offset = 1; offset < length; offset += 1) {
        const next = bytes[index + offset];
        if ((next & 0xC0) !== 0x80) {
          valid = false;
          break;
        }
        codePoint = (codePoint << 6) | (next & 0x3F);
      }

      if (!valid) {
        result += "\uFFFD";
        index += 1;
        continue;
      }

      if (codePoint <= 0xFFFF) {
        result += String.fromCharCode(codePoint);
      } else {
        const adjusted = codePoint - 0x10000;
        result += String.fromCharCode(0xD800 + (adjusted >> 10));
        result += String.fromCharCode(0xDC00 + (adjusted & 0x3FF));
      }
      index += length;
    }

    return result;
  }

  return {
    push(chunk) {
      if (typeof chunk === "string") {
        return chunk;
      }

      const bytes = toBytes(chunk);
      if (decoder) {
        return decoder.decode(bytes, { stream: true });
      }

      const merged = mergeBytes(pending, bytes);
      const completeLength = completePrefixLength(merged);
      const complete = merged.subarray(0, completeLength);
      pending = merged.slice(completeLength);
      return decodeCompleteBytes(complete);
    },

    finish() {
      if (decoder) {
        return decoder.decode();
      }
      const rest = pending;
      pending = new Uint8Array(0);
      return decodeCompleteBytes(rest);
    },

    reset() {
      pending = new Uint8Array(0);
    },
  };
}

/**
 * SSE 解析器状态机
 *
 * @param {object} [opts]
 * @param {function} [opts.onText] - 收到 content 追加文本时回调
 * @param {function} [opts.onDone] - 收到 done=true 事件时回调，参数 { message_id, citations }
 * @param {function} [opts.onError] - 解析出错时回调
 * @returns {object} { push, finish }
 */
function createSSEParser(opts) {
  const { onText, onDone, onError } = opts || {};

  // 缓冲区，处理跨 chunk 数据
  let buffer = "";
  // 当前事件的数据行
  let dataLines = [];

  function processLine(line) {
    // 空行表示事件结束
    if (line === "" || line === "\r") {
      if (dataLines.length > 0) {
        processEvent(dataLines.join("\n"));
        dataLines = [];
      }
      return;
    }

    // 注释行（以 : 开头），忽略（心跳）
    if (line.startsWith(":")) {
      return;
    }

    // data: 行
    if (line.startsWith("data:")) {
      // 提取 data: 后的内容，处理可能的前导空格
      const payload = line.slice(5).replace(/^ /, "");
      dataLines.push(payload);
      return;
    }

    // 其他字段（event:, id:, retry:）在小程序场景忽略
  }

  function processEvent(dataStr) {
    try {
      const event = JSON.parse(dataStr);
      if (event.done === true) {
        if (onDone) {
          onDone({
            message_id: event.message_id || "",
            citations: event.citations || [],
          });
        }
      } else if (typeof event.content === "string") {
        if (onText) {
          onText(event.content);
        }
      }
      // done=false 且无 content 时忽略
    } catch (e) {
      // 非 JSON 行忽略（如心跳数据）
      if (onError) {
        onError(e);
      }
    }
  }

  return {
    /**
     * 喂入新的 chunk 数据（字符串）。
     * @param {string} chunk
     */
    push(chunk) {
      buffer += chunk;

      // 按行分割处理
      // 先处理完整的行，保留最后一个不完整行在 buffer 中
      let idx;
      while ((idx = buffer.indexOf("\n")) !== -1) {
        let line = buffer.substring(0, idx);
        // 处理可能存在的 \r
        if (line.endsWith("\r")) {
          line = line.slice(0, -1);
        }
        buffer = buffer.substring(idx + 1);
        processLine(line);
      }
      // buffer 中现在只保留了最后一个不完整行（没有 \n 结尾）
      // 但如果 buffer 持续增长且没有 \n，说明是单行跨 chunk，
      // 继续等待下一个 chunk
    },

    /**
     * 输入结束，处理残留缓冲。
     */
    finish() {
      // 处理 buffer 中残留的最后一行
      if (buffer.trim()) {
        processLine(buffer.trimEnd());
      }
      // 处理未完成的事件
      if (dataLines.length > 0) {
        processEvent(dataLines.join("\n"));
        dataLines = [];
      }
      buffer = "";
    },

    /** 重置解析器状态 */
    reset() {
      buffer = "";
      dataLines = [];
    },
  };
}

module.exports = {
  createSSEParser,
  createUTF8ChunkDecoder,
};
