'use client';

import { useTheme } from 'next-themes';
import { useState, useMemo, createContext } from 'react';
import { ConfigProvider, message } from 'antd';

import { RadioButton, RadioButtonOption } from './_components/RadioButton';
import PoemPoster from './_components/PoemPoster';

import {
  poemTypesMap,
  poemFormatsMap,
  INPUT_CLASSNAME,
  type ConfigFormType,
} from '@/app/constant/special/ai-generate-poem';

export const MessageContext = createContext<ReturnType<typeof message.useMessage>[0] | null>(null);

export default function AIGeneratePoem() {
  const { theme } = useTheme();

  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const [showPoster, setShowPoster] = useState(false);
  const [generatedPoem, setGeneratedPoem] = useState('');
  // 用户诗词格式配置数据
  const [configForm, setConfigForm] = useState<ConfigFormType>({
    keyword: '',
    poemType: 'normal',
    poemFormat: '5-jueju',
    author: '',
    recipient: '',
  });

  const antdThemeConfig = useMemo(() => {
    const isDarkTheme = theme === 'dark';

    return {
      token: {
        colorPrimary: isDarkTheme ? '#ffffff70' : '#d4d4d4',
        colorText: isDarkTheme ? '#fff' : '#000',
        colorBgContainer: isDarkTheme ? 'transparent' : '#ffffff20',
      },
      components: {
        InputNumber: {
          handleBorderColor: isDarkTheme ? '#ffffff70' : '#d9d9d9',
          handleHoverColor: isDarkTheme ? '#fff' : '#000',
          activeBg: isDarkTheme ? 'transparent' : '#ffffff20',
          handleBg: isDarkTheme ? 'transparent' : '#ffffff20',
          handleActiveBg: isDarkTheme ? 'transparent' : '#ffffff20',
          filledHandleBg: isDarkTheme ? '#ffffff' : '#000',
          hoverBg: isDarkTheme ? 'transparent' : '#ffffff20',
          activeBorderColor: isDarkTheme ? '#ffffff70' : '#ffffff',
          hoverBorderColor: isDarkTheme ? '#ffffff70' : '#ffffff',
          activeShadow: '0 0 2px 2px rgba(0,0,0,0.1)',
        },
        Message: { contentBg: isDarkTheme ? '#000' : '#fff' },
      },
    };
  }, [theme]);

  const setForm: (
    key: keyof ConfigFormType,
    value: (typeof configForm)[keyof typeof configForm],
  ) => void = (key, value) => {
    setConfigForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleGenerateSteamingPoem = (formData: FormData) => {
    if (!configForm.keyword.trim()) {
      messageApi.error('请输入创作主题或关键词');

      return;
    }

    setGeneratedPoem('');
    setLoading(true);
    setShowPoster(true);

    const sseConnection = createSSEConnection(formDataToObject(formData));

    // 组件卸载时自动关闭连接（在useEffect清理函数中）
    return () => sseConnection.close();
  };

  const createSSEConnection = (formData: Record<string, any>) => {
    const eventSource = new EventSource(`/api/generate-poem?${new URLSearchParams(formData)}`);

    eventSource.onmessage = (event) => {
      try {
        if (event.data === '[DONE]') return;

        const data = JSON.parse(event.data);
        const newContent = data?.choices?.[0]?.delta?.content || '';
        if (!newContent) return;
        setGeneratedPoem((prev) => {
          return prev + newContent;
        });
      } catch (err) {
        console.log(err);
      }
    };

    eventSource.onerror = () => {
      setLoading(false);
      eventSource.close();
    };

    return eventSource;
  };

  const formDataToObject = (formData: FormData) => {
    return Object.fromEntries(formData.entries());
  };

  const SubmitButton = () => (
    <button
      className={`w-42 h-15 p-1 rounded-2xl bg-gradient-to-br from-neutral-800 via-neutral-600 to-neutral-800 invert cursor-pointer brightness-150 group border-0 outline-0 transition ease-in-out dark:brightness-100 ${loading ? 'cursor-not-allowed pointer-events-none' : 'hover:shadow-lg hover:shadow-neutral-700/60 hover:scale-105 hover:from-stone-700 hover:via-stone-800 hover:to-stone-600 active:scale-103 dark:hover:shadow-white/60'}`}
      type="submit"
    >
      <div className="w-full h-full flex justify-center items-center backdrop-blur-xl bg-black/80 dark:bg-white/80 rounded-xl font-semibold text-center">
        <div className="group-hover:scale-100 flex text-neutral-600 group-hover:text-neutral-500 dark:group-hover:text-neutral-900 gap-1">
          {loading ? (
            <div className="flex flex-row gap-2">
              <div className="w-2 h-2 rounded-full bg-neutral-700 animate-bounce"></div>
              <div className="w-2 h-2 rounded-full bg-neutral-700 animate-bounce [animation-delay:-.3s]"></div>
              <div className="w-2 h-2 rounded-full bg-neutral-700 animate-bounce [animation-delay:-.5s]"></div>
            </div>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.8"
                className="w-6 h-6 stroke-neutral-600 group-hover:stroke-neutral-500 group-hover:stroke-{1.99} dark:group-hover:stroke-neutral-900"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z"
                ></path>
              </svg>
              {generatedPoem ? '重新创作' : '开始创作'}
            </>
          )}
        </div>
      </div>
    </button>
  );

  return (
    <ConfigProvider theme={antdThemeConfig}>
      <div className="size-full relative">
        {contextHolder}
        <div className="size-full absolute inset-0 z-[-1] bg-[url('@/assets/images/generate-poem/background.jpeg')] bg-no-repeat bg-cover dark:brightness-50"></div>
        <div className="container mx-auto py-8 px-4">
          <div className="w-full">
            {/* 页面标题与简介 */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-3 dark:text-white">在线自动写诗软件</h1>
              <p className="text-gray-600 dark:text-gray-200 max-w-2xl mx-auto">
                输入关键词或主题，让AI为您创作优美的诗歌，支持多种格式和样式，还可以生成精美海报。
              </p>
            </div>

            <div className="overflow-auto max-h-[80vh] rounded-lg py-8 px-12 pt-2 shadow-md backdrop-blur-sm bg-gray-200/60 font-[fangsong] text-lg text-black/90 dark:bg-black/30 dark:text-white/90">
              {/* 主工具区域 */}
              <form action={handleGenerateSteamingPoem}>
                {/* 关键字输入区域 */}
                <div className="mb-6">
                  <div className="flex flex-col-reverse relative">
                    <input
                      autoComplete="off"
                      placeholder="请输入创作主题或关键词"
                      className={`${INPUT_CLASSNAME} relative placeholder:duration-500 placeholder:absolute placeholder:top-4 focus:placeholder:pt-10`}
                      name="keyword"
                      value={configForm.keyword}
                      onChange={(e) => setForm('keyword', e.target.value)}
                      type="text"
                    />
                    <svg
                      className="size-8 absolute top-12 right-3 text-gray-500"
                      viewBox="0 0 1024 1024"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M395.822 157.662c-19.584 45.182-53.782 115.567-93.897 158.85C257.57 364.37 180.15 406.923 134.864 429.5c45.286 22.576 122.706 65.13 167.061 112.988 40.115 43.283 74.313 113.668 93.897 158.85 19.444-45.31 53.594-115.983 94.275-158.997 47.041-49.74 129.624-90.828 179.437-112.841-49.813-22.013-132.396-63.102-179.437-112.841-40.681-43.015-74.831-113.688-94.275-158.997z m0.095-44.534c12.779 0.029 27.376 6.744 33.793 22.004 18.869 44.87 52.135 114.588 89.449 154.042 42.972 45.437 124.004 85.325 173.135 106.624 15.034 6.518 21.64 20.993 21.64 33.702 0 12.708-6.606 27.184-21.64 33.701-49.131 21.299-130.163 61.187-173.135 106.625-37.314 39.454-70.58 109.171-89.449 154.042-6.417 15.259-21.014 21.974-33.793 22.004-12.781 0.029-27.414-6.621-33.893-21.864-19.014-44.732-52.434-114.406-89.436-154.33-40.943-44.175-117.638-85.82-161.973-107.545-26.74-13.103-26.74-52.164 0-65.267 44.335-21.725 121.03-63.369 161.973-107.545 37.002-39.924 70.422-109.598 89.436-154.33 6.479-15.243 21.113-21.893 33.893-21.863z"
                        fill="#bfbfbf"
                      ></path>
                      <path
                        d="M301.925 316.512c40.115-43.283 74.313-113.668 93.897-158.85 19.444 45.309 53.594 115.982 94.275 158.997 47.041 49.739 129.624 90.828 179.437 112.841-49.813 22.013-132.396 63.101-179.437 112.841-40.681 43.014-74.831 113.687-94.275 158.997-19.584-45.182-53.782-115.567-93.897-158.85C257.57 494.63 180.15 452.076 134.864 429.5c45.286-22.577 122.706-65.13 167.061-112.988z"
                        fill="#bfbfbf"
                      ></path>
                      <path
                        d="M723.027 640.566c-8.711 19.708-22.985 48.21-39.583 66.097-11.346 12.226-27.396 23.452-42.322 32.484-10.01 6.057-19.797 11.295-27.825 15.353 8.028 4.057 17.815 9.295 27.825 15.352 14.926 9.032 30.976 20.258 42.322 32.484 16.598 17.887 30.872 46.389 39.583 66.098 8.66-19.776 22.932-48.391 39.768-66.171 12.086-12.764 29.273-24.007 45.356-32.915 10.634-5.89 21.092-10.924 29.819-14.848-8.727-3.924-19.185-8.959-29.819-14.848-16.083-8.909-33.27-20.152-45.356-32.915-16.836-17.781-31.108-46.396-39.768-66.171z m-13.24-19.987c4.809-11.81 21.814-11.748 26.562 0.061 7.289 18.125 23.039 53.41 40.969 72.345 9.969 10.529 25.031 20.59 40.524 29.171 15.343 8.498 30.423 15.174 39.907 19.106 11.664 4.835 11.664 21.64 0 26.475-9.484 3.932-24.564 10.608-39.907 19.106-15.493 8.581-30.555 18.643-40.524 29.171-17.93 18.935-33.68 54.22-40.969 72.346-4.748 11.808-21.753 11.87-26.562 0.061-7.356-18.061-23.215-53.31-41.003-72.48-9.442-10.175-23.605-20.258-38.016-28.978-14.275-8.638-28.176-15.575-36.64-19.58-10.801-5.111-10.801-20.656 0-25.767 8.464-4.005 22.365-10.942 36.64-19.58 14.411-8.72 28.574-18.802 38.016-28.977 17.788-19.17 33.647-54.419 41.003-72.48z"
                        className="selected"
                        fill="#8a8a8a"
                      ></path>
                      <path
                        d="M683.444 706.663c16.598-17.887 30.872-46.389 39.583-66.097 8.66 19.775 22.932 48.39 39.768 66.171 12.086 12.763 29.273 24.006 45.356 32.915 10.634 5.889 21.092 10.924 29.819 14.848-8.727 3.924-19.185 8.958-29.819 14.848-16.083 8.908-33.27 20.151-45.356 32.915-16.836 17.78-31.108 46.395-39.768 66.171-8.711-19.709-22.985-48.211-39.583-66.098-11.346-12.226-27.396-23.452-42.322-32.484-10.01-6.057-19.797-11.295-27.825-15.352 8.028-4.058 17.815-9.296 27.825-15.353 14.926-9.032 30.976-20.258 42.322-32.484z"
                        className="selected"
                        fill="#8a8a8a"
                      ></path>
                    </svg>
                    <span className="pl-5 mb-2 text-lg duration-500 opacity-0 peer-focus:opacity-100 -translate-y-5 peer-focus:translate-y-0">
                      请输入创作主题或关键词，例如：春天、思乡、友情....
                    </span>
                  </div>
                </div>

                {/* 配置项区域 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* 署名与赠予 */}
                  <div>
                    <label className="block mb-2 font-medium" htmlFor="author">
                      署名与赠予
                    </label>
                    <div className="flex items-center space-x-4">
                      <div className="relative flex-auto">
                        <input
                          id="author"
                          autoComplete="off"
                          placeholder="署名"
                          className={INPUT_CLASSNAME}
                          type="text"
                          name="author"
                          value={configForm.author}
                          onChange={(e) => setForm('author', e.target.value)}
                        />
                        <svg
                          className="size-5 absolute top-3.5 right-3 text-gray-500"
                          viewBox="0 0 1024 1024"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M979.2 238.08C999.68 160 1015.04 80.64 1024 0 864 17.92 705.28 51.2 550.4 98.56L536.32 217.6l-103.68-74.24C-32 344.32 62.72 655.36 94.72 733.44c158.72-290.56 421.12-510.72 734.72-614.4C477.44 316.16 189.44 613.12 3.84 971.52v12.8H0l5.12 3.84c0 3.84 1.28 6.4 3.84 7.68h5.12c32 16.64 154.88 47.36 364.8 10.24 65.28-12.8 160 12.8 267.52 7.68 57.6-3.84 203.52-24.32 296.96-37.12C832 960 743.68 986.88 640 960c-79.36-33.28-491.52 0-590.08 11.52 67.84-48.64 189.44-163.84 189.44-163.84 248.32 38.4 494.08-80.64 618.24-299.52l-171.52-57.6L902.4 422.4c14.08-24.32 23.04-53.76 35.84-81.92-44.8-24.32-162.56-85.76-166.4-94.72 0 5.12 143.36-3.84 207.36-7.68z m0 0"
                            fill="#9f9f9f"
                          ></path>
                        </svg>
                      </div>
                      <div className="relative flex-auto">
                        <input
                          id="recipient"
                          autoComplete="off"
                          placeholder="赠予"
                          className={INPUT_CLASSNAME}
                          type="text"
                          name="recipient"
                          value={configForm.recipient}
                          onChange={(e) => setForm('recipient', e.target.value)}
                        />
                        <svg
                          className="size-6 absolute top-3.5 right-3 text-gray-500"
                          viewBox="0 0 1445 1024"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M1445.377991 144.787992a300.866287 300.866287 0 0 0-32.184908-7.580883c-38.852025-4.873425-65.588174 15.094079-87.112467 44.368471s-31.135769 63.523737-39.088927 98.145358c-15.94016 69.717047-29.985099 139.874057-57.05968 206.6129-43.082428 106.301576-111.107314 194.429339-196.866051 269.189027-136.997383 119.466591-296.940473 199.675039-464.092171 266.786158a18.173813 18.173813 0 0 1-10.59293 0.947611c54.792184-41.593326 108.298326-84.100419 157.506378-137.335815-122.241736 13.84188-236.598-1.861377-345.437818-51.204803l0.406119-5.516446c10.965206 0 21.964254 0.338432 32.92946 0 142.818418-5.008798 275.686927-42.676309 394.747399-123.257032 43.454703-29.409764 80.377664-65.723547 99.73599-116.319171 8.020845-20.982801 10.69446-42.540936 4.568835-64.640564s-17.293889-30.458904-40.611872-30.222001c-16.921613 0-32.151066 5.313387-46.974399 12.521994-37.22755 18.173813-69.547831 43.725449-100.78513 70.664657-5.990251 5.14417-11.7436 10.59293-17.869224 15.567885-45.079178 36.618372-86.672504 40.070381-137.674247 11.608227-47.71895-26.600776-86.875564-64.302131-127.792025-99.600617-55.570579-47.989696-111.682649-95.200997-179.741378-125.21994-56.31513-24.671712-114.660853-36.618372-176.255526-27.751446a60.917808 60.917808 0 0 1-8.257747 0c-1.455259-6.565586 3.688912-6.768645 6.768645-8.325434C180.588914 291.396851 292.711525 255.387658 411.975057 243.677901c22.404216-2.233653 44.808432-4.467306 67.280335-6.024094 8.59618-0.609178 12.995799-2.165967 8.866926-11.980503-29.105175-68.90481-60.680906-136.049772-119.635808-185.833159-16.921613-14.281842-36.17841-24.671712-54.995243-35.095426C313.457423 0.615845 315.961822 0.412786 318.127789 0.378943c118.451294-3.384323 231.453829 15.297139 333.288098 80.44535 50.189506 32.083379 93.948798 71.883014 136.455891 113.205594 21.422763 20.813585 42.574779 41.965601 63.726797 63.049932 5.719505 5.719505 11.371324 10.356027 20.305936 10.389871 87.484742 0.473805 168.911546-18.13997 238.527063-74.692002 1.692161-1.387572 3.384323-3.012047 7.953159-7.44551-56.416659 8.765396-107.587618 4.636522-154.90045-23.28414 3.012047-8.156218 9.171514-6.193311 13.537291-7.208608 63.456051-14.68796 122.410952-42.47325 183.768722-63.151461 49.81723-16.921613 100.040579-32.184909 153.377505-30.458904 51.441705 1.726005 93.914955 21.727352 123.629308 65.215898 3.350479 5.042641 7.953158 9.713006 7.580882 18.343029z m-149.891652-29.206705A121.632558 121.632558 0 0 0 1218.966803 121.842284c-8.934612 3.824285-2.470556 7.479353 1.895221 10.152968 21.18586 13.537291 45.214551 8.359277 74.624315-16.413965z"
                            fill="#9f9f9f"
                          ></path>
                          <path
                            d="M389.841586 174.671561c-56.890464-18.275343-108.298326 2.572085-160.823014 13.537291-33.843227 7.039391-64.911309-1.556788-94.38876-17.124673C84.609523 144.584933 44.20071 106.037497 5.145626 66.00096c-4.771895-4.907268-9.713006-10.356027 2.538242-11.64207 102.646507-10.795989 203.837756-10.795989 297.820397 41.051834a269.256714 269.256714 0 0 1 73.10137 59.428706c4.19656 4.805738 9.374574 9.374574 11.235951 19.832131zM372.818443 1023.527379a345.67472 345.67472 0 0 1-62.30538-3.688911c-4.39962-0.575335-10.152968 0.304589-12.082032-4.331933-2.436712-5.44876 3.384323-7.54704 6.531742-10.322185 23.690259-21.016644 47.61742-41.390267 76.45185-55.198303 23.38567-11.202108 47.109772-13.84188 72.119917-5.787192s50.291035 17.158516 77.602519 11.777443c1.827534-0.372275 5.2457 0.439962 5.787192 1.658318 1.726005 3.824285-1.793691 6.057938-3.993501 8.426964a176.289369 176.289369 0 0 1-79.937702 48.565031 232.536812 232.536812 0 0 1-80.174605 8.900768z"
                            fill="#9f9f9f"
                          ></path>
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* 诗歌类型 */}
                  <div>
                    <label className="block mb-2 font-medium">诗歌类型</label>
                    <RadioButton
                      keyName="poemType"
                      value={configForm.poemType}
                      onChange={(value) => setForm('poemType', value)}
                    >
                      {Object.entries(poemTypesMap).map(([value, label]) => (
                        <RadioButtonOption label={label} value={value} key={value} />
                      ))}
                    </RadioButton>
                  </div>

                  {/* 诗歌格式 */}
                  <div className="col-span-2">
                    <label className="block mb-2 font-medium">诗歌格式</label>
                    <RadioButton
                      keyName="poemFormat"
                      value={configForm.poemFormat}
                      onChange={(value) => setForm('poemFormat', value)}
                    >
                      {Object.entries(poemFormatsMap).map(([value, label]) => (
                        <RadioButtonOption label={label} value={value} key={value} />
                      ))}
                    </RadioButton>
                  </div>
                </div>

                {/* 创作按钮 */}
                <div className="text-center mt-8">
                  <SubmitButton />
                </div>
              </form>
              {/* 诗歌展示区域 */}
              <MessageContext.Provider value={messageApi}>
                {showPoster && (
                  <PoemPoster
                    poem={generatedPoem}
                    recipient={configForm.recipient}
                    author={configForm.author}
                    keyword={configForm.keyword}
                  />
                )}
              </MessageContext.Provider>
            </div>
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
}
