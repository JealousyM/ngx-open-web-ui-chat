export interface Translation {
  send: string;
  stop: string;
  placeholder: string;
  loading: string;
}

export interface Translations {
  [key: string]: Translation;
}

export const translations: Translations = {
  en: {
    send: 'Send',
    stop: 'Stop',
    placeholder: 'Type your message...',
    loading: 'Loading...'
  },
  zh: {
    send: '发送',
    stop: '停止',
    placeholder: '输入您的消息...',
    loading: '加载中...'
  },
  hi: {
    send: 'भेजें',
    stop: 'रोकें',
    placeholder: 'अपना संदेश लिखें...',
    loading: 'लोड हो रहा है...'
  },
  es: {
    send: 'Enviar',
    stop: 'Detener',
    placeholder: 'Escribe tu mensaje...',
    loading: 'Cargando...'
  },
  ar: {
    send: 'إرسال',
    stop: 'إيقاف',
    placeholder: 'اكتب رسالتك...',
    loading: 'جار التحميل...'
  },
  fr: {
    send: 'Envoyer',
    stop: 'Arrêter',
    placeholder: 'Tapez votre message...',
    loading: 'Chargement...'
  },
  pt: {
    send: 'Enviar',
    stop: 'Parar',
    placeholder: 'Digite sua mensagem...',
    loading: 'Carregando...'
  },
  ru: {
    send: 'Отправить',
    stop: 'Остановить',
    placeholder: 'Введите ваше сообщение...',
    loading: 'Загрузка...'
  },
  bn: {
    send: 'পাঠান',
    stop: 'থামান',
    placeholder: 'আপনার বার্তা টাইপ করুন...',
    loading: 'লোড হচ্ছে...'
  },
  ja: {
    send: '送信',
    stop: '停止',
    placeholder: 'メッセージを入力...',
    loading: '読み込み中...'
  }
};

export function getTranslation(language: string): Translation {
  return translations[language] || translations['en'];
}

