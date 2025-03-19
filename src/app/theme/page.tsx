'use client';

import ThemeButton from '@/components/ThemeButton';
import { cn } from '@/utils/cn';

type ColorCategory = {
  name: string;
  colors: {
    name: string;
    variable?: string;
    background?: string;
    text?: string;
  }[];
};

const colorCategories: ColorCategory[] = [
  {
    name: '基础颜色',
    colors: [
      {
        name: '基础文字与背景色',
        background: 'bg-background',
        text: 'text-foreground',
      },
      {
        name: '主要色',
        background: 'bg-primary',
        text: 'text-foreground',
      },
      { name: '次要色', background: 'bg-secondary', text: 'text-foreground' },
    ],
  },
  {
    name: '状态颜色',
    colors: [
      { name: '禁用色', background: 'bg-muted', text: 'text-muted-foreground' },
      { name: '危险色', background: 'bg-destructive', text: 'text-destructive-foreground' },
    ],
  },
  {
    name: '边框与输入',
    colors: [
      { name: '边框色', variable: 'bg-border' },
      { name: '输入框色', variable: 'bg-input' },
      { name: '环形色', variable: 'bg-ring' },
    ],
  },
];

function ColorCard({
  name,
  variable,
  background,
  text,
}: {
  name: string;
  variable?: string;
  background?: string;
  text?: string;
}) {
  return (
    <div className="flex flex-col p-4 rounded-lg shadow-sm">
      {background && text ? (
        <>
          <div className="text-sm font-medium">{name}</div>
          <div className={cn('p-[4px]', 'text-xs', background, text)}>
            {background}/{text}
          </div>
        </>
      ) : (
        <>
          <div className="text-sm font-medium">{name}</div>
          <div className={cn('p-[4px]', 'text-xs', variable)}>{variable}</div>
        </>
      )}
    </div>
  );
}

// TODO 主题色测试页面，后续删除
export default function Page() {
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">主题颜色预览</h1>
        <ThemeButton />
      </div>

      <div className="space-y-8">
        {colorCategories.map((category) => (
          <div key={category.name} className="space-y-4">
            <h2 className="text-xl font-semibold">{category.name}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {category.colors.map((color) => (
                <ColorCard
                  key={color.name}
                  name={color.name}
                  variable={color.variable}
                  background={color.background}
                  text={color.text}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
