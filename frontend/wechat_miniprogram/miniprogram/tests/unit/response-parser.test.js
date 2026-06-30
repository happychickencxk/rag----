/**
 * 测试：统一响应 code 非 200 时抛出业务错误
 */
const assert = require("node:assert");
const test = require("node:test");

// 模拟 parseResponse 逻辑
class BusinessError extends Error {
  constructor(code, message, data) {
    super(message);
    this.name = "BusinessError";
    this.code = code;
    this.data = data;
  }
}

function parseResponse(res) {
  const { statusCode, data } = res;

  if (statusCode === 401) {
    const err = new BusinessError(401, "登录已过期，请重新登录");
    err.httpStatus = 401;
    throw err;
  }
  if (statusCode === 403) {
    const err = new BusinessError(
      403,
      (data && data.message) || "无访问权限",
      data && data.data
    );
    err.httpStatus = 403;
    throw err;
  }
  if (statusCode === 404) {
    const err = new BusinessError(404, "资源不存在或已失效");
    err.httpStatus = 404;
    throw err;
  }
  if (statusCode >= 400 && statusCode < 600) {
    const err = new BusinessError(statusCode, `请求失败（${statusCode}）`);
    err.httpStatus = statusCode;
    throw err;
  }

  if (data && typeof data.code !== "undefined" && data.code !== 200) {
    const err = new BusinessError(data.code, data.message || "操作失败", data.data);
    err.httpStatus = statusCode;
    throw err;
  }

  return data ? data.data : null;
}

test("HTTP 200 + code=200 正常返回 data", () => {
  const result = parseResponse({
    statusCode: 200,
    data: { code: 200, message: "操作成功", data: { id: "k1", name: "知识库" } },
  });
  assert.deepStrictEqual(result, { id: "k1", name: "知识库" });
});

test("HTTP 200 + code=400 抛出业务错误", () => {
  assert.throws(
    () =>
      parseResponse({
        statusCode: 200,
        data: { code: 400, message: "参数错误" },
      }),
    (err) => err instanceof BusinessError && err.code === 400
  );
});

test("HTTP 200 + code=500 抛出业务错误", () => {
  assert.throws(
    () =>
      parseResponse({
        statusCode: 200,
        data: { code: 500, message: "服务异常" },
      }),
    (err) => err instanceof BusinessError && err.code === 500
  );
});

test("HTTP 401 抛出登录过期错误", () => {
  assert.throws(
    () =>
      parseResponse({
        statusCode: 401,
        data: null,
      }),
    (err) => err.httpStatus === 401
  );
});

test("HTTP 403 抛出无权限错误", () => {
  assert.throws(
    () =>
      parseResponse({
        statusCode: 403,
        data: {},
      }),
    (err) => err.httpStatus === 403
  );
});

test("HTTP 403 优先显示后端返回的原因", () => {
  assert.throws(
    () =>
      parseResponse({
        statusCode: 403,
        data: { code: 403, message: "账号已停用或锁定", data: null },
      }),
    (err) => err.message === "账号已停用或锁定"
  );
});

test("HTTP 500 抛出服务异常错误", () => {
  assert.throws(
    () =>
      parseResponse({
        statusCode: 500,
        data: {},
      }),
    (err) => err.httpStatus === 500
  );
});

test("HTTP 200 有 code 和 data 字段正常返回嵌套 data", () => {
  const result = parseResponse({
    statusCode: 200,
    data: { code: 200, message: "操作成功", data: { records: [], total: 0 } },
  });
  assert.deepStrictEqual(result, { records: [], total: 0 });
});
