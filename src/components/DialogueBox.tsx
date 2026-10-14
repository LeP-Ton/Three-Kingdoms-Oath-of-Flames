/**
 * 三国志·烈火之誓 - GBA 风格剧情对话框组件
 * 支持头像立绘、说话方左右站位、打字机逐字输出与音效
 */

import React, { useState, useEffect, useCallback } from 'react';
import { DialogueLine } from '../types';
import { getPortraitDataUrl } from '../graphics/pixelAssets';
import { audio } from '../audio/retroAudio';

interface DialogueBoxProps {
  dialogue: DialogueLine[];
  onComplete: () => void;
}

export const DialogueBox: React.FC<DialogueBoxProps> = ({ dialogue, onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  const currentLine = dialogue[currentIndex];

  // 打字机效果定时器
  useEffect(() => {
    if (!currentLine) {
      onComplete();
      return;
    }

    setDisplayedText('');
    setIsTyping(true);

    let charIdx = 0;
    const fullText = currentLine.text;

    const timer = setInterval(() => {
      if (charIdx < fullText.length) {
        setDisplayedText(fullText.slice(0, charIdx + 1));
        if (charIdx % 2 === 0) {
          audio.playTypewriter();
        }
        charIdx++;
      } else {
        setIsTyping(false);
        clearInterval(timer);
      }
    }, 28);

    return () => clearInterval(timer);
  }, [currentIndex, currentLine, onComplete]);

  // 点击或按键前进
  const handleAdvance = useCallback(() => {
    if (!currentLine) return;

    if (isTyping) {
      // 快速跳过当前打字机动画，显示全文本
      setDisplayedText(currentLine.text);
      setIsTyping(false);
    } else {
      audio.playMenuConfirm();
      if (currentIndex + 1 < dialogue.length) {
        setCurrentIndex(currentIndex + 1);
      } else {
        onComplete();
      }
    }
  }, [isTyping, currentLine, currentIndex, dialogue.length, onComplete]);

  // 监听键盘空格/回车/Z按键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'z' || e.key === 'Z') {
        e.preventDefault();
        handleAdvance();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleAdvance]);

  if (!currentLine) return null;

  const portraitUrl = getPortraitDataUrl(
    currentLine.portraitId,
    currentLine.expression || 'normal',
    currentLine.speaker.startsWith('e_') ? 'enemy' : 'player' as any
  );

  const isLeft = currentLine.side !== 'right';

  return (
    <div
      id="dialogue-overlay"
      className="absolute inset-0 z-40 flex flex-col justify-end p-2 sm:p-4 bg-black/55 backdrop-blur-[2px] cursor-pointer select-none"
      onClick={handleAdvance}
    >
      {/* 角色上半身立绘展示 (GBA 侧身站位) */}
      <div className={`flex w-full max-w-4xl mx-auto items-end ${isLeft ? 'justify-start' : 'justify-end'} px-3 sm:px-6 mb-[-10px] z-10`}>
        <div className="relative">
          <img
            src={portraitUrl}
            alt={currentLine.speakerName}
            className="w-20 h-20 sm:w-28 sm:h-28 object-cover pixelated border-2 border-amber-400 shadow-2xl rounded-sm bg-stone-900"
            style={{ imageRendering: 'pixelated' }}
          />
          {/* 姓名条 (汉代官印/姓名木简风格) */}
          <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-red-950 via-amber-950 to-red-950 text-amber-200 border border-amber-400/90 px-2.5 py-0.5 rounded text-[11px] sm:text-xs font-bold whitespace-nowrap shadow-lg pixel-font">
            {currentLine.speakerName}
          </div>
        </div>
      </div>

      {/* 对话文本主窗 (汉风黑漆描金框) */}
      <div className="w-full max-w-4xl mx-auto gba-window p-3 sm:p-5 rounded-md min-h-[96px] sm:min-h-[110px] flex flex-col justify-between text-stone-100 shadow-2xl relative">
        <p className="text-sm sm:text-base md:text-lg leading-relaxed tracking-wide font-medium">
          {displayedText}
        </p>

        {/* 翻页光标闪烁三角 */}
        <div className="flex justify-between items-center text-xs text-amber-300/80 pt-1.5 border-t border-amber-500/20">
          <span className="text-[10px] sm:text-[11px] text-stone-400">轻触屏幕或按 [空格/Z] 推进剧情</span>
          {!isTyping && (
            <span className="animate-bounce text-amber-400 font-bold">▼</span>
          )}
        </div>
      </div>
    </div>
  );
};
