export interface DaliNote {
  id: string;
  title: string;
  content: string;
  dateStr: string; // 'YYYY-MM-DD'
  updatedAt: number;
}

export interface SlashCommand {
  id: string;
  command: string;
  label: string;
  description: string;
  iconName: string;
  snippet: string;
}

export const SLASH_COMMANDS: SlashCommand[] = [
  {
    id: 'h1',
    command: '/h1',
    label: 'Büyük Başlık (H1)',
    description: 'En belirgin ana bölüm başlığı',
    iconName: 'heading',
    snippet: '# ',
  },
  {
    id: 'h2',
    command: '/h2',
    label: 'Orta Başlık (H2)',
    description: 'Alt bölüm başlığı',
    iconName: 'heading',
    snippet: '## ',
  },
  {
    id: 'h3',
    command: '/h3',
    label: 'Küçük Başlık (H3)',
    description: 'Küçük alt başlık',
    iconName: 'heading',
    snippet: '### ',
  },
  {
    id: 'bullet',
    command: '/b',
    label: 'Madde Listesi',
    description: 'Noktalı liste oluştur',
    iconName: 'list',
    snippet: '- ',
  },
  {
    id: 'number',
    command: '/n',
    label: 'Numaralı Liste',
    description: 'Sıralı 1, 2, 3 listesi',
    iconName: 'list-ordered',
    snippet: '1. ',
  },
  {
    id: 'todo',
    command: '/t',
    label: 'Yapılacak Kutusu',
    description: 'İşaretlenebilir görev maddesi',
    iconName: 'check-square',
    snippet: '[ ] ',
  },
  {
    id: 'quote',
    command: '/q',
    label: 'Alıntı Bloğu',
    description: 'Vurgulu alıntı veya düşünce',
    iconName: 'quote',
    snippet: '> ',
  },
  {
    id: 'code',
    command: '/c',
    label: 'Kod / Blok',
    description: 'Teknik veya biçimlendirilmiş metin',
    iconName: 'code',
    snippet: '```\n\n```',
  },
  {
    id: 'divider',
    command: '/div',
    label: 'Ayraç Çizgisi',
    description: 'Bölümleri ayıran yatay çizgi',
    iconName: 'minus',
    snippet: '\n---\n',
  },
  {
    id: 'time',
    command: '/d',
    label: 'Tarih & Saat Damgası',
    description: 'Şu anki zamanı ekle',
    iconName: 'clock',
    snippet: '', // dynamically calculated
  },
];
