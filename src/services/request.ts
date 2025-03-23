type Method = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface Params {
  cacheTime?: number; // 缓存时间，单位为秒。默认强缓存，0为不缓存
  params?: Record<string, any>;
  timeout?: number; // 超时时间，单位为毫秒
  retries?: number; // 重试次数
  retryDelay?: number; // 重试延迟，单位为毫秒
  headers?: Record<string, string>; // 自定义请求头
  withCredentials?: boolean; // 跨域请求是否携带 cookie
  signal?: AbortSignal; // 用于取消请求的信号
  onProgress?: (progress: ProgressEvent) => void; // 进度回调函数
  useXHR?: boolean; // 是否使用 XMLHttpRequest 替代 fetch（用于支持上传进度）
}

interface Props extends Params {
  url: string;
  method: Method;
  mode?: RequestMode;
  token?: string;
}

// HTTP 状态码对应的错误消息
const HTTP_STATUS_MESSAGES: Record<number, string> = {
  400: '请求参数错误',
  401: '未授权，请重新登录',
  403: '拒绝访问',
  404: '请求地址不存在',
  405: '请求方法不允许',
  408: '请求超时',
  409: '资源冲突',
  500: '服务器内部错误',
  501: '服务未实现',
  502: '网关错误',
  503: '服务不可用',
  504: '网关超时',
};

type Config = { next: { revalidate: number } } | { cache: 'no-store' } | { cache: 'force-cache' };

// 请求错误类型
export class RequestError extends Error {
  url: string;
  status?: number;
  statusText?: string;
  data?: any;

  constructor(message: string, url: string, status?: number, statusText?: string, data?: any) {
    super(message);
    this.name = 'RequestError';
    this.url = url;
    this.status = status;
    this.statusText = statusText;
    this.data = data;
  }
}

// 响应数据接口
export interface ApiResponse<T> {
  data: T;
  message: string;
  reason?: string;
  code?: number;
  success?: boolean;
}

class Request {
  baseURL: string;
  defaultTimeout: number;
  defaultRetries: number;
  defaultRetryDelay: number;

  constructor(
    baseURL: string,
    options?: {
      timeout?: number;
      retries?: number;
      retryDelay?: number;
    },
  ) {
    this.baseURL = baseURL;
    this.defaultTimeout = options?.timeout || 10000; // 默认超时 10 秒
    this.defaultRetries = options?.retries || 0; // 默认不重试
    this.defaultRetryDelay = options?.retryDelay || 1000; // 默认重试延迟 1 秒
  }

