import { useEffect, useState } from 'react';

export function Popup() {
  const [timer, setTimer] = useState<number>(0);
  const [startTime, setStartTime] = useState<number>(0);
  const [accumulatedTime, setAccumulatedTime] = useState<number>(0);
  const [isFocused, setIsFocused] = useState<boolean>(false);

  useEffect(() => {
    let intervalFocused: number | undefined;

    if (isFocused) {
      intervalFocused = setInterval(() => {
        const elapsed = (Date.now() - startTime) + accumulatedTime;
        setTimer(elapsed);
      }, 100);
    }

    return () => {
      if (intervalFocused) clearInterval(intervalFocused);
    }
  }, [isFocused])

  const handleFocus = () => {
    const _isFocused = !isFocused;

    toggleFocusInternal(_isFocused);
    changeButtonColor(_isFocused);

    // Подключение таймера
    if (_isFocused && startTime === 0) {
      setStartTime(Date.now());
    }
    else if (!_isFocused) {
      const currentTimer = timer;
      setAccumulatedTime(currentTimer);
      setStartTime(0);
    }
  }

  const resetSession = () => {
    setTimer(0);
    setStartTime(0);
    setAccumulatedTime(0);
    toggleFocusInternal(false);
    changeButtonColor(false);
  }

  // Цвет кнопки запуска
  const changeButtonColor = (_isFocused: boolean) => {
    const button = document.getElementById('powerOn');
    if (button)
      button.style.backgroundColor = _isFocused ? '#ffff' : '#dc143c';
  }

  // Внутреннее использование
  const toggleFocusInternal = (_isFocused: boolean) => {
    setIsFocused(_isFocused);
    chrome.storage.local.set({ focus: _isFocused });
  }

  const hours = (Math.floor(timer / (60 * 60 * 1000))).toString().padStart(2, '0');
  const minutes = (Math.floor(timer / (60 * 1000)) % 60).toString().padStart(2, '0');
  const seconds = (Math.floor(timer / 1000) % 60).toString().padStart(2, '0');

  return (
    <div className='container'>
      <h1>Focus Watch</h1>
      <p>Время сессии: {hours}:{minutes}:{seconds}</p>
      <button id='powerOn' className='powerOn' onClick={handleFocus}>
        <img src="/power.svg" width={1742 / 25} height={1920 / 25} />
      </button>
      <button onClick={resetSession}>Сбросить сессию</button>
    </div>
  );
}
