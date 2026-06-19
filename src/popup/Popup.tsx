import { useEffect, useState } from 'react';

export function Popup() {
  const [timer, setTimer] = useState<number>(0);
  const [disableAutoplayEnabled, setAutoplayEnabled] = useState<boolean>();
  const [hideRecsEnabled, setHideRecsEnabled] = useState<boolean>();
  const [darkTheme, setTheme] = useState<boolean>();

  useEffect(() => {
    if (darkTheme) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }, [darkTheme])

  useEffect(() => {
    let intervalFocused = setInterval(() => {
      loadState();
    }, 100);
    return () => clearInterval(intervalFocused);
  }, []);

  // Загрузка состояния из backgrounds
  const loadState = async () => {
    const response = await chrome.runtime.sendMessage({ type: 'GET_STATE' });
    setTimer(response.timer);
    changeButtonColor(response.focusEnabled);
    setAutoplayEnabled(response.disableAutoplayEnabled);
    setHideRecsEnabled(response.hideRecsEnabled);
    setTheme(response.darkTheme);
  };

  // Обработка нажатия на кнопку фокуса
  const toggleFocus = () => chrome.runtime.sendMessage({ type: 'TOGGLE_FOCUS' });

  // Сброс сессии
  const resetSession = () => chrome.runtime.sendMessage({ type: 'RESET' });

  // Обработка нажатия на кнопку блокировки автовоспроизведения
  const toggleAutoplay = () => chrome.runtime.sendMessage({ type: 'TOGGLE_AUTOPLAY' });

  // Обработка нажатия на кнопку скрытия рекомендаций
  const toggleRecs = () => chrome.runtime.sendMessage({ type: 'TOGGLE_RECS' });

  // Цвет кнопки запуска
  const changeButtonColor = (isFocused: boolean) => {
    const button = document.getElementById('powerOn');
    if (button) {
      const style = getComputedStyle(document.body);
      const bColor = style.getPropertyValue('--b-color').trim();
      const bColorSelected = style.getPropertyValue('--b-color-selected').trim();
      button.style.backgroundColor = isFocused ? bColorSelected : bColor;
    }
  }

  const switchTheme = () => chrome.runtime.sendMessage({ type: 'TOGGLE_THEME' });

  // Время работы
  const hours = (Math.floor(timer / (60 * 60 * 1000))).toString().padStart(2, '0');
  const minutes = (Math.floor(timer / (60 * 1000)) % 60).toString().padStart(2, '0');
  const seconds = (Math.floor(timer / 1000) % 60).toString().padStart(2, '0');

  return (
    <div className='container'>
      <div className='title'>
        <h1>Focus Watch</h1>

        <button className='theme' onClick={switchTheme}>
          {darkTheme ? '☀︎' : '☾'}
        </button>
      </div>

      <p>Время сессии: {hours}:{minutes}:{seconds}</p>

      <button
        id='powerOn' className='powerOn' onClick={toggleFocus}
      >
        ⏻
      </button>

      <button className='reset' onClick={resetSession}>Сбросить сессию</button>

      <label>
        <input type="checkbox" id="blockAuto" onChange={toggleAutoplay} checked={disableAutoplayEnabled} />
        Блокировать автоплей
      </label>

      <label>
        <input type="checkbox" id="toggleRecs" onChange={toggleRecs} checked={hideRecsEnabled} />
        Скрыть рекомендации и комментарии
      </label>
    </div>
  );
}
