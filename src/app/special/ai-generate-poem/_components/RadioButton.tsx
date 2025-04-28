import React, { type ReactElement } from 'react';

interface RadioButtonProps {
  value: string;
  keyName: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}

interface RadioButtonOptionProps {
  label: string;
  value: string;
  currentValue?: string;
  keyName?: string;
  onChange?: (value: string) => void;
}

export function RadioButton({ value, keyName, onChange, children }: RadioButtonProps) {
  if (!children) {
    throw new Error('RadioButton requires children');
  }

  const arrayChildren = React.Children.toArray(children);

  const targetIndex = arrayChildren.findIndex(
    (child) => React.isValidElement(child) && child.props.value === value,
  );
  const fr = 100 / arrayChildren.length;

  return (
    <div className="relative flex space-x-2 border-[2px] border-neutral-300 dark:border-white/70 rounded-xl select-none">
      {React.Children.map(children, (child) =>
        React.cloneElement(child as ReactElement, { currentValue: value, keyName, onChange }),
      )}
      <span
        className={`absolute inset-y-[4px] transition-[left] ease-[cubic-bezier(0.25,0.05,0.795,0.035)] backdrop-blur-sm rounded-lg bg-black/35 dark:bg-white/70 duration-200 z-[-1]`}
        style={{
          width: `calc(${fr}% - 8px)`,
          left: `calc(${targetIndex * fr}% + 4px)`,
        }}
      ></span>
    </div>
  );
}

export function RadioButtonOption({
  value,
  label,
  keyName,
  currentValue,
  onChange,
}: RadioButtonOptionProps) {
  return (
    <label className="radio m-0 flex flex-grow items-center justify-center rounded-lg p-1 cursor-pointer">
      <input
        type="radio"
        className="peer hidden"
        name={keyName}
        value={value}
        checked={currentValue === value}
        onChange={() => onChange!(value)}
      />
      <span className="tracking-widest peer-checked:text-white dark:peer-checked:text-black p-2 transition-colors ease-[cubic-bezier(0.25,0.05,0.795,0.035)] delay-50">
        {label}
      </span>
    </label>
  );
}