  /**
   * 创建超时 Promise
   */
  createTimeoutPromise(timeout: number): Promise<never> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        reject(new RequestError('请求超时', '', undefined, 'Timeout'));
      }, timeout);
    });
  }

  /**
   * 请求拦截器
   */
  interceptorsRequest({
    url,
    method,
    params,
    cacheTime,
    mode,
    token,
    headers: customHeaders,
    withCredentials,
  }: Props) {
    let queryParams = ''; // url参数
    let requestPayload: any = undefined; // 请求体数据

    // 请求头
    const headers: Record<string, string> = {
      ...customHeaders,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config: Config =
      cacheTime !== undefined
        ? cacheTime > 0
          ? { next: { revalidate: cacheTime } }
          : { cache: 'no-store' }
        : { cache: 'force-cache' };

    if (method === 'GET' || method === 'DELETE') {
      // fetch 对 GET 请求等，不支持将参数传在 body 上，只能拼接 url
      if (params) {
        queryParams = new URLSearchParams(
          Object.entries(params)
            .filter(([, v]) => v !== undefined)
            .map(([k, v]) => [k, String(v)]),
        ).toString();
        url = queryParams ? `${url}?${queryParams}` : url;
      }
    } else {
      // 处理不同类型的请求体
      if (params) {
        if (params instanceof FormData || params instanceof URLSearchParams) {
          requestPayload = params;
        } else {
          headers['Content-Type'] = headers['Content-Type'] || 'application/json';
          requestPayload = JSON.stringify(params);
        }
      }
    }

    return {
      url,
      options: {
        method,
        headers,
        mode,
        credentials: withCredentials
          ? ('include' as RequestCredentials)
          : ('same-origin' as RequestCredentials),
        body: requestPayload,
        ...config,
      },
    };
  }

  /**
   * 响应拦截器
   */
  async interceptorsResponse<T>(res: Response, url: string): Promise<T> {
    const status = res.status;
    const statusText = res.statusText;

    // 处理非 JSON 响应类型（如文件下载等）
    const contentType = res.headers.get('content-type');

    if (contentType && !contentType.includes('application/json')) {
      if (res.ok) {
        // 对于成功的非 JSON 响应，直接返回原始响应
        return res as unknown as T;
      } else {
        throw new RequestError(
          HTTP_STATUS_MESSAGES[status] || `HTTP 错误: ${status} ${statusText}`,
          url,
          status,
          statusText,
        );
      }
    }

    if (res.ok) {
      try {
        const data = await res.json();

        // 检查业务状态码
        if (data && data.code !== undefined && data.code !== 0 && data.code !== 200) {
          throw new RequestError(
            data.message || data.reason || '请求失败',
            url,
            status,
            statusText,
            data,
          );
        }

        return data as T;
      } catch (error) {
        if (error instanceof RequestError) {
          throw error;
        }

        throw new RequestError('解析响应数据失败', url, status, statusText);
      }
    } else {
      // 处理 HTTP 错误
      try {
        const errorData = await res.json();
        throw new RequestError(
          errorData.message || HTTP_STATUS_MESSAGES[status] || '接口错误',
          url,
          status,
          statusText,
          errorData,
        );
      } catch (error) {
        if (error instanceof RequestError) {
          throw error;
        }

        throw new RequestError(
          HTTP_STATUS_MESSAGES[status] || `HTTP 错误: ${status} ${statusText}`,
          url,
          status,
          statusText,
        );
      }
    }
  }

  /**
   * 执行请求重试
   */
  async executeWithRetry<T>(
    requestFn: () => Promise<T>,
    retries: number,
    retryDelay: number,
  ): Promise<T> {
    try {
      return await requestFn();
    } catch (error) {
      if (retries > 0 && !(error instanceof RequestError && error.status === 401)) {
        // 不重试 401 错误
        await new Promise((resolve) => setTimeout(resolve, retryDelay));

        return this.executeWithRetry(requestFn, retries - 1, retryDelay);
      }

      throw error;
    }
  }

  /**
   * 使用 XMLHttpRequest 发送请求（支持进度监控）
   */
  sendRequestWithXHR({
    url,
    method,
    headers,
    body,
    timeout,
    withCredentials,
    onProgress,
    signal,
  }: {
    url: string;
    method: Method;
    headers: Record<string, string>;
    body: any;
    timeout?: number;
    withCredentials?: boolean;
    onProgress?: (progress: ProgressEvent) => void;
    signal?: AbortSignal;
  }): Promise<Response> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // 处理进度事件
      if (onProgress && method !== 'GET') {
        xhr.upload.addEventListener('progress', onProgress);
      }

      // 处理加载完成
      xhr.addEventListener('load', () => {
        const response = new Response(xhr.response, {
          status: xhr.status,
          statusText: xhr.statusText,
          headers: this.parseXHRHeaders(xhr),
        });

        resolve(response);
      });

      // 处理错误
      xhr.addEventListener('error', () => {
        reject(new RequestError('网络错误', url));
      });

      // 处理超时
      xhr.addEventListener('timeout', () => {
        reject(new RequestError('请求超时', url));
      });

      // 处理中止
      xhr.addEventListener('abort', () => {
        reject(new DOMException('请求已取消', 'AbortError'));
      });

      // 打开请求
      xhr.open(method, url, true);

      // 设置请求头
      for (const [key, value] of Object.entries(headers)) {
        xhr.setRequestHeader(key, value);
      }

      // 设置超时
      if (timeout) {
        xhr.timeout = timeout;
      }

      // 设置跨域认证
      if (withCredentials) {
        xhr.withCredentials = true;
      }

      // 处理 AbortSignal
      if (signal) {
        signal.addEventListener('abort', () => xhr.abort());
      }

      // 发送请求
      xhr.send(body);
    });
  }

  /**
   * 解析 XHR 响应头
   */
  private parseXHRHeaders(xhr: XMLHttpRequest): Headers {
    const headerString = xhr.getAllResponseHeaders();
    const headers = new Headers();

    if (!headerString) {
      return headers;
    }

    const headerPairs = headerString.trim().split(/[\r\n]+/);

    headerPairs.forEach((line) => {
      const parts = line.split(': ');
      const key = parts.shift();
      const value = parts.join(': ');

      if (key) {
        headers.append(key, value);
      }
    });

    return headers;
  }

  async httpFactory<T>({
    url = '',
    params = {},
    method,
    mode,
    token,
    timeout = this.defaultTimeout,
    retries = this.defaultRetries,
    retryDelay = this.defaultRetryDelay,
    signal,
    onProgress,
    useXHR = false,
    ...rest
  }: Props): Promise<T> {
    const fullUrl = this.baseURL + url;

    const req = this.interceptorsRequest({
      url: fullUrl,
      method,
      params: params.params,
      cacheTime: params.cacheTime,
      mode,
      token,
      headers: rest.headers,
      withCredentials: rest.withCredentials,
    });

    const requestFn = async () => {
      // 当有进度回调或明确指定使用 XHR 时，使用 XMLHttpRequest
      const shouldUseXHR = useXHR || (!!onProgress && method !== 'GET' && method !== 'DELETE');

      let res: Response;

      if (shouldUseXHR) {
        res = await this.sendRequestWithXHR({
          url: req.url,
          method,
          headers: req.options.headers as Record<string, string>,
          body: req.options.body,
          timeout,
          withCredentials: rest.withCredentials,
          onProgress,
          signal,
        });
      } else {
        const fetchPromise = fetch(req.url, { ...req.options, signal });

        if (timeout) {
          const timeoutPromise = this.createTimeoutPromise(timeout);
          res = await Promise.race([fetchPromise, timeoutPromise]);
        } else {
          res = await fetchPromise;
        }
      }

      return this.interceptorsResponse<T>(res, fullUrl);
    };

    return this.executeWithRetry(requestFn, retries, retryDelay);
  }

  async request<T>(
    method: Method,
    url: string,
    params?: Params,
    mode?: RequestMode,
    token?: string,
  ): Promise<T> {
    return this.httpFactory<T>({
      url,
      params,
      method,
      mode,
      token,
      timeout: params?.timeout,
      retries: params?.retries,
      retryDelay: params?.retryDelay,
      signal: params?.signal,
      headers: params?.headers,
      withCredentials: params?.withCredentials,
      onProgress: params?.onProgress,
      useXHR: params?.useXHR,
    });
  }

  get<T>(url: string, params?: Params, mode?: RequestMode, token?: string): Promise<T> {
    return this.request('GET', url, params, mode, token);
  }

  post<T>(url: string, params?: Params, mode?: RequestMode, token?: string): Promise<T> {
    return this.request('POST', url, params, mode, token);
  }

  put<T>(url: string, params?: Params, mode?: RequestMode, token?: string): Promise<T> {
    return this.request('PUT', url, params, mode, token);
  }

  delete<T>(url: string, params?: Params, mode?: RequestMode, token?: string): Promise<T> {
    return this.request('DELETE', url, params, mode, token);
  }

  patch<T>(url: string, params?: Params, mode?: RequestMode, token?: string): Promise<T> {
    return this.request('PATCH', url, params, mode, token);
  }

  /**
   * 创建取消令牌
   */
  createCancelToken(): { signal: AbortSignal; cancel: (reason?: string) => void } {
    const controller = new AbortController();

    return {
      signal: controller.signal,
      cancel: (reason?: string) => controller.abort(reason),
    };
  }

  /**
   * 上传文件（支持进度监控）
   * @param url 上传地址
   * @param file 要上传的文件
   * @param onProgress 进度回调函数
   * @param params 额外的请求参数
   * @param token 认证令牌
   */
  upload<T>(
    url: string,
    file: File | Blob,
    onProgress?: (progress: ProgressEvent) => void,
    params?: Record<string, any>,
    token?: string,
  ): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);

    // 添加其他参数
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          formData.append(key, String(value));
        }
      });
    }

    return this.post<T>(
      url,
      {
        params: formData,
        onProgress,
        useXHR: true, // 强制使用 XHR 以支持进度监控
      },
      undefined,
      token,
    );
  }

  /**
   * 批量上传文件（支持进度监控）
   * @param url 上传地址
   * @param files 要上传的文件列表
   * @param fileFieldName 文件字段名
   * @param onProgress 进度回调函数
   * @param params 额外的请求参数
   * @param token 认证令牌
   */
  uploadMultiple<T>(
    url: string,
    files: File[] | FileList,
    fileFieldName = 'files',
    onProgress?: (progress: ProgressEvent) => void,
    params?: Record<string, any>,
    token?: string,
  ): Promise<T> {
    const formData = new FormData();

    // 添加所有文件
    Array.from(files).forEach((file, index) => {
      formData.append(`${fileFieldName}[${index}]`, file);
    });

    // 添加其他参数
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          formData.append(key, String(value));
        }
      });
    }

    return this.post<T>(
      url,
      {
        params: formData,
        onProgress,
        useXHR: true, // 强制使用 XHR 以支持进度监控
      },
      undefined,
      token,
    );
  }
}

