import request from './request';

// 用户接口响应类型
export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  createdAt: string;
  role: string;
}

export interface UserList {
  users: User[];
  total: number;
  page: number;
  pageSize: number;
}

export interface LoginParams {
  username: string;
  password: string;
  remember?: boolean;
}

export interface LoginResult {
  token: string;
  user: User;
}

export interface UploadAvatarResult {
  url: string;
  path: string;
}

/**
 * 用户 API 服务
 */
class UserApi {
  /**
   * 用户登录
   * @param params 登录参数
   */
  login(params: LoginParams): Promise<LoginResult> {
    return request.post<LoginResult>('/api/user/login', { params });
  }

  /**
   * 用户退出登录
   */
  logout(): Promise<void> {
    return request.post<void>('/api/user/logout');
  }

  /**
   * 获取用户信息
   * @param id 用户ID，不传表示获取当前用户
   */
  getUserInfo(id?: string): Promise<User> {
    return request.get<User>(id ? `/api/user/${id}` : '/api/user/info');
  }

  /**
   * 获取用户列表
   * @param page 页码
   * @param pageSize 每页条数
   * @param query 查询参数
   */
  getUserList(
    page = 1,
    pageSize = 10,
    query?: { role?: string; keyword?: string },
  ): Promise<UserList> {
    return request.get<UserList>('/api/users', {
      params: {
        page,
        pageSize,
        ...query,
      },
    });
  }

  /**
   * 更新用户信息
   * @param id 用户ID
   * @param data 更新数据
   */
  updateUser(id: string, data: Partial<User>): Promise<User> {
    return request.put<User>(`/api/user/${id}`, { params: data });
  }

  /**
   * 上传用户头像
   * @param file 头像文件
   * @param onProgress 进度回调函数
   */
  uploadAvatar(
    file: File,
    onProgress?: (event: ProgressEvent) => void,
  ): Promise<UploadAvatarResult> {
    return request.upload<UploadAvatarResult>('/api/user/avatar', file, onProgress);
  }

  /**
   * 删除用户
   * @param id 用户ID
   */
  deleteUser(id: string): Promise<void> {
    return request.delete<void>(`/api/user/${id}`);
  }
}

export const userApi = new UserApi();
