/* ============================================================
   AMARIX007 — Data Layer  (assets/js/data.js)
   ------------------------------------------------------------
   هذه الطبقة مؤقتة (Mock API) وهي مطابقة تماماً لما ستُرجعه
   الواجهة الخلفية لاحقاً:  GET /api/games  ->  { games: [...] }
   عند بناء الـ Back-End يكفي تعديل AMX.api.getGames() في app.js
   ليجلب من السيرفر بدل هذا الملف. لا شيء آخر يتغير.

   ── مخطط اللعبة الكامل (Game JSON Schema) ───────────────────
   {
     "_id":        "auto (MongoDB)",
     "slug":       "cyberpunk-2077",
     "title":      "Cyberpunk 2077",
     "platform":   "pc" | "android",
     "genres":     ["rpg","action"],
     "price":      59.99,          // السعر الأساسي USD
     "discount":   65,             // نسبة الخصم %
     "rating":     4.6,            // من 5
     "desc":       "وصف قصير",
     "cover":      "https://... (460x215)",
     "hero":       "https://... (1920x620)",
     "featured":   true,
     "isNew":      false,
     "tags":       ["عالم مفتوح"],
     "stock":      "unlimited",
     "createdAt":  "ISO date"
   }
   ============================================================ */

window.AMX_DATA = (() => {
  const CDN = 'https://cdn.cloudflare.steamstatic.com/steam/apps/';
  const cover = id => id ? `${CDN}${id}/header.jpg` : null;
  const hero  = id => id ? `${CDN}${id}/library_hero.jpg` : null;

  /* التصنيفات — تُدار من لوحة التحكم لاحقاً (collection: categories) */
  const categories = [
    { key:'action',    name:'أكشن',        icon:'⚔️' },
    { key:'rpg',       name:'RPG',         icon:'🐉' },
    { key:'android',   name:'أندرويد',     icon:'📱' },
    { key:'strategy',  name:'استراتيجية',  icon:'♟️' },
    { key:'sports',    name:'رياضة',       icon:'🏆' },
    { key:'racing',    name:'سيارات',      icon:'🏎️' },
    { key:'horror',    name:'رعب',         icon:'👻' },
    { key:'shooter',   name:'تصويب',       icon:'🎯' },
    { key:'indie',     name:'مستقلة',      icon:'🎨' },
    { key:'survival',  name:'بقاء',        icon:'🏕️' },
  ];

  /* ── الكتالوج المضغوط ──────────────────────────────────────
     [ title, steamAppId|null, price, discount%, rating, genres, platform, desc, flags ]
     flags: f=featured  n=new  h=hero(carousel)
     لإضافة لعبة جديدة: أضف سطراً واحداً فقط. */
  const R = [
  ['Cyberpunk 2077',1091500,59.99,65,4.6,['rpg','action','shooter'],'pc','نايت سيتي تنتظرك: عالم مفتوح سايبربانك، تخصيص كامل، وقصة تتفرّع مع كل قرار تتخذه.','fhn'],
  ['Red Dead Redemption 2',1174180,59.99,75,4.9,['action','rpg'],'pc','آرثر مورغان وعصابة فان دير ليند في أضخم عالم مفتوح صنعته Rockstar.','fh'],
  ['ELDEN RING',1245620,59.99,40,4.8,['rpg','action'],'pc','الأرض الوسطى مفتوحة أمامك. اصعد لتصبح سيد الحلقة في أعظم لعبة FromSoftware.','fh'],
  ['Baldur\'s Gate 3',1086940,59.99,20,4.9,['rpg','strategy'],'pc','لعبة تقمّص أدوار بحرية مطلقة: كل خيار يُغيّر مصير العالم ورفاقك.','fh'],
  ['God of War Ragnarök',2322010,59.99,30,4.8,['action','rpg'],'pc','كرايتوس وأتريوس في رحلة الرغناروك الأخيرة عبر عوالم التسعة.','fhn'],
  ['Black Myth: Wukong',2358720,59.99,15,4.7,['action','rpg'],'pc','أسطورة الملك القرد بتقنية Unreal 5 وقتال لا يرحم.','fhn'],
  ['Grand Theft Auto V',271590,29.99,50,4.7,['action','racing'],'pc','لوس سانتوس: ثلاثة أبطال، سرقات ضخمة، وعالم أونلاين لا ينتهي.','f'],
  ['The Witcher 3: Wild Hunt',292030,39.99,80,4.9,['rpg','action'],'pc','جيرالت من ريفيا في مطاردة أسطورية عبر عالم مفتوح لا مثيل له.','f'],
  ['Marvel\'s Spider-Man Remastered',1817070,59.99,45,4.7,['action'],'pc','تنقّل بين ناطحات نيويورك في أفضل لعبة سبايدرمان.','f'],
  ['Hogwarts Legacy',990080,59.99,55,4.4,['rpg','action'],'pc','عالم هاري بوتر في القرن التاسع عشر: سحر، وحوش، وسرّ قديم.','f'],
  ['Helldivers 2',553850,39.99,25,4.5,['shooter','action'],'pc','انشر الديمقراطية المُدارة في المجرّة — تعاوني 4 لاعبين.','fn'],
  ['Resident Evil 4 Remake',2050650,59.99,50,4.8,['horror','action'],'pc','ليون كينيدي يعود في ريميك أسطوري لأفضل لعبة رعب وأكشن.','f'],
  ['EA SPORTS FC 25',2669320,69.99,60,4.1,['sports'],'pc','كرة القدم بأسلوب FC IQ وفرق Ultimate Team الجديدة.','fn'],
  ['Forza Horizon 5',1551360,59.99,65,4.8,['racing','sports'],'pc','مهرجان السرعة في المكسيك بأكثر من 500 سيارة أسطورية.','f'],
  ['Counter-Strike 2',730,0,0,4.5,['shooter'],'pc','معيار التصويب التنافسي في العالم — مجاناً بمحرك Source 2.','f'],
  ['Palworld',1623730,29.99,20,4.4,['survival','action'],'pc','اجمع الـ Pals، ابنِ قاعدتك، وانجُ في عالم مفتوح مجنون.',''],
  ['Sekiro: Shadows Die Twice',814380,59.99,50,4.8,['action','rpg'],'pc','ذئب بلا سيّد في اليابان الإقطاعية: قتال سيوف لا يغفر خطأً.','f'],
  ['DARK SOULS III',374320,59.99,60,4.7,['rpg','action'],'pc','عالم اللهب المتلاشي — قمة سلسلة Souls الكلاسيكية.',''],
  ['Monster Hunter: World',582010,29.99,66,4.6,['action','rpg'],'pc','اصطد وحوشاً عملاقة واصنع منها عتادك الأسطوري.',''],
  ['Monster Hunter Rise',1446780,39.99,70,4.5,['action','rpg'],'pc','قتال جوّي بالـ Wirebug في قرية كامورا.',''],
  ['DOOM Eternal',782330,39.99,75,4.7,['shooter','action'],'pc','مذبحة جهنمية بإيقاع ميتال لا يتوقف.','f'],
  ['Lies of P',1627720,59.99,50,4.5,['rpg','action'],'pc','بينوكيو في مدينة كرات المسخوطة: Souls-like أنيق وقاسٍ.',''],
  ['Ghost of Tsushima DC',2215430,59.99,30,4.8,['action','rpg'],'pc','جين ساكاي وحرب الساموراي على جزيرة تسوشيما.','f'],
  ['The Last of Us Part I',1888930,59.99,40,4.6,['action','horror'],'pc','جوول وإيلي في رحلة البقاء الأشهر في تاريخ الألعاب.','f'],
  ['Horizon Zero Dawn CE',1151640,49.99,70,4.7,['rpg','action'],'pc','آلوي تصطاد آلات عمالقة في عالم ما بعد الحضارة.',''],
  ['Death Stranding DC',1850570,39.99,55,4.4,['action'],'pc','سام بريدجز يعيد وصل أمريكا الممزّقة — من كوجيما.',''],
  ['Cyberpunk: Phantom Liberty',2138330,29.99,25,4.7,['rpg','shooter'],'pc','توسعة الجاسوسية: دوغتاون، إدريس إلبا، ونهاية جديدة.','n'],
  ['Assassin\'s Creed Mirage',3035570,49.99,50,4.2,['action','rpg'],'pc','بغداد القرن التاسع: عودة للتسلل الكلاسيكي.',''],
  ['Dying Light 2',534380,59.99,70,4.3,['survival','horror'],'pc','باركور وزومبي في آخر مدينة على وجه الأرض.',''],
  ['Starfield',1716740,69.99,55,4.0,['rpg','shooter'],'pc','ألف كوكب لاستكشافه في أول عالم جديد لـ Bethesda منذ 25 سنة.',''],
  ['Cities: Skylines II',949230,49.99,45,3.9,['strategy'],'pc','ابنِ المدينة التي تحلم بها بأدق محاكاة عمرانية.',''],
  ['Total War: WARHAMMER III',1142710,59.99,66,4.4,['strategy'],'pc','معارك ملحمية بآلاف الوحدات في عالم وارهامر.',''],
  ['Sid Meier\'s Civilization VI',289070,59.99,85,4.6,['strategy'],'pc','ابنِ حضارة تصمد أمام اختبار الزمن.',''],
  ['Age of Empires IV',1466860,39.99,60,4.5,['strategy'],'pc','عودة ملك ألعاب الاستراتيجية التاريخية.',''],
  ['Tekken 8',1778820,69.99,40,4.5,['action','sports'],'pc','قتال الأجيال يعود بمحرك Unreal 5 ونظام Heat.','n'],
  ['Street Fighter 6',1364780,59.99,50,4.6,['action','sports'],'pc','World Tour وDrive System — قتال الشوارع الحديث.',''],
  ['Mortal Kombat 1',1971870,69.99,65,4.2,['action'],'pc','عالم جديد بناه لِيوكانغ — وFatalities أعنف من أي وقت.',''],
  ['It Takes Two',1426210,39.99,60,4.8,['indie','action'],'pc','تعاوني لشخصين لا يُنسى — حائزة على لعبة العام.',''],
  ['Hades II',1145350,29.99,10,4.8,['indie','action'],'pc','ميلينوي ضد إله الزمن — أفضل Roguelike في السوق.','n'],
  ['Hollow Knight',367520,14.99,50,4.9,['indie'],'pc','عالم Hallownest المرسوم يدوياً: ميترويدفانيا مثالية.',''],
  ['Stardew Valley',413150,14.99,20,4.9,['indie','survival'],'pc','ورثت مزرعة جدك… ابنِ حياة كاملة فيها.',''],
  ['Terraria',105600,9.99,50,4.9,['indie','survival'],'pc','ابنِ، استكشف، وقاتل في عالم ثنائي الأبعاد لا نهائي.',''],
  ['Valheim',892970,19.99,25,4.7,['survival','rpg'],'pc','فايكنغ في العالم العاشر: بناء وبقاء وأساطير نورسية.',''],
  ['Rust',252490,39.99,40,4.2,['survival','shooter'],'pc','انجُ من اللاعبين قبل الوحوش — PvP بلا رحمة.',''],
  ['Sons Of The Forest',1326470,29.99,30,4.4,['survival','horror'],'pc','جزيرة آكلي لحوم البشر — بقاء بأعصاب من حديد.',''],
  ['Subnautica',264710,29.99,60,4.8,['survival','indie'],'pc','أعماق كوكب مائي غريب… وأنت وحدك.',''],
  ['No Man\'s Sky',275850,59.99,50,4.5,['survival','rpg'],'pc','18 كوينتيليون كوكب — ومجرّة كاملة لك.',''],
  ['Phasmophobia',739630,19.99,20,4.6,['horror','indie'],'pc','تحقيق في المسكونات مع أصدقائك — رعب صوتي حقيقي.',''],
  ['Battlefield 2042',1517290,59.99,80,3.6,['shooter'],'pc','حروب 128 لاعباً بطقس متغيّر وخرائط عملاقة.',''],
  ['Apex Legends',1172470,0,0,4.3,['shooter','action'],'pc','باتل رويال بأبطال وحركة سلسة — مجاناً.',''],
  ['PUBG: BATTLEGROUNDS',578080,0,0,4.0,['shooter','survival'],'pc','الباتل رويال الأصلي — 100 لاعب، ناجٍ واحد.',''],
  ['Sea of Thieves',1172620,39.99,50,4.4,['action','survival'],'pc','قرصنة تعاونية في بحار مفتوحة.',''],
  ['Warhammer 40K: Space Marine 2',2183900,59.99,25,4.6,['shooter','action'],'pc','تايتوس يعود لسحق طوفان التايرانيد.','n'],
  ['Metro Exodus',412020,29.99,75,4.6,['shooter','horror'],'pc','رحلة بالقطار عبر روسيا ما بعد النووية.',''],
  ['Control Ultimate Edition',870780,39.99,80,4.5,['action','horror'],'pc','المكتب الفيدرالي للتحكّم… والعمارة التي تتحرك.',''],
  ['Days Gone',1259420,49.99,70,4.3,['survival','action'],'pc','ديكون سانت جون وأسراب الـ Freakers.',''],
  ['Kingdom Come: Deliverance II',1771300,59.99,15,4.7,['rpg','action'],'pc','بوهيميا القرن الـ15 بواقعية تاريخية مطلقة.','n'],
  ['Cuphead',268910,19.99,35,4.8,['indie','action'],'pc','رسوم الثلاثينيات المتحركة… وصعوبة أسطورية.',''],
  ['Portal 2',620,9.99,75,4.9,['indie','strategy'],'pc','فيزياء البوابات وأذكى كتابة في تاريخ الألعاب.',''],
  ['Grounded',962130,39.99,40,4.5,['survival','indie'],'pc','مصغّر في حديقتك الخلفية — بقاء تعاوني ممتع.',''],
  /* ── ألعاب الأندرويد (APK / حسابات) ── */
  ['PUBG MOBILE — UC Top-Up',578080,9.99,15,4.4,['android','shooter'],'android','شحن UC فوري لحسابك + نسخة APK الأحدث بدون إعلانات.','fh'],
  ['Genshin Impact — Genesis',null,14.99,10,4.5,['android','rpg'],'android','بطاقات Genesis Crystals لعالم تيفات المفتوح.','f'],
  ['Call of Duty: Mobile CP',null,9.99,20,4.3,['android','shooter'],'android','نقاط CP + مواسم Battle Pass كاملة على جوالك.','f'],
  ['Free Fire — Diamonds',null,4.99,25,4.0,['android','shooter'],'android','شحن جواهر فوري لحساب Free Fire.',''],
  ['Mobile Legends: Bang Bang',null,7.99,15,4.2,['android','strategy'],'android','شحن Diamonds لأشهر لعبة MOBA على الأندرويد.',''],
  ['Clash of Clans — Gems',null,9.99,10,4.4,['android','strategy'],'android','جواهر لبناء قريتك وترقية جيشك بسرعة.','f'],
  ['Clash Royale — Pass Royale',null,11.99,10,4.1,['android','strategy'],'android','تذكرة Pass Royale الشهرية + صناديق حصرية.',''],
  ['Roblox — Robux',null,9.99,5,4.3,['android','indie'],'android','شحن Robux لكل عوالم Roblox.','f'],
  ['Minecraft: Pocket Edition',null,6.99,30,4.8,['android','survival'],'android','النسخة الكاملة للأندرويد + Realms شهر مجاناً.','f'],
  ['eFootball Mobile — Coins',null,9.99,20,3.9,['android','sports'],'android','عملات لبناء فريق أحلامك على الجوال.',''],
  ['Asphalt 9: Legends+',null,4.99,40,4.4,['android','racing'],'android','باقة توكنز وسيارات أسطورية.',''],
  ['Honkai: Star Rail',null,14.99,10,4.6,['android','rpg'],'android','Oneiric Shards لرحلة قطار النجوم.','n'],
  ['Wuthering Waves',null,14.99,15,4.4,['android','rpg'],'android','Lunites لعالم Solaris-3 المفتوح.','n'],
  ['Standoff 2 — Gold',null,3.99,20,4.2,['android','shooter'],'android','ذهب لفتح صناديق وسكِنات نادرة.',''],
  ['Brawl Stars — Gems',null,4.99,15,4.3,['android','action'],'android','جواهر + Brawl Pass لكل موسم.',''],
  ['Dead by Daylight Mobile',null,5.99,35,4.0,['android','horror'],'android','رعب 1 ضد 4 على الجوال — Auric Cells.',''],
  ['Stumble Guys — Premium',null,3.99,30,4.1,['android','indie'],'android','باقة جواهر وسكنات لأكثر لعبة حفلات مرحاً.',''],
  ['Summoners War — Crystals',null,9.99,20,4.2,['android','strategy'],'android','كريستالات لاستدعاء الوحوش النادرة.',''],
  ['Farlight 84 — Diamonds',null,4.99,25,4.0,['android','shooter'],'android','شحن ألماس لباتل رويال Farlight.',''],
  ['Arena Breakout — Bonds',null,9.99,15,4.3,['android','shooter'],'android','Bonds لأشهر لعبة تكتيكية على الجوال.',''],
  ];

  const slugify = s => s.toLowerCase().replace(/[^\w\u0600-\u06FF]+/g,'-').replace(/^-|-$/g,'');

  /* مولّد غلاف SVG احتياطي (يعمل بلا إنترنت ولأي لعبة بلا صورة) */
  const gen = (title, seed=0) => {
    const P = [['#4d7cff','#9b5cff'],['#22e3ff','#4d7cff'],['#ff4fd8','#9b5cff'],
               ['#2ee6a8','#22e3ff'],['#ffc53d','#ff4fd8'],['#9b5cff','#06060d']];
    const [a,b] = P[seed % P.length];
    const t = title.length > 26 ? title.slice(0,25)+'…' : title;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="920" height="430">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>
      <radialGradient id="r" cx=".2" cy=".1" r=".9"><stop offset="0" stop-color="#fff" stop-opacity=".35"/>
      <stop offset="1" stop-color="#000" stop-opacity=".55"/></radialGradient></defs>
      <rect width="920" height="430" fill="#0a0a14"/><rect width="920" height="430" fill="url(#g)" opacity=".85"/>
      <rect width="920" height="430" fill="url(#r)"/>
      <g fill="#fff" opacity=".13">${Array.from({length:9},(_,i)=>`<circle cx="${(i*137+seed*29)%920}" cy="${(i*91+seed*53)%430}" r="${6+(i*seed)%40}"/>`).join('')}</g>
      <text x="46" y="238" font-family="Cairo,Arial" font-size="52" font-weight="900" fill="#fff">${t.replace(/&/g,'&amp;').replace(/</g,'&lt;')}</text>
      <text x="48" y="284" font-family="Orbitron,Arial" font-size="22" font-weight="700" fill="#fff" opacity=".72">AMARIX007</text>
    </svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  };

  const games = R.map((r,i) => {
    const [title,app,price,discount,rating,genres,platform,desc,flags='']=r;
    return {
      _id:'g'+String(i+1).padStart(4,'0'),
      slug:slugify(title), title, platform, genres, desc,
      price, discount, rating,
      cover: cover(app) || gen(title,i),
      prev : cover(app) || gen(title,i+3),
      hero : hero(app)  || gen(title,i+1),
      fallback: gen(title,i),
      featured: flags.includes('f'),
      isNew:    flags.includes('n'),
      inHero:   flags.includes('h'),
      stock:'unlimited',
      createdAt:new Date(Date.now()-i*864e5).toISOString(),
    };
  });

  /* أقسام مستقبلية — جاهزة للتفعيل من لوحة التحكم */
  const upcoming = [
    { icon:'🎁', title:'بطاقات الهدايا',     desc:'Steam · PSN · Xbox · Google Play · iTunes — تسليم فوري بالكود.', cta:'قريباً' },
    { icon:'💻', title:'البرمجيات والتراخيص', desc:'Windows · Office · أنتي فايروس · أدوات مونتاج وتصميم أصلية.', cta:'قريباً' },
    { icon:'📺', title:'الاشتراكات الرقمية',  desc:'Game Pass · PS Plus · Netflix · Spotify — تجديد تلقائي.', cta:'قريباً' },
    { icon:'🎨', title:'أصول المطوّرين',      desc:'Assets · Textures · موديلات 3D · مؤثرات صوتية بترخيص تجاري.', cta:'قريباً' },
  ];

  return { games, categories, upcoming, gen };
})();
