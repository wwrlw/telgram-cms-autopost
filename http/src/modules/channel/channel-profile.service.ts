export interface ChannelRewriteProfile {
  channelHandle: string; // например, "@mash"
  styleGuidelines: {
    tone: 'новостной' | 'разговорный' | 'ироничный' | 'сухой' | 'энтузиастичный' | 'аналитический';
    lengthPreference: 'кратко' | 'средне' | 'развёрнуто';
    emojiUsage: 'нет' | 'умеренно' | 'много';
    formatting: Array<'заголовок' | 'абзацы' | 'списки' | 'эмодзи-маркеры' | 'хэштеги'>;
  };
  transformationDepth: 'умеренно' | 'глубоко';
  constraints: {
    keepFacts: boolean;
    avoidLinks: boolean;
    avoidDisclaimers: boolean;
    avoidGenericAdvice: boolean;
    noHallucinations: boolean;
  };
  extraNotes?: string;
}

function normalizeHandle(handle: string | undefined | null): string {
  if (!handle) return 'default';
  const trimmed = handle.trim();
  if (!trimmed) return 'default';
  return trimmed.startsWith('@') ? trimmed : `@${trimmed}`;
}

export class ChannelProfileService {
  private readonly profiles: Map<string, ChannelRewriteProfile> = new Map();
  private readonly aliasMap: Map<string, string[]> = new Map();

