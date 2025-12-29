
import React, { useState, useRef, useEffect } from 'react';
import { Camera as CameraIcon, History, User, ChevronLeft, Volume2, ShieldAlert, CheckCircle, Menu, X, Square } from 'lucide-react';
import { MedicationInfo, AppLanguage, HistoryItem } from './types';
import { identifyMedication } from './services/geminiService';
import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { App as CapApp } from '@capacitor/app';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

const App: React.FC = () => {
  const [view, setView] = useState<'home' | 'result' | 'history'>('home');
  const [showMenu, setShowMenu] = useState(false);
  const [lang, setLang] = useState<AppLanguage | null>(null);
  const [loading, setLoading] = useState(false);
  const [scannedImage, setScannedImage] = useState<string | null>(null);
  const [medInfo, setMedInfo] = useState<MedicationInfo | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [supportedLangs, setSupportedLangs] = useState<string[]>([]);
  
  const speechSessionRef = useRef(0);

  // 監聽 Android 實體返回鍵
  useEffect(() => {
    const handleBackButton = async () => {
      if (showMenu) {
        setShowMenu(false);
      } else if (view === 'result' || view === 'history') {
        await stopAllSpeech();
        setView('home');
      } else {
        // 在首頁按返回鍵則退出 App
        CapApp.exitApp();
      }
    };
    const backListener = CapApp.addListener('backButton', handleBackButton);
    return () => {
      backListener.then(l => l.remove());
    };
  }, [view, showMenu]);

  useEffect(() => {
    const savedHistory = localStorage.getItem('pill_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
    return () => { 
      stopAllSpeech(); 
    };
  }, []);
  
  useEffect(() => {
    (async () => {
      try {
        const res = await TextToSpeech.getSupportedLanguages();
        if (res && Array.isArray(res.languages)) setSupportedLangs(res.languages);
      } catch {}
    })();
  }, []);
  
  useEffect(() => {
    (async () => {
      try {
        const r = await TextToSpeech.isLanguageSupported({ lang: 'yue-HK' });
        if (!r?.supported) console.warn('Cantonese TTS not installed, will fallback.');
      } catch {}
    })();
    const detectSystemLanguage = () => {
      try {
        const systemLang = (navigator.languages && navigator.languages.length) ? navigator.languages[0] : navigator.language;
        const lower = (systemLang || '').toLowerCase();
        if (lower.startsWith('zh')) {
          if (lower.includes('hk') || lower.includes('tw') || lower.includes('yue') || lower.includes('hant')) {
            setLang('zh-TW');
          } else {
            setLang('zh-CN');
          }
        } else if (lower.startsWith('en')) {
          setLang('en');
        } else {
          setLang('zh-TW');
        }
      } catch {
        setLang('zh-TW');
      }
    };
    detectSystemLanguage();
  }, []);

  const currentLang = (lang ?? 'zh-TW') as AppLanguage;
  const t = {
    'zh-TW': {
      title: '藥品小幫手',
      scanBtn: '點擊這裡拍照識別',
      scanDesc: '把藥拿起來拍一張，我就會告訴您怎麼吃。',
      history: '辨認紀錄',
      language: '更換語言',
      identifying: '正在辨認中...',
      loadingSub: '請保持穩定，正在讀取藥品資訊...',
      dosage: '服用方法',
      precautions: '注意事項',
      guest: '長輩您好',
      album: '從相簿選',
      cameraError: '無法開啟相機。請確認權限已開啟。',
      noHistory: '目前沒有紀錄',
      readToMe: '朗讀資訊',
      stopReading: '停止朗讀',
      ok: '知道了'
    },
    'zh-CN': {
      title: '药品小助手',
      scanBtn: '点击这里拍照识别',
      scanDesc: '把药拿起来拍一张，我就会告诉您怎么吃。',
      history: '辨认记录',
      language: '更换语言',
      identifying: '正在辨认中...',
      loadingSub: '请保持稳定，正在读取药品信息...',
      dosage: '服用方法',
      precautions: '注意事项',
      guest: '长辈您好',
      album: '从相册选',
      cameraError: '无法开启相机。请确认权限已开启。',
      noHistory: '目前没有记录',
      readToMe: '朗读信息',
      stopReading: '停止朗讀',
      ok: '知道了'
    },
    'en': {
      title: 'Pill Helper',
      scanBtn: 'Tap to Scan',
      scanDesc: 'Take a photo of medicine, I will tell you how to take it.',
      history: 'History',
      language: 'Language',
      identifying: 'Identifying...',
      loadingSub: 'Please hold steady, scanning label...',
      dosage: 'Instruction',
      precautions: 'Precautions',
      guest: 'Hello!',
      album: 'Gallery',
      cameraError: 'Camera Error. Please check permissions.',
      noHistory: 'No history',
      readToMe: 'Read to Me',
      stopReading: 'Stop Reading',
      ok: 'OK'
    }
  }[currentLang];

  const stopAllSpeech = async () => {
    speechSessionRef.current++; 
    setIsSpeaking(false);
    try {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      await TextToSpeech.stop();
      const audioEl = document.getElementById('tts-audio') as HTMLAudioElement | null;
      if (audioEl) { audioEl.pause(); audioEl.src = ''; }
    } catch (e) {
      console.error("Stop speech error", e);
    }
  };

  const handleSpeak = async (e?: React.MouseEvent | React.TouchEvent) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (!medInfo) return;
    if (isSpeaking) { await stopAllSpeech(); return; }

    const mySession = ++speechSessionRef.current;
    const text = `${medInfo.name}。${t.dosage}：${medInfo.dosage}，${medInfo.frequency}。${t.precautions}：${medInfo.precautions}`;

    const pick = (candidates: string[]) => {
      if (!supportedLangs.length) return candidates[0];
      for (const c of candidates) if (supportedLangs.includes(c)) return c;
      return candidates[0];
    };
    let languageCode = '';
    if (currentLang === 'zh-TW') {
      const candidateTags = ['yue-HK', 'yue-Hant-HK', 'zh-HK', 'zh-TW'];
      languageCode = candidateTags[candidateTags.length - 1];
      for (const tag of candidateTags) {
        try {
          const { supported } = await TextToSpeech.isLanguageSupported({ lang: tag });
          if (supported) { languageCode = tag; break; }
        } catch {}
      }
    } else if (currentLang === 'zh-CN') {
      languageCode = pick(['zh-CN', 'cmn-Hans-CN', 'zh']);
    } else {
      languageCode = pick(['en-US', 'en-GB', 'en']);
    }

    setIsSpeaking(true);
    try {
      const key = (process.env.GCP_TTS_API_KEY as any) as string;
      if (currentLang === 'zh-TW' && key) {
        const audioEl = document.getElementById('tts-audio') as HTMLAudioElement | null;
        let played = false;
        const voices: any[] = [
          { languageCode: 'yue-HK', name: 'yue-HK-Standard-A' },
          { languageCode: 'yue-HK', name: 'yue-HK-Wavenet-A' },
          { languageCode: 'yue-HK' }
        ];
        for (const v of voices) {
          const body: any = { input: { text }, voice: v, audioConfig: { audioEncoding: 'MP3' } };
          const res = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
          });
          if (res.ok) {
            const data = await res.json();
            if (data && data.audioContent && audioEl) {
              audioEl.src = `data:audio/mp3;base64,${data.audioContent}`;
              await audioEl.play();
              played = true;
              break;
            }
          }
        }
        if (!played) {
          await TextToSpeech.speak({ text, lang: languageCode, rate: 0.8, pitch: 1.0, volume: 1.0, category: 'ambient' });
        }
      } else {
        await TextToSpeech.speak({ text, lang: languageCode, rate: 0.8, pitch: 1.0, volume: 1.0, category: 'ambient' });
      }
      if (speechSessionRef.current === mySession) setIsSpeaking(false);
    } catch (err) {
      console.error("TTS Speak error", err);
      if (speechSessionRef.current === mySession) setIsSpeaking(false);
    }
  };

  const handleScan = async (source: CameraSource = CameraSource.Camera) => {
    try {
      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: source
      });

      if (photo.dataUrl) {
        processImage(photo.dataUrl);
      }
    } catch (err: any) {
      if (err.message !== 'User cancelled photos app') {
        setError(t.cameraError);
      }
    }
  };

  const processImage = async (base64: string) => {
    setLoading(true);
    setError(null);
    setScannedImage(base64);
    try {
      const info = await identifyMedication(base64, currentLang);
      setMedInfo(info);
      const newItem = { id: Date.now().toString(), image: base64, info, date: new Date().toLocaleString() };
      const updatedHistory = [newItem, ...history];
      setHistory(updatedHistory);
      localStorage.setItem('pill_history', JSON.stringify(updatedHistory));
      setView('result');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const goBack = async () => {
    await stopAllSpeech();
    setView('home');
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] max-w-md mx-auto relative overflow-hidden flex flex-col">
      <audio id="tts-audio" hidden />
      {/* 側邊選單 */}
      <div className={`fixed inset-0 z-[500] transition-all duration-300 ${showMenu ? 'visible opacity-100' : 'invisible opacity-0'}`}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowMenu(false)} />
        <div className={`relative w-[300px] h-full bg-[#FDFBF7] shadow-2xl flex flex-col transition-transform duration-300 ${showMenu ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="bg-[#C5AE89] p-8 safe-top text-white shadow-lg">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-4 border-2 border-white/30"><User size={40} /></div>
            <div className="text-2xl font-black">{t.guest}</div>
          </div>
          <div className="p-6 space-y-4 flex-1 overflow-y-auto">
            <button onClick={() => { setView('history'); setShowMenu(false); }} className="w-full flex items-center gap-4 p-4 text-xl font-black text-gray-700 active:bg-gray-100 rounded-2xl">
              <History size={28} className="text-[#C5AE89]" /> {t.history}
            </button>
            <div className="pt-6 border-t border-gray-100">
              <div className="text-xs text-gray-400 font-black mb-4 uppercase tracking-widest">{t.language}</div>
              {['zh-TW', 'zh-CN', 'en'].map((l) => (
                <button key={l} onClick={() => { setLang(l as any); setShowMenu(false); }} className={`w-full text-left p-4 text-lg font-black rounded-2xl mb-2 transition-all ${currentLang === l ? 'bg-[#C5AE89] text-white shadow-lg' : 'text-gray-600 active:bg-gray-50'}`}>
                  {l === 'zh-TW' ? '繁體中文 (粵語)' : l === 'zh-CN' ? '简体中文 (普通话)' : 'English'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 首頁 */}
      {view === 'home' && (
        <div className="flex-1 flex flex-col">
          <header className="app-header bg-[#C5AE89] p-6 safe-top flex items-center justify-between text-white shadow-md">
            <button onClick={() => setShowMenu(true)} className="p-4 -m-4 active:opacity-50"><Menu size={32} /></button>
            <h1 className="text-2xl font-black">{t.title}</h1>
            <div className="w-8" />
          </header>
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <button onClick={() => handleScan(CameraSource.Camera)} className="relative w-64 h-64 bg-[#C5AE89] rounded-full flex items-center justify-center shadow-2xl active:scale-95 transition-all mb-10">
              <CameraIcon size={100} className="text-white" />
              <div className="absolute inset-0 bg-[#C5AE89] rounded-full animate-ping opacity-10 scale-125 pointer-events-none" />
            </button>
            <h2 className="text-4xl font-black text-gray-900 mb-4">{t.scanBtn}</h2>
            <p className="text-xl text-gray-400 font-bold">{t.scanDesc}</p>
          </div>
          <div className="p-10 safe-bottom">
            <button onClick={() => handleScan(CameraSource.Photos)} className="w-full bg-white border-4 border-[#C5AE89] text-[#C5AE89] text-2xl font-black py-5 rounded-[30px] shadow-lg active:bg-gray-50">
              {t.album}
            </button>
          </div>
        </div>
      )}

      {/* 辨識結果 */}
      {view === 'result' && medInfo && (
        <div className="flex-1 flex flex-col bg-white overflow-y-auto pb-48">
          <header className="app-header bg-[#C5AE89] safe-top flex items-center text-white shadow-md min-h-[100px]">
            <div className="back-button-hitbox" onClick={goBack}><ChevronLeft size={44} strokeWidth={3} /></div>
            <h2 className="text-xl font-black truncate ml-2 pr-4">{medInfo.name}</h2>
          </header>
          <div className="p-4">
            {scannedImage && <img src={scannedImage} className="w-full h-64 object-cover rounded-[30px] shadow-md border border-gray-100" />}
          </div>
          <div className="p-6 space-y-6">
            <h1 className="text-4xl font-black text-gray-900">{medInfo.name}</h1>
            <div className="bg-[#FDFBF7] p-8 rounded-[35px] border-4 border-[#C5AE89]/20 shadow-sm">
              <div className="text-[#C5AE89] font-black text-lg mb-2 flex items-center gap-2 uppercase tracking-widest"><CheckCircle size={24} /> {t.dosage}</div>
              <div className="text-5xl font-black text-gray-900 mb-2">{medInfo.dosage}</div>
              <div className="text-2xl font-bold text-[#8DA461]">{medInfo.frequency}</div>
            </div>
            <div className="bg-red-50 p-8 rounded-[35px] border-2 border-red-100 shadow-sm">
              <div className="text-red-600 font-black text-lg mb-2 flex items-center gap-2 uppercase tracking-widest"><ShieldAlert size={24} /> {t.precautions}</div>
              <p className="text-2xl font-bold text-gray-800">{medInfo.precautions}</p>
            </div>
          </div>
          <div className="fixed bottom-0 left-0 right-0 p-8 safe-bottom z-50 pointer-events-none">
            <button 
              onClick={handleSpeak}
              className={`pointer-events-auto w-full py-7 rounded-[40px] shadow-2xl flex items-center justify-center gap-5 text-2xl font-black transition-all border-b-8 ${
                isSpeaking ? 'bg-[#2C5282] text-white border-[#1A365D] animate-pulse' : 'bg-[#C5AE89] text-white border-[#A68F6B]'
              }`}
            >
              {isSpeaking ? <Square size={36} fill="white" /> : <Volume2 size={36} />}
              <span className="tracking-widest">{isSpeaking ? t.stopReading : t.readToMe}</span>
            </button>
          </div>
        </div>
      )}

      {/* 歷史紀錄 */}
      {view === 'history' && (
        <div className="h-screen flex flex-col">
          <header className="app-header bg-[#C5AE89] p-6 safe-top flex items-center gap-4 text-white shadow-md">
            <div className="back-button-hitbox" onClick={() => setView('home')}><ChevronLeft size={44} strokeWidth={3} /></div>
            <h1 className="text-2xl font-black">{t.history}</h1>
          </header>
          <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-[#FDFBF7]">
            {history.length === 0 ? (
              <div className="text-center py-32 opacity-10 flex flex-col items-center">
                <History size={140} /><p className="text-3xl font-black">{t.noHistory}</p>
              </div>
            ) : (
              history.map(item => (
                <div key={item.id} className="bg-white p-5 rounded-[30px] shadow-md flex gap-5 items-center active:bg-gray-50 transition-all" onClick={() => { setMedInfo(item.info); setScannedImage(item.image); setView('result'); }}>
                  <img src={item.image} className="w-24 h-24 rounded-3xl object-cover border border-gray-100" />
                  <div className="flex-1 min-w-0 text-left">
                    <div className="text-2xl font-black text-gray-900 truncate">{item.info.name}</div>
                    <div className="text-gray-400 font-bold">{item.date}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 載入與錯誤彈窗 */}
      {loading && (
        <div className="fixed inset-0 bg-white/95 z-[9999] flex flex-col items-center justify-center p-10 text-center">
          <div className="w-32 h-32 border-[12px] border-[#C5AE89]/10 border-t-[#C5AE89] rounded-full animate-spin mb-10" />
          <h2 className="text-4xl font-black text-gray-900 mb-4">{t.identifying}</h2>
          <p className="text-xl text-gray-500 font-bold">{t.loadingSub}</p>
        </div>
      )}
      
      {error && (
        <div className="fixed inset-0 z-[10000] bg-black/80 flex items-center justify-center p-6 backdrop-blur-sm" onClick={() => setError(null)}>
          <div className="bg-white rounded-[50px] p-10 w-full text-center shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6"><X size={48} strokeWidth={3} /></div>
            <p className="text-2xl font-black text-gray-900 mb-8 leading-snug">{error}</p>
            <button onClick={() => setError(null)} className="w-full bg-[#C5AE89] text-white py-5 rounded-[25px] text-2xl font-black shadow-lg">{t.ok}</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
