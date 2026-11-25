// Блок контакта (#contact) внизу главной. Адреса — из contacts.ts.

import { contacts } from './contacts';
import type { ConfirmMark } from './types';

export interface ContactBlock extends ConfirmMark {
  eyebrow: string;
  title: string;
  text: string;
  telegramLabel: string;
  emailLabel: string;
  /** Перед адресом почты текстом: "or write to". */
  mailPrefix: string;
}

export const contactBlock: ContactBlock = {
  eyebrow: 'Open for projects',
  title: 'Let’s make something.',
  text: 'Video, website or something in between — write me, I usually reply within a day.',
  needsConfirmation: '«I usually reply within a day» — обещание заказчику; Дамир подтверждает с материалами (T-009)',
  telegramLabel: contacts.telegram ? `Telegram @${contacts.telegram.handle}` : 'Telegram',
  emailLabel: 'Email me',
  mailPrefix: 'or write to',
};
