'use client';

import { FC, useState } from 'react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';

interface ExportImageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: (format: string) => void;
}

const imageFormats = [
  { value: 'png', label: 'PNG (高质量)' },
  { value: 'jpeg', label: 'JPEG (小体积)' },
  { value: 'webp', label: 'WebP (现代格式)' },
];

const ExportImageDialog: FC<ExportImageDialogProps> = ({ open, onOpenChange, onExport }) => {
  const [selectedFormat, setSelectedFormat] = useState('png');

  const handleExport = () => {
    onExport(selectedFormat);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>导出图片</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Select value={selectedFormat} onValueChange={setSelectedFormat}>
            <SelectTrigger>
              <SelectValue placeholder="选择导出格式" />
            </SelectTrigger>
            <SelectContent>
              {imageFormats.map((format) => (
                <SelectItem key={format.value} value={format.value}>
                  {format.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleExport}>导出</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExportImageDialog;