  constructor() {
    this.profiles.set('default', {
      channelHandle: 'default',
      styleGuidelines: {
        tone: 'новостной',
        lengthPreference: 'средне',
        emojiUsage: 'нет',
        formatting: ['заголовок', 'абзацы']
      },
      transformationDepth: 'глубоко',
      constraints: {
        keepFacts: true,
        avoidLinks: true,
        avoidDisclaimers: true,
        avoidGenericAdvice: true,
        noHallucinations: true
      },
      extraNotes: 'Переписывать с варьированием структуры, синтаксиса и порядка подачи фактов, без потери смысла.'
    });

    this.addPreset('@mash', {
      tone: 'новостной',
      lengthPreference: 'средне',
      emojiUsage: 'нет',
      formatting: ['заголовок', 'абзацы']
    }, 'Короткий лид, факты без оценочности, сухая новостная подача.');

    this.addPreset('@rozetked', {
      tone: 'аналитический',
      lengthPreference: 'средне',
      emojiUsage: 'умеренно',
      formatting: ['заголовок', 'абзацы', 'списки']
    }, 'При наличии характеристик устройств — группировать в маркированные списки.');

    this.addPreset('@rhymestg', {
      tone: 'ироничный',
      lengthPreference: 'средне',
      emojiUsage: 'умеренно',
      formatting: ['абзацы', 'эмодзи-маркеры']
    }, 'Игра слов допустима, лёгкая ирония без искажения фактов.');

    this.addPreset('@Lepragram', {
      tone: 'ироничный',
      lengthPreference: 'кратко',
      emojiUsage: 'умеренно',
      formatting: ['абзацы']
    }, 'Саркастичный тон, короткие формулировки, уместный punchline в конце.');

    // Алиасы для подписей (ручные варианты нэйминга)
    this.aliasMap.set(normalizeHandle('@Lepragram'), ['Рифмы и Панчи', 'Рифмы и Новости']);
    this.aliasMap.set(normalizeHandle('@topor'), ['Топор', 'Топор+']);
    this.aliasMap.set(normalizeHandle('@КиберТопор'), ['КиберТопор']);
    this.aliasMap.set(normalizeHandle('@Смоки и Флешки | CS2'), ['Смоки и Флешки']);
    this.aliasMap.set(normalizeHandle('@Champions Cup | ФУТБОЛ'), ['Champions Cup']);

    this.addPreset('@memeforyousir', {
      tone: 'ироничный',
      lengthPreference: 'кратко',
      emojiUsage: 'много',
      formatting: ['абзацы', 'эмодзи-маркеры']
    }, 'Мемный тон, допускаются эмодзи и сленг без токсичности.');

    this.addPreset('@banki_oil', {
      tone: 'аналитический',
      lengthPreference: 'средне',
      emojiUsage: 'нет',
      formatting: ['заголовок', 'абзацы', 'списки']
    }, 'Кратко выделять цифры и ключевые метрики.');

    this.addPreset('@КиберТопор', {
      tone: 'сухой',
      lengthPreference: 'средне',
      emojiUsage: 'нет',
      formatting: ['абзацы', 'списки']
    }, 'Техничный новостной стиль кибербезопасности, без эмоций.');

    this.addPreset('@a_xyenno_a', {
      tone: 'разговорный',
      lengthPreference: 'кратко',
      emojiUsage: 'умеренно',
      formatting: ['абзацы', 'эмодзи-маркеры']
    }, 'Разговорная подача, короткие абзацы, уместные эмодзи.');

    this.addPreset('@whackdoor', {
      tone: 'сухой',
      lengthPreference: 'средне',
      emojiUsage: 'нет',
      formatting: ['абзацы', 'списки']
    }, 'Кибер/тех-утечки, факты и структура без оценочных суждений.');

    this.addPreset('@Топор+', {
      tone: 'новостной',
      lengthPreference: 'средне',
      emojiUsage: 'нет',
      formatting: ['абзацы']
    }, 'Жёсткий новостной тон без лишних эмоций и оценок.');

    this.addPreset('@Рифмы и Новости', {
      tone: 'ироничный',
      lengthPreference: 'средне',
      emojiUsage: 'умеренно',
      formatting: ['абзацы']
    }, 'Допускается лёгкая игра слов, но без искажения фактов.');

    this.addPreset('@Крипы и Денаи | Dota 2', {
      tone: 'энтузиастичный',
      lengthPreference: 'средне',
      emojiUsage: 'умеренно',
      formatting: ['заголовок', 'абзацы', 'списки', 'эмодзи-маркеры']
    }, 'Игровой стиль, можно использовать жаргон сообщества Dota 2 без токсичности.');

    this.addPreset('@Игры и Патчи', {
      tone: 'аналитический',
      lengthPreference: 'средне',
      emojiUsage: 'нет',
      formatting: ['заголовок', 'абзацы', 'списки']
    }, 'Изменения патчей структурировать списками, выделять ключевые изменения.');

    this.addPreset('@abubinsk', {
      tone: 'новостной',
      lengthPreference: 'кратко',
      emojiUsage: 'нет',
      formatting: ['абзацы']
    }, 'Локальные новости лаконично и по делу, без воды.');

    this.addPreset('@neuraldvig', {
      tone: 'аналитический',
      lengthPreference: 'средне',
      emojiUsage: 'нет',
      formatting: ['заголовок', 'абзацы', 'списки']
    }, 'Искусственный интеллект: подчёркивать выводы и прикладные эффекты.');

    this.addPreset('@rozetkedplus', {
      tone: 'аналитический',
      lengthPreference: 'средне',
      emojiUsage: 'умеренно',
      formatting: ['заголовок', 'абзацы', 'списки']
    }, 'Следовать стилю @rozetked, допускаются компактные списки характеристик.');

    this.addPreset('@GodnoSklad', {
      tone: 'разговорный',
      lengthPreference: 'кратко',
      emojiUsage: 'умеренно',
      formatting: ['абзацы', 'эмодзи-маркеры']
    }, 'Подчёркивать выгоду/ценность для читателя, уместная разговорность.');

    this.addPreset('@about50posts', {
      tone: 'сухой',
      lengthPreference: 'кратко',
      emojiUsage: 'нет',
      formatting: ['списки', 'абзацы']
    }, 'Агрегатор: структурировать пунктами без воды.');

    this.addPreset('@apldvizh', {
      tone: 'энтузиастичный',
      lengthPreference: 'средне',
      emojiUsage: 'умеренно',
      formatting: ['абзацы', 'эмодзи-маркеры']
    }, 'Футбол (АПЛ): допускаются краткие эмоциональные ремарки без токсичности.');

    this.addPreset('@laligadvizh', {
      tone: 'энтузиастичный',
      lengthPreference: 'средне',
      emojiUsage: 'умеренно',
      formatting: ['абзацы', 'эмодзи-маркеры']
    }, 'Футбол (Ла Лига): выдерживать спортивный дискурс.');

    this.addPreset('@Финты и Панчи', {
      tone: 'энтузиастичный',
      lengthPreference: 'кратко',
      emojiUsage: 'умеренно',
      formatting: ['абзацы', 'эмодзи-маркеры']
    });

    this.addPreset('@naebnet', {
      tone: 'ироничный',
      lengthPreference: 'кратко',
      emojiUsage: 'умеренно',
      formatting: ['абзацы']
    }, 'Саркастичная подача допускается без искажения фактов.');

    this.addPreset('@topor', {
      tone: 'новостной',
      lengthPreference: 'средне',
      emojiUsage: 'нет',
      formatting: ['абзацы']
    }, 'Лаконично, факты первичны, без эмоциональных окрасов.');

    this.addPreset('@Champions Cup | ФУТБОЛ', {
      tone: 'энтузиастичный',
      lengthPreference: 'средне',
      emojiUsage: 'умеренно',
      formatting: ['заголовок', 'абзацы', 'эмодзи-маркеры']
    }, 'Матчи и турниры: эмоционально, но без фанатских выпадов.');

    this.addPreset('@memachh', {
      tone: 'ироничный',
      lengthPreference: 'кратко',
      emojiUsage: 'много',
      formatting: ['абзацы', 'эмодзи-маркеры']
    }, 'Мемный тон, коротко и остроумно, уместные эмодзи.');

    this.addPreset('@chatgptv', {
      tone: 'аналитический',
      lengthPreference: 'средне',
      emojiUsage: 'нет',
      formatting: ['заголовок', 'абзацы', 'списки']
    }, 'AI/инструменты: выделять шаги и инструкции списками.');

    this.addPreset('@Смоки и Флешки | CS2', {
      tone: 'энтузиастичный',
      lengthPreference: 'средне',
      emojiUsage: 'умеренно',
      formatting: ['абзацы', 'списки', 'эмодзи-маркеры']
    }, 'CS2: указывать позиции/раскидки структурировано.');

    this.addPreset('@hypefaggot', {
      tone: 'ироничный',
      lengthPreference: 'кратко',
      emojiUsage: 'много',
      formatting: ['абзацы', 'эмодзи-маркеры']
    }, 'Провокационная ирония допустима без оскорблений.');

    this.addPreset('@thedankestmemes', {
      tone: 'ироничный',
      lengthPreference: 'кратко',
      emojiUsage: 'много',
      formatting: ['абзацы', 'эмодзи-маркеры']
    }, 'Мемный тон, допускается англ/ру-сленг без токсичности.');

    this.addPreset('@ynchqmemes', {
      tone: 'ироничный',
      lengthPreference: 'кратко',
      emojiUsage: 'много',
      formatting: ['абзацы', 'эмодзи-маркеры']
    }, 'Мемный короткий формат, чёткий punchline.');

    this.addPreset('@sburyi', {
      tone: 'аналитический',
      lengthPreference: 'средне',
      emojiUsage: 'нет',
      formatting: ['заголовок', 'абзацы']
    }, 'Аналитика: тезисно и структурно, без эмоциональной окраски.');

    this.addPreset('@ayakakskazal', {
      tone: 'разговорный',
      lengthPreference: 'кратко',
      emojiUsage: 'умеренно',
      formatting: ['абзацы']
    }, 'Разговорный стиль, допускается лёгкое просторечие без оскорблений.');

    this.addPreset('@AiVenturaa', {
      tone: 'аналитический',
      lengthPreference: 'средне',
      emojiUsage: 'нет',
      formatting: ['заголовок', 'абзацы', 'списки']
    }, 'AI/нейросети: подчёркивать прикладные кейсы и шаги применения.');

    this.addPreset('@neyroseti_dr', {
      tone: 'аналитический',
      lengthPreference: 'средне',
      emojiUsage: 'нет',
      formatting: ['абзацы', 'списки']
    }, 'Медицина/нейро: осторожные формулировки, никаких советов по лечению.');

    this.addPreset('@hiaimedia', {
      tone: 'новостной',
      lengthPreference: 'средне',
      emojiUsage: 'нет',
      formatting: ['заголовок', 'абзацы']
    }, 'Техно-новости: заголовок + факты, без субъективных оценок.');

    this.addPreset('@chioriotg', {
      tone: 'новостной',
      lengthPreference: 'кратко',
      emojiUsage: 'нет',
      formatting: ['абзацы']
    }, 'Короткие локальные апдейты, по делу и без воды.');
  }