// 创建默认请求实例
const request = new Request(process.env.NEXT_PUBLIC_API_URL as string, {
  timeout: 15000, // 默认 15 秒超时
  retries: 1, // 默认重试 1 次
  retryDelay: 1000, // 默认重试延迟 1 秒
});

export default request;

/**
 * 统一错误处理函数
 * @param error 错误对象
 * @param fallbackMessage 默认错误消息
 * @param handlers 特定错误码处理函数
 * @returns 格式化后的错误信息
 */
export const handleRequestError = (
  error: unknown,
  fallbackMessage = '请求失败，请稍后重试',
  handlers?: {
    [key: number]: (error: RequestError) => void;
    default?: (error: unknown) => void;
    unauthorized?: () => void; // 401 未授权处理
    forbidden?: () => void; // 403 禁止访问处理
    serverError?: () => void; // 5xx 服务器错误处理
    networkError?: () => void; // 网络错误处理
  },
): string => {
  // 处理 RequestError
  if (error instanceof RequestError) {
    // 执行特定状态码的处理函数
    if (handlers) {
      if (error.status) {
        // 特定状态码的处理
        if (handlers[error.status]) {
          handlers[error.status](error);
        } else if (error.status === 401 && handlers.unauthorized) {
          handlers.unauthorized();
        } else if (error.status === 403 && handlers.forbidden) {
          handlers.forbidden();
        } else if (error.status >= 500 && handlers.serverError) {
          handlers.serverError();
        }
      }
    }

    // 返回格式化的错误消息
    return error.message || fallbackMessage;
  }

  // 处理其他类型错误
  if (handlers?.default) {
    handlers.default(error);
  }

  // 处理网络错误
  if (
    error instanceof TypeError &&
    (error.message.includes('Failed to fetch') || error.message.includes('Network request failed'))
  ) {
    if (handlers?.networkError) {
      handlers.networkError();
    }

    return '网络连接错误，请检查您的网络';
  }

  // 处理取消请求
  if (error instanceof DOMException && error.name === 'AbortError') {
    return '请求已取消';
  }

  // 返回通用错误消息
  return error instanceof Error ? error.message : fallbackMessage;
};

