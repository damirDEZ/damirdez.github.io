// Контакты Дамира — реальные (T-003). Ими пользуются первый экран и блок контакта.
// Нет поля — нет кнопки.

export interface Contacts {
  /** Telegram: ник без @ и ссылка. Кнопка открывается в новой вкладке. */
  telegram?: { handle: string; url: string };
  /** Почта: кнопка «Email me» (mailto:) и адрес текстом в блоке контакта. */
  email?: string;
}

export const contacts: Contacts = {
  telegram: { handle: 'Dasifor', url: 'https://t.me/Dasifor' },
  email: 'damirnikola5@gmail.com',
};
