export interface Translation {
  send: string;
  placeholder: string;
  loading: string;
}

export interface Translations {
  [key: string]: Translation;
}

export const translations: Translations = {
  en: {
    send: 'Send',
    placeholder: 'Type your message...',
    loading: 'Loading...'
  },
  zh: {
    send: '发送',
    placeholder: '输入您的消息...',
    loading: '加载中...'
  },
  hi: {
    send: 'भेजें',
    placeholder: 'अपना संदेश लिखें...',
    loading: 'लोड हो रहा है...'
  },
  es: {
    send: 'Enviar',
    placeholder: 'Escribe tu mensaje...',
    loading: 'Cargando...'
  },
  ar: {
    send: 'إرسال',
    placeholder: 'اكتب رسالتك...',
    loading: 'جار التحميل...'
  },
  fr: {
    send: 'Envoyer',
    placeholder: 'Tapez votre message...',
    loading: 'Chargement...'
  },
  pt: {
    send: 'Enviar',
    placeholder: 'Digite sua mensagem...',
    loading: 'Carregando...'
  },
  ru: {
    send: 'Отправить',
    placeholder: 'Введите ваше сообщение...',
    loading: 'Загрузка...'
  },
  bn: {
    send: 'পাঠান',
    placeholder: 'আপনার বার্তা টাইপ করুন...',
    loading: 'লোড হচ্ছে...'
  },
  ja: {
    send: '送信',
    placeholder: 'メッセージを入力...',
    loading: '読み込み中...'
  }
};

export function getTranslation(language: string): Translation {
  return translations[language] || translations['en'];
}