/**
 * 请求包装函数，处理异常并返回结果
 * @param requestFn 请求函数
 * @param errorHandler 错误处理函数或错误处理配置
 */
export const handleRequest = async <T>(
  requestFn: () => Promise<T>,
  errorHandler?:
    | ((error: unknown) => void)
    | {
        onError?: (error: unknown) => void;
        unauthorized?: () => void;
        forbidden?: () => void;
        serverError?: () => void;
        networkError?: () => void;
        default?: (error: unknown) => void;
      },
): Promise<{ data: T | null; error: string | null; status?: number }> => {
  try {
    const data = await requestFn();

    return { data, error: null };
  } catch (error) {
    const handlers = typeof errorHandler === 'function' ? { default: errorHandler } : errorHandler;

    const errorMessage = handleRequestError(error, undefined, {
      ...(handlers as any),
      default: handlers?.default || handlers?.onError,
    });

    if (typeof errorHandler === 'function') {
      errorHandler(error);
    } else if (errorHandler?.onError) {
      errorHandler.onError(error);
    } else {
      console.error('Request error:', error);
    }

    // 提供错误状态码，方便调用者进行更细粒度的处理
    const status = error instanceof RequestError ? error.status : undefined;

    return { data: null, error: errorMessage, status };
  }
};

/**
 * 用于 React 组件的 API 请求 hook
 * @example
 * // 使用示例
 * const { data, loading, error, execute } = useApiRequest(() => userApi.getUserInfo(userId));
 *
 * // 条件执行示例
 * const { data, loading, error, execute } = useApiRequest(() => userApi.getUserInfo(userId), false);
 * useEffect(() => {
 *   if (shouldFetch) {
 *     execute();
 *   }
 * }, [shouldFetch]);
 */
export const useApiRequest = <T>(requestFn: () => Promise<T>, immediate = true) => {
  // 这是一个简单的示意，实际使用中需要使用 React 的 useState 和 useEffect
  let loading = true;
  let data: T | null = null;
  let error: string | null = null;
  let status: number | undefined = undefined;

  const execute = async () => {
    loading = true;
    error = null;

    try {
      data = await requestFn();

      return { data, error: null, status: undefined };
    } catch (err) {
      error = handleRequestError(err);
      status = err instanceof RequestError ? err.status : undefined;

      return { data: null, error, status };
    } finally {
      loading = false;
    }
  };

  if (immediate) {
    execute();
  }

  return { data, loading, error, status, execute, refresh: execute };
};
