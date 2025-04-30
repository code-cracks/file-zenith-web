export interface ConfigFormType {
  poemType: 'normal' | 'acrostic'; // normal: 普通诗, acrostic: 藏头诗
  poemFormat:
    | '5-jueju'
    | '5-lushi'
    | '7-jueju'
    | '7-lushi'
    | '4-pailv'
    | '5-pailv'
    | '6-pailv'
    | '7-pailv'; // 诗歌格式
  keyword: string;
  author: string; // 署名
  recipient: string; // 赠予
}

export interface PoemPosterConfigType {
  backgroundType: 'color' | 'image'; // color: 纯色背景, image: 图片背景
  backgroundColor: string;
  backgroundImage: string;
  fontColor: string;
  fontSize: number;
}

// 诗歌类型选项
export const poemTypesMap = {
  normal: '普通诗',
  acrostic: '藏头诗',
};

// 诗歌格式选项
export const poemFormatsMap = {
  '5-jueju': '五言绝句',
  '5-lushi': '五言律诗',
  '7-jueju': '七言绝句',
  '7-lushi': '七言律诗',
  '4-pailv': '四言排律',
  '5-pailv': '五言排律',
  '6-pailv': '六言排律',
  '7-pailv': '七言排律',
};

export const poemBackgroundTypesMap = {
  color: '纯色背景',
  image: '图片背景',
};

// 输入框样式
export const INPUT_CLASSNAME =
  'w-full peer outline-none border-2 duration-500 shadow-lg border-gray-300 px-5 py-3 pr-10 rounded-xl border-black focus:border-dashed focus:rounded-md';
