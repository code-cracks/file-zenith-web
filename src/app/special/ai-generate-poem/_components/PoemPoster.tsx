import { useRef, useState, useEffect } from 'react';
import { ColorPicker, InputNumber, Upload, type UploadProps, type UploadFile } from 'antd';
import type { RcFile } from 'antd/es/upload';
import ImgCrop from 'antd-img-crop';
import { CopyOutlined, DownloadOutlined, CloseCircleFilled } from '@ant-design/icons';
import html2canvas from 'html2canvas-pro';
import { MessageInstance } from 'antd/es/message/interface';

import { RadioButton, RadioButtonOption } from './RadioButton';

import {
  poemBackgroundTypesMap,
  type PoemPosterConfigType,
} from '@/app/constant/special/ai-generate-poem';

interface PoemPosterProps {
  poem: string;
  author?: string;
  recipient?: string;
  keyword?: string;
  messageApi: MessageInstance;
}

export default function PoemPoster({
  poem,
  author,
  recipient,
  keyword,
  messageApi,
}: PoemPosterProps) {
  const posterRef = useRef<HTMLDivElement>(null);
  const posterBoardRef = useRef<HTMLDivElement>(null);
  const uploadedBackgroundImage = useRef(new Map());
  const [poemContent, setPoemContent] = useState(poem);
  const [selectedImageId, setSelectedImageId] = useState('');
  const [backgroundImageList, setBackgroundImageList] = useState<UploadFile[]>([]);

  useEffect(() => {
    setPoemContent(poem);
  }, [poem]);

  const [posterConfig, setPosterConfig] = useState<PoemPosterConfigType>({
    fontColor: '#333333',
    fontSize: 24,
    backgroundType: 'color',
    backgroundColor: '#f0f8ff', // 默认淡蓝色
    backgroundImage: '',
  });

  const setPosterConfigForm: (
    key: keyof PoemPosterConfigType,
    value: (typeof posterConfig)[keyof typeof posterConfig],
  ) => void = (key, value) => {
    setPosterConfig((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // 文件上传前检查
  const beforeUploadChecked = (file: RcFile) => {
    const isJpgOrPng = /image\/*/.test(file.type);
    const isLt2M = file.size / 1024 / 1024 < 5;

    return isJpgOrPng && isLt2M;
  };

  const beforeUploadBackgroundImage: UploadProps['beforeUpload'] = (file) => {
    const succeed = beforeUploadChecked(file);

    if (!succeed) {
      messageApi!.error('只能上传图片格式的文件且大小不能超过 5MB！');
    }

    return succeed || Upload.LIST_IGNORE;
  };

  // 处理背景图片的上传
  const handleBackgroundUpload: UploadProps['onChange'] = (info) => {
    setBackgroundImageList(info.fileList);

    if (info.file.status === 'done') {
      const reader = new FileReader();

      reader.onload = (e) => {
        const result = e.target!.result as string;
        uploadedBackgroundImage.current.set(info.file.uid, result);
        selectPosterBackgroundImage(info.file.uid); // 选择当前上传的图片
      };

      reader.readAsDataURL(info.file.originFileObj as Blob);
      messageApi!.success(`${info.file.name} 上传成功`);
    } else if (info.file.status === 'error') {
      messageApi!.error(`${info.file.name} 上传失败`);
    }
  };

  // 选择背景图片
  const selectPosterBackgroundImage = (fileId: string) => {
    setSelectedImageId(fileId);

    const result = uploadedBackgroundImage.current.get(fileId);

    if (result) {
      setPosterConfigForm('backgroundImage', result);
    }
  };

  // 删除已上传的图片
  const deleteUploadedImage = (fileId: string) => {
    setBackgroundImageList((prevList) => prevList.filter((file) => file.uid !== fileId));
    uploadedBackgroundImage.current.delete(fileId);

    const backupImage = backgroundImageList[0]?.uid || '';
    setSelectedImageId(backupImage); // 选择第一个图片
    setPosterConfigForm(
      'backgroundImage',
      backupImage ? uploadedBackgroundImage.current.get(backupImage) : '',
    );
  };

  // 下载海报
  const downloadPoster = () => {
    if (!posterRef.current) return;

    html2canvas(posterRef.current, {
      scale: 2,
    }).then((canvas) => {
      const link = document.createElement('a');
      link.download = `${keyword}诗歌.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    });
  };

  // 复制诗歌
  const copyPoem = () => {
    if (!posterBoardRef.current) return;

    const textContent = posterBoardRef.current.textContent?.trim();

    if (textContent) {
      navigator.clipboard.writeText(textContent).then(() => {
        messageApi!.success('✨诗词已复制到剪贴板');
      });
    }
  };

  return (
    <div className="mt-10">
      <h2 className="text-xl font-bold mb-4 text-center dark:text-white">创作结果</h2>

      {/* 字体设置 */}
      <div className="flex">
        <div className="md:col-span-2 flex-auto">
          <label className="block mb-2 font-medium">字体设置</label>
          <div className="flex items-center space-x-4">
            <div>
              <span className="text-gray-600 dark:text-gray-400 mr-2">颜色</span>
              <ColorPicker
                value={posterConfig.fontColor}
                onChange={(color) => setPosterConfigForm('fontColor', color.toHexString())}
              />
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400 mr-2">字号</span>
              <InputNumber
                min={12}
                max={72}
                value={posterConfig.fontSize}
                onChange={(value) => setPosterConfigForm('fontSize', value as number)}
              />
            </div>
          </div>
        </div>

        {/* 背景设置 */}
        <div className="md:col-span-2 flex-auto">
          <label className="block mb-2 font-medium">背景设置</label>
          <div className="flex flex-col space-y-4">
            <RadioButton
              keyName="poemType"
              value={posterConfig.backgroundType}
              onChange={(value) => setPosterConfigForm('backgroundType', value)}
            >
              {Object.entries(poemBackgroundTypesMap).map(([value, label]) => (
                <RadioButtonOption label={label} value={value} key={value} />
              ))}
            </RadioButton>

            {posterConfig.backgroundType === 'color' ? (
              <div className="flex items-center">
                <ColorPicker
                  value={posterConfig.backgroundColor}
                  onChange={(color) => setPosterConfigForm('backgroundColor', color.toHexString())}
                />
              </div>
            ) : (
              <ImgCrop
                rotationSlider
                showReset
                beforeCrop={beforeUploadChecked}
                modalOk="确定"
                modalCancel="取消"
              >
                <Upload
                  accept="image/*"
                  name="backgroundImage"
                  listType="picture-card"
                  fileList={backgroundImageList}
                  onChange={handleBackgroundUpload}
                  beforeUpload={beforeUploadBackgroundImage}
                  itemRender={(_, file) => (
                    <div
                      className={`relative rounded-lg group ${
                        selectedImageId === file.uid
                          ? 'outline-2 outline-sky-500 outline-offset-2'
                          : ''
                      }`}
                    >
                      <CloseCircleFilled
                        className="absolute z-1 top-[-8px] right-[-8px] invisible group-hover:visible cursor-pointer"
                        onClick={() => deleteUploadedImage(file.uid)}
                      />
                      <img
                        className="rounded-lg cursor-pointer"
                        src={file.thumbUrl}
                        alt={file.name}
                        onDragStart={(e) => e.preventDefault()} // 禁止拖拽
                        onClick={() => selectPosterBackgroundImage(file.uid)}
                      />
                    </div>
                  )}
                >
                  {backgroundImageList.length < 5 && '+ 上传'}
                </Upload>
              </ImgCrop>
            )}
          </div>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className={`flex justify-center mt-4 transition ${poemContent ? 'visible' : 'hidden'}`}>
        <div className="flex space-x-2 justify-end max-w-2xl w-full">
          {/* 下载 */}
          <button
            className="cursor-pointer border-0 outline-0 py-1 px-3 bg-gray-200 text-stone-800 dark:text-[#f1f1f1] rounded-full hover:shadow-lg transition shadow-md active:scale-90 dark:bg-black/70"
            onClick={downloadPoster}
          >
            <DownloadOutlined />
          </button>
          {/* 复制 */}
          <button
            className="cursor-pointer border-0 outline-0 py-1 px-3 bg-gray-200 text-stone-800 dark:text-[#f1f1f1] rounded-full hover:shadow-lg transition shadow-md active:scale-90 dark:bg-black/70"
            onClick={copyPoem}
          >
            <CopyOutlined />
          </button>
        </div>
      </div>

      {/* 海报预览 */}
      <div className="flex mt-4 justify-center">
        <div
          ref={posterRef}
          className="relative rounded-lg shadow-lg max-w-2xl w-full"
          style={{
            background:
              posterConfig.backgroundType === 'color'
                ? posterConfig.backgroundColor
                : `url(${posterConfig.backgroundImage}) center/cover no-repeat`,
            minHeight: '400px',
          }}
        >
          <div className="text-center font-[隶书] w-full h-full">
            <div
              ref={posterBoardRef}
              className="whitespace-pre-line mb-6"
              style={{
                color: posterConfig.fontColor,
                fontSize: `${posterConfig.fontSize}px`,
                lineHeight: 1.8,
              }}
              dangerouslySetInnerHTML={{ __html: poemContent }}
            ></div>

            <div className="flex justify-between mt-8 mx-8">
              {recipient && <div style={{ color: posterConfig.fontColor }}>赠：{recipient}</div>}
              {author && (
                <div style={{ color: posterConfig.fontColor, marginLeft: 'auto' }}>{author}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
