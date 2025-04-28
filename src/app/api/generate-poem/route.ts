import { NextResponse } from 'next/server';

import {
  poemTypesMap,
  poemFormatsMap,
  type ConfigFormType,
} from '@/app/constant/special/ai-generate-poem';

// https://siliconflow.cn/zh-cn/
const AI_API_URL = 'https://api.siliconflow.cn/v1/chat/completions';
const AI_MODEL = 'deepseek-ai/DeepSeek-R1-Distill-Qwen-7B';
const AI_API_SECRET_KEY = 'sk-vmcoqukzaflfigbhkbqldsttqcytzxhcagutwshpmkupubmj';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const data = requestUrl.searchParams;
  const poemType = data.get('poemType') as ConfigFormType['poemType'];
  const poemFormat = data.get('poemFormat') as ConfigFormType['poemFormat'];
  const SYSTEM_ROLE = `你是一名古韵丰富的中文诗人，饱览中国各朝代诗人的风格，非常擅长创作古诗词，你能根据用户的提示以及各种要求生成一首古诗词。
  注意事项:
      1.生成的诗词应该契合用户提出的韵律和格律以及意境；
      2.生成对应的诗词标题；
      3.诗词中不允许出现任何英文单词或字母；
      4.仅输出诗词即可，不要输出任何其他内容（包括诗词头尾的换行符）；
      ${poemTypesMap[poemType] === poemTypesMap.acrostic ? '5.应当使用“<span style="color: #ff0000"><span>”来包裹每一句诗词里开头的一个字' : ''}”`;

  const userRole = `诗词主题为“${data.get('keyword')}”，是一首${poemTypesMap[poemType]}，格式为${poemFormatsMap[poemFormat]}。`;

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${AI_API_SECRET_KEY}`, // 密钥存环境变量
    },
    body: JSON.stringify({
      model: AI_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_ROLE },
        { role: 'user', content: userRole },
      ],
      response_format: { type: 'text' },
      temperature: 0.5,
      stream: true,
    }),
  };

  try {
    const aiResponse = await fetch(AI_API_URL, options);

    // 创建可读流转发器
    const stream = aiResponse.body;

    // 返回流式响应给客户端
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream', // 设置流式响应头
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error generate poem:', error);

    return NextResponse.json(
      {
        error: 'Failed to generate poem',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