  private addPreset(handle: string, style: ChannelRewriteProfile['styleGuidelines'], extraNotes?: string) {
    const h = normalizeHandle(handle);
    this.profiles.set(h, {
      channelHandle: h,
      styleGuidelines: style,
      transformationDepth: 'глубоко',
      constraints: {
        keepFacts: true,
        avoidLinks: true,
        avoidDisclaimers: true,
        avoidGenericAdvice: true,
        noHallucinations: true
      },
      extraNotes
    });
  }

  getProfileByHandle(handle?: string | null): ChannelRewriteProfile {
    const key = normalizeHandle(handle);
    return this.profiles.get(key) || (this.profiles.get('default') as ChannelRewriteProfile);
  }

  /**
   * Возвращает список кандидатных подписей каналов для удаления из конца текста.
   * Включает варианты без @, а также обрезку по разделителю " | ".
   */
  getSignatureCandidates(): string[] {
    const result: Set<string> = new Set();
    for (const key of this.profiles.keys()) {
      if (key === 'default') continue;
      const noAt = key.startsWith('@') ? key.slice(1) : key;
      result.add(noAt);
      // Вариант до разделителя " | " (например, "Champions Cup")
      const pipeIdx = noAt.indexOf(' | ');
      if (pipeIdx > 0) {
        result.add(noAt.slice(0, pipeIdx));
      }
      const aliases = this.aliasMap.get(key);
      if (aliases) {
        for (const a of aliases) result.add(a);
      }
    }
    return Array.from(result);
  }

  getSignatureVariantsForProfile(profile: ChannelRewriteProfile): string[] {
    const variants: Set<string> = new Set();
    const handle = normalizeHandle(profile.channelHandle);
    const noAt = handle.startsWith('@') ? handle.slice(1) : handle;
    variants.add(noAt);
    const pipeIdx = noAt.indexOf(' | ');
    if (pipeIdx > 0) variants.add(noAt.slice(0, pipeIdx));
    const aliases = this.aliasMap.get(handle);
    if (aliases) {
      for (const a of aliases) variants.add(a);
    }
    return Array.from(variants);
  }
}


