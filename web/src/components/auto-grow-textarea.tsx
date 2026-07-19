"use client";

import { useCallback, useEffect, useRef, type TextareaHTMLAttributes } from "react";

type AutoGrowTextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  maxHeight?: number;
};

export function AutoGrowTextarea({ maxHeight = 420, onInput, style, ...props }: AutoGrowTextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const resize = useCallback(() => {
    const textarea = ref.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    const nextHeight = Math.min(textarea.scrollHeight, maxHeight);
    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? "auto" : "hidden";
  }, [maxHeight]);

  useEffect(() => {
    resize();
  }, [props.defaultValue, props.value, resize]);

  return (
    <textarea
      ref={ref}
      onInput={(event) => {
        resize();
        onInput?.(event);
      }}
      style={{ maxHeight, ...style }}
      {...props}
    />
  );
}
