/* الأنظمة الغذائية لنزول الوزن (0.41): 10 أنظمة بحسابات وقيود ومدقّق، ومشاكل الأخصائي العشر.
   النظام لا يبني خطة بذاته؛ يحوّل العميل إلى «ماكروز + سعرات + جدول + قواعد أطعمة» ثم يولّد المحرّك الحالي (الحصص E أو الجرامات Ath) الخطة،
   ويفحصها المدقّق. كل رقم هنا قيمة افتراضية قابلة للتعديل من الأخصائي، وهي مسودة بمراجعها حتى يعتمدها المالك (docs/diets_research_AR.md). */
(function (root) {
  'use strict';
  var DX = {}, r5 = function (x, s) { s = s || 50; return Math.round(x / s) * s; }, num = function (v, d) { v = parseFloat(v); return isNaN(v) ? (d || 0) : v; };
  var has = function (a, x) { return (a || []).indexOf(x) >= 0; };
  // ----------------------------------------------------------------------------- المراجع (مختصرة؛ التفصيل في docs/diets_research_AR.md)
  DX.SRC = {
    johnston: 'Johnston BC وآخرون، JAMA 2014: تحليل شبكي لـ48 تجربة (7286 مشاركاً) — الحميات المسماة تعطي نزولاً متقارباً (نحو 6–7 كجم في 12 شهراً) والالتزام هو الفيصل',
    leidy: 'Leidy HJ وآخرون، Am J Clin Nutr 2015: بروتين 1.2–1.6 جم/كجم/يوم (و25–30 جم في الوجبة) يفيد الشبع وضبط الوزن وحفظ الكتلة الخالية أثناء التقييد',
    cochraneIF: 'مراجعة Cochrane للصيام المتقطع (22 تجربة، نحو 2000 بالغ): لا أفضلية سريرية على التقييد المستمر للسعرات',
    liu: 'Liu D وآخرون، NEJM 2022: صيام 16:8 مع تقييد السعرات لم يتفوق على تقييد السعرات وحده (تجربة سنة)',
    nunes: 'Nunes CL وآخرون، Br J Nutr 2021: مراجعة منهجية — التكيّف الحراري بعد فقدان الوزن موثّق في أغلب الدراسات',
    matador: 'MATADOR (Byrne 2018، Int J Obes): تقييد متقطع بفترات استراحة أنتج نزولاً أكبر لدى رجال مصابين بالسمنة (تجربة صغيرة؛ نتائج لاحقة متضاربة)',
    keto: 'مراجعات الكيتو في السمنة: فعّال على المدى القصير، ولا ميزة مثبتة طويلاً على غيره، ويحتاج متابعة سريرية وانتقاء للمرضى',
    dash: 'تحليل شبكي (نحو 67 تجربة): DASH الأعلى ترتيباً في خفض الضغط الانقباضي (نحو 4–8 ملم زئبق حسب التحليل)',
    med: 'تحليلات حديثة للنمط المتوسطي: أثر قلبي وعائي إيجابي، والوزن مماثل لغيره',
    mena: 'مراجعة Weill Cornell Medicine-Qatar لـ29 تجربة في الشرق الأوسط (2792 بالغاً): متوسط نزول 4.8 كجم؛ وفي تجربة سنتين: متوسطي ~4.6 وقليل الدهن ~3.3 وقليل الكارب ~5.5 كجم',
    shis: 'المسح الصحي السعودي (Saudi Health Interview Survey، Public Health Nutr 2016): فاكهة 71 جم وخضار 111 جم يومياً، وقلة من يبلغون التوصية',
    sa23: 'Advances in Public Health 2023: 31% من السعوديين أقل من 3 وجبات، و75% يتناولون سناكات، و16.8% يتركون الفطور',
    sa_moh: 'وزارة الصحة السعودية: الدليل الغذائي (نخلة الغذاء الصحي) والطبق الصحي السعودي',
    egOecd: 'OECD: دعم الخبز البلدي والتموين يدفع نحو نمط غني بالنشويات في مصر',
    egEmhj: 'EMHJ 2016: التحول الغذائي في الدول العربية مرتبط بالسمنة'
  };
  DX.GRADE = { strong: 'قوي', mid: 'متوسط', weak: 'محدود' };
  // ----------------------------------------------------------------------------- الأنظمة
  var P_DEF = { k: 'deficit', l: 'العجز اليومي (سعرة)', min: 250, max: 750, step: 50, def: 500 };
  DX.LIST = [
    { id: 'balanced', n: 'عجز سعري متوازن', sys: 'ex', grade: 'strong', refs: ['johnston', 'mena'],
      sum: 'عجز سعري معتدل بتوزيع ماكروز متوازن وأطعمة عادية. هو الأساس الذي تقاس عليه بقية الأنظمة: الحميات المسماة تعطي نزولاً متقارباً، والمهم أن يلتزم العميل.',
      when: ['أغلب العملاء، وهو الخيار الافتراضي حين لا يوجد سبب لغيره', 'من يريد نظاماً مألوفاً بلا قواعد خاصة', 'عند عدم وضوح تفضيل العميل'],
      notFor: ['من لديه حالة تتطلب نمطاً خاصاً (ضغط، سكري يحتاج ضبط كارب...)'],
      pros: ['سهل الفهم والتنفيذ', 'مرن اجتماعياً', 'لا يحتاج استثناءات سريرية'], cons: ['لا يعالج الجوع بمفرده', 'يحتاج انضباطاً في الكميات'],
      eg: 'يُبنى على الخبز البلدي والأرز والفول بكميات مقيّسة بالأرباع والملاعق.', sa: 'يُقسَّم طبق الكبسة: ثلث أرز، ثلث بروتين، ثلث خضار وسلطة.',
      par: [P_DEF, { k: 'pro', l: 'بروتين (جم/كجم)', min: 1, max: 1.6, step: 0.1, def: 1.2 }, { k: 'fat', l: 'دهون % من السعرات', min: 20, max: 35, step: 1, def: 28 }] },
    { id: 'highpro', n: 'عالي البروتين', sys: 'both', grade: 'strong', refs: ['leidy', 'johnston'],
      sum: 'رفع البروتين إلى 1.6 جم/كجم مع عجز معتدل لزيادة الشبع وحفظ الكتلة العضلية، مع توزيعه على 3–4 وجبات (25–30 جم في الوجبة). للسمنة يُحسب على الوزن المعدّل وبسقف 30% من السعرات.',
      when: ['جوع شديد أو ضعف شبع', 'ممارسو التمارين، أو من يخشى فقدان العضلات', 'كبار السن (للحفاظ على الكتلة)', 'مرحلة الثبات حين لا يحقق العجز السعري وحده'],
      notFor: ['أمراض الكلى المزمنة إلا بإشراف الطبيب', 'من يرفض مصادر بروتين متنوعة'],
      pros: ['شبع أعلى', 'حفظ أفضل للعضلات', 'سهل مع الأطعمة المحلية (بيض، قريش، دجاج، سمك، بقول)'], cons: ['تكلفة أعلى', 'يحتاج تنويعاً حتى لا يتكرر الصنف'],
      eg: 'فول بالبيض، قريش، فراخ مشوية، سمك بلطي، عدس.', sa: 'لبنة قليلة الدسم، دجاج مشوي، سمك، فول، حمص.',
      par: [P_DEF, { k: 'pro', l: 'بروتين (جم/كجم)', min: 1.2, max: 2, step: 0.1, def: 1.6 }, { k: 'fat', l: 'دهون % من السعرات', min: 20, max: 35, step: 1, def: 30 }] },
    { id: 'med', n: 'متوسطي', sys: 'ex', grade: 'mid', refs: ['med', 'mena'],
      sum: 'زيت الزيتون دهناً رئيسياً، خضار وبقول وحبوب كاملة ومكسرات وسمك مرتين أسبوعياً على الأقل، ولحم أحمر قليل. أثره القلبي قوي، والوزن مماثل لغيره.',
      when: ['عميل لديه خطر قلبي (دهون، ضغط، سكري)', 'من يحب الطبخ البيتي والخضار والسمك', 'تثبيت الوزن على المدى الطويل'],
      notFor: ['حساسية المكسرات أو السمك (يُعدَّل بالبدائل)', 'من لا يتحمل ارتفاع التكلفة'],
      pros: ['مقبول ثقافياً في المنطقة', 'مفيد للقلب', 'مرن ومستدام'], cons: ['السمك والزيتون أغلى', 'السعرات تزيد بسهولة بالزيت إن لم يُقيَّس'],
      eg: 'فول وعدس وحمص، سلطات بزيت الزيتون، سمك مشوي، خبز بلدي بنصف رغيف.', sa: 'سلطات، حمص، سمك مشوي، تمر 1–3 حبات، خبز أسمر.',
      par: [P_DEF, { k: 'pro', l: 'بروتين (جم/كجم)', min: 1, max: 1.6, step: 0.1, def: 1.2 }, { k: 'fat', l: 'دهون % من السعرات', min: 28, max: 40, step: 1, def: 35 }] },
    { id: 'mideast', n: 'شرق أوسطي (مصري/سعودي)', sys: 'ex', grade: 'weak', refs: ['mena', 'egOecd', 'shis', 'sa23', 'sa_moh'],
      sum: 'مبادئ المتوسطي بأطعمة المنطقة: بقوليات وخضار مطبوخة وسمك مشوي وخبز بلدي بالأرباع وأرز مقيّس، مع تقليل القلي والسكر. لا توجد تجارب مباشرة عليه؛ سندُه التشابه مع المتوسطي والتجارب الإقليمية.',
      when: ['أغلب عملاء مصر والخليج الذين يريدون أكلاً مألوفاً', 'من يرفض تغيير نمطه الغذائي جذرياً', 'حين تكون الأولوية للالتزام والتحمل الاجتماعي'],
      notFor: ['من لديه موانع كارب شديدة (يُفضَّل منخفض الكارب)'],
      pros: ['مألوف ومقبول', 'اقتصادي (فول، عدس، حمص)', 'يتسع للمناسبات'], cons: ['لا دليل مباشر عليه', 'الأرز والخبز يحتاجان ضبطاً دقيقاً', 'الصوديوم يحتاج مراقبة'],
      eg: 'فول بزيت ملعقة وليمون وسلطة، عدس، ملوخية بدجاج، سمك بلطي مشوي، نصف رغيف بلدي.', sa: 'جريش أو مرقوق بكمية مقيّسة، كبسة بنصف الأرز وضعف الخضار، حمص، تمر 1–3 حبات، قهوة بلا سكر.',
      par: [P_DEF, { k: 'pro', l: 'بروتين (جم/كجم)', min: 1, max: 1.6, step: 0.1, def: 1.2 }, { k: 'fat', l: 'دهون % من السعرات', min: 22, max: 35, step: 1, def: 30 }] },
    { id: 'if', n: 'الصيام المتقطع', sys: 'both', grade: 'mid', refs: ['cochraneIF', 'liu', 'sa23'],
      sum: 'جدول للأكل يُركَّب على أي نظام: نافذة أكل 8 ساعات (16:8) أو يومان غير متتاليين بنحو 500–600 سعرة (5:2). لا يتفوّق على تقييد السعرات المستمر، لكنه يناسب من يفضّل قواعد زمنية بسيطة.',
      when: ['من يفضّل عدد وجبات أقل وقاعدة زمنية واضحة', 'من يجد العدّ اليومي مرهقاً', 'عمل أو نمط حياة يقلل الوجبات أصلاً'],
      notFor: ['الحمل والرضاعة', 'سكري على دواء أو إنسولين دون إشراف', 'اضطرابات الأكل', 'أقل من 18 سنة', 'كبار السن الضعفاء', 'عمل أو رياضة شاقة في وقت الصيام'],
      pros: ['بسيط', 'يقلل السناكات الليلية', 'متوافق مع ثقافة الصيام'], cons: ['لا ميزة مثبتة في الوزن', 'صداع وإرهاق في البداية', 'قد يسبب الإفراط في النافذة'],
      eg: 'نافذة 12 ظهراً إلى 8 مساءً: غداء ووجبة خفيفة وعشاء.', sa: 'يتوافق مع نمط السحور والإفطار؛ احذر الإفراط في الولائم.',
      par: [P_DEF, { k: 'pat', l: 'النمط', type: 'sel', opts: [['tre', 'نافذة 8 ساعات (16:8)'], ['52', '5:2 (يومان خفيفان)']], def: 'tre' }, { k: 'start', l: 'بداية النافذة', type: 'time', def: '12:00' },
        { k: 'fastK', l: 'سعرات يوم الصيام (5:2)', min: 400, max: 700, step: 50, def: 500 }, { k: 'base', l: 'النظام الأساس', type: 'sel', opts: [['balanced', 'متوازن'], ['highpro', 'عالي البروتين'], ['med', 'متوسطي'], ['mideast', 'شرق أوسطي']], def: 'balanced' }] },
    { id: 'cycle', n: 'تدوير الكارب', sys: 'ath', grade: 'weak', refs: ['matador', 'nunes'],
      sum: 'متوسط أسبوعي ثابت للعجز، مع أيام كارب مرتفع (غالباً أيام الحركة أو التمرين) وأيام كارب منخفض. لا توجد تجارب مباشرة عليه؛ فائدته عملية (مرونة ومناسبات واستعداد للتمرين) أكثر منها فسيولوجية مثبتة.',
      when: ['رياضي أو متمرن 3–5 أيام', 'من يملّ الكارب المنخفض الدائم', 'ثبات وزن مع التزام جيد (كخيار مرن)'],
      notFor: ['من لديه سكري يحتاج ثبات كارب بين الأيام', 'من لا يلتزم بقياس الكميات', 'اضطرابات الأكل'],
      pros: ['مرونة', 'طاقة أعلى في أيام التمرين', 'يخفف الشعور بالحرمان'], cons: ['دليل ضعيف', 'أكثر تعقيداً', 'قد يتحول يوم الكارب العالي إلى إفراط'],
      eg: 'بلح وأرز وبطاطس مشوية في الأيام العالية؛ بقوليات وخضار في المنخفضة.', sa: 'كبسة أو مرقوق في اليوم العالي بكمية مقيّسة، وجبات بروتين وخضار في المنخفض.',
      par: [P_DEF, { k: 'pro', l: 'بروتين (جم/كجم)', min: 1.2, max: 2, step: 0.1, def: 1.6 }, { k: 'fat', l: 'دهون (جم/كجم)', min: 0.6, max: 1.2, step: 0.1, def: 0.8 }, { k: 'hi', l: 'سعرات اليوم المرتفع % (يُقصّ ليبقى الفرق ≤ 25%)', min: 105, max: 120, step: 1, def: 110 }, { k: 'hiDays', l: 'عدد الأيام المرتفعة', min: 1, max: 3, step: 1, def: 3 }] },
    { id: 'keto', n: 'كيتو (كارب منخفض جداً)', sys: 'ath', grade: 'mid', refs: ['keto', 'johnston'],
      sum: 'كارب كلي 20–50 جم يومياً مع بروتين معتدل والباقي دهون، لمدة محددة (افتراضياً حتى 12 أسبوعاً) ثم إعادة تقييم. نزول سريع على المدى القصير، ولا ميزة مثبتة طويلاً، ويحتاج متابعة.',
      when: ['سمنة شديدة أو مقاومة إنسولين مع رغبة العميل واستعداده', 'من نجح مع الكارب المنخفض سابقاً', 'مدة قصيرة بإشراف'],
      notFor: ['الحمل والرضاعة', 'السكري من النوع الأول', 'سكري على أدوية دون تعديل الجرعات', 'قصور الكلى أو الكبد، التهاب البنكرياس، أمراض المرارة', 'اضطرابات الأكل', 'أقل من 18 سنة', 'من يستعمل مثبطات SGLT2'],
      pros: ['شبع عالٍ', 'نزول مبكر سريع', 'ينخفض الإنسولين'], cons: ['إمساك وصداع و«إنفلونزا الكيتو»', 'صعوبة اجتماعية في مصر والسعودية (أرز/خبز)', 'قد يرفع LDL', 'الاستمرار صعب'],
      eg: 'بيض، جبن، سمك، فراخ بجلد، خضار ورقية، زيت زيتون، مكسرات؛ بلا خبز وأرز وفول بكميات صغيرة.', sa: 'دجاج مشوي أو لحم بلا أرز، سلطات، لبنة، مكسرات، قهوة بلا سكر.',
      par: [P_DEF, { k: 'carb', l: 'الكارب الكلي (جم/يوم)', min: 20, max: 60, step: 5, def: 40 }, { k: 'pro', l: 'بروتين (جم/كجم)', min: 1, max: 1.6, step: 0.1, def: 1.3 }, { k: 'weeks', l: 'المدة الأولية (أسابيع)', min: 4, max: 12, step: 1, def: 12 }] },
    { id: 'lowcarb', n: 'كارب منخفض معتدل', sys: 'both', grade: 'strong', refs: ['johnston', 'mena', 'keto'],
      sum: 'كارب 26–40% من السعرات مع بروتين مرتفع نسبياً، بالاستغناء عن جزء من الأرز والخبز والحلويات لا كلها. نزوله مماثل لقليل الدهن في 12 شهراً، وفي تجارب المنطقة كان الأعلى قليلاً.',
      when: ['مقاومة إنسولين أو ما قبل السكري (مع قرار الطبيب)', 'من يعاني جوعاً مع الكارب العالي', 'محيط خصر كبير مع بقاء الحركة قليلة'],
      notFor: ['من يمارس رياضة عنيفة طويلة', 'الحمل والرضاعة', 'قصور الكلى'],
      pros: ['شبع جيد', 'أقل صعوبة اجتماعية من الكيتو', 'يحسّن سكر الدم عند كثيرين'], cons: ['يحتاج بدائل للأرز والخبز', 'إمساك إن قلّت الألياف'],
      eg: 'نصف رغيف بدل رغيف، أرز ملعقتان، فول بيض وسلطة، خضار مطبوخ بوفرة.', sa: 'ربع كوب أرز أو بدائل القرنبيط، لحم أو دجاج، سلطة، لبن.',
      par: [P_DEF, { k: 'cho', l: 'كارب % من السعرات', min: 26, max: 40, step: 1, def: 35 }, { k: 'pro', l: 'بروتين (جم/كجم)', min: 1.2, max: 2, step: 0.1, def: 1.4 }] },
    { id: 'dash', n: 'DASH (الضغط)', sys: 'ex', grade: 'strong', refs: ['dash'],
      sum: 'خضار وفاكهة وألبان قليلة الدسم وحبوب كاملة، مع تقليل الصوديوم (المخللات، الأجبان المالحة، المصنّع). الأقوى في خفض الضغط؛ والوزن متواضع.',
      when: ['ارتفاع ضغط الدم أو خطره', 'استهلاك مرتفع للمخلل والجبن المالح والمصنّع (شائع في مصر والسعودية)', 'عائلة فيها قلب أو سكتة'],
      notFor: ['قصور الكلى (البوتاسيوم) إلا بإشراف الطبيب'],
      pros: ['خفض ضغط موثّق', 'اقتصادي', 'متنوع'], cons: ['قد يبدو الطعام بلا طعم أول أسبوعين', 'ألبان قليلة الدسم قد لا تُفضَّل'],
      eg: 'جبنة قريش بدل الدمياطي، خضار طازج، ليمون وبهارات بدل الملح، تقليل المخلل.', sa: 'تقليل الأجبان المالحة والمخللات والمعجنات، لبن، فواكه وخضار.',
      par: [P_DEF, { k: 'pro', l: 'بروتين (جم/كجم)', min: 1, max: 1.6, step: 0.1, def: 1.2 }, { k: 'fat', l: 'دهون % من السعرات', min: 22, max: 32, step: 1, def: 27 }, { k: 'na', l: 'سقف الصوديوم (ملجم)', min: 1500, max: 2300, step: 100, def: 2300 }] },
    { id: 'lowfat', n: 'قليل الدهن / منخفض كثافة الطاقة', sys: 'ex', grade: 'mid', refs: ['johnston', 'mena'],
      sum: 'دهون 20–25% من السعرات مع أطعمة حجمية (شوربة، خضار، فاكهة، بقول) تُشبع بسعرات أقل، وتحديد الزيوت والقلي. نزوله مماثل لغيره في 12 شهراً.',
      when: ['دهون مرتفعة في النظام الحالي (قلي، سمن، زبدة)', 'من يشبع بالحجم الكبير', 'عائلة تحب الطبخ الخفيف'],
      notFor: ['من يعاني جوعاً مع الكارب العالي', 'من يحتاج دهوناً أعلى لأسباب طبية'],
      pros: ['حجم أكل كبير', 'سعرات أقل بلا إحساس بالحرمان', 'يخفض الدهون المشبعة'], cons: ['يحتاج طبخاً بلا قلي', 'قد يرفع الكارب البسيط إن لم تُنتقَ الأطعمة'],
      eg: 'طاجن خضار، شوربة عدس، دجاج مسلوق أو مشوي، فاكهة، حليب خالي الدسم.', sa: 'مرق بدل الدسم، دجاج مشوي بلا جلد، خضار على البخار، لبن قليل الدسم.',
      par: [P_DEF, { k: 'pro', l: 'بروتين (جم/كجم)', min: 1, max: 1.6, step: 0.1, def: 1.2 }, { k: 'fat', l: 'دهون % من السعرات', min: 18, max: 28, step: 1, def: 23 }] }
  ];
  DX.get = function (id) { return DX.LIST.filter(function (x) { return x.id === id; })[0] || null; };
  DX.defaults = function (id) { var d = DX.get(id), P = {}; (d ? d.par : []).forEach(function (p) { P[p.k] = p.def; }); return P; };
  DX.pnorm = function (id, P) { var d = DX.get(id), out = {}; P = P || {}; d.par.forEach(function (p) { var v = P[p.k]; if (p.type === 'sel') out[p.k] = p.opts.some(function (o) { return o[0] === v; }) ? v : p.def; else if (p.type === 'time') out[p.k] = /^\d\d:\d\d$/.test(String(v || '')) ? v : p.def; else { v = parseFloat(v); if (isNaN(v)) v = p.def; out[p.k] = Math.min(p.max, Math.max(p.min, v)); } }); return out; };
  // قواعد الأطعمة (تفضيل/تجنّب) تغذّي E.ctx عند وجود c.diet
  var RX = {
    friedSweet: /مقلي|مقلية|قلي|عصير|كنافة|بسبوسة|قطايف|آيس كريم|ايس كريم|حلوى|شوكولاتة|مشروب غازي|ببسي|كولا/,
    salty: /مخلل|زيتون|بسطرمة|سجق|مرتديلا|لانشون|نقانق|سلامي|جبنة رومي|دمياطي|جبنة حلوم|فيتا|بيضاء نعاج|ماجي|مرق مكعبات/,
    local: /فول|حمص|عدس|ملوخية|بامية|بلطي|بوري|كنعد|هامور|سردين|خبز بلدي|شعير|جرجير|سلطة|لبن رائب|زبادي|شوربة|قريش|لبنة|فريك|برغل/,
    medLove: /زيت زيتون|سمك|سلمون|سردين|تونة|عدس|حمص|فول|لوز|جوز|برغل|شوفان|خضار|سلطة|زبادي/
  };
  DX.foodRule = function (id, f) {
    var n = f.n || '', g = f.g;
    if (id === 'dash') { if (RX.salty.test(n)) return 'avoid'; return null; }
    if (id === 'lowfat') { if (g === 5 || g === 8 || RX.friedSweet.test(n) || /سمن|زبدة|قشطة|كريمة/.test(n)) return 'avoid'; return null; }
    if (id === 'mideast') { if (RX.friedSweet.test(n)) return 'avoid'; if (RX.local.test(n)) return 'love'; return null; }
    if (id === 'med') { if (RX.friedSweet.test(n) || g === 5) return 'avoid'; if (RX.medLove.test(n)) return 'love'; return null; }
    if (id === 'highpro') { if (RX.friedSweet.test(n)) return 'avoid'; return null; }
    if (id === 'keto' || id === 'lowcarb' || id === 'cycle') { return null; }
    return null;
  };
  // ----------------------------------------------------------------------------- الفحص السريري قبل التطبيق
  DX.CONFIRM = ['لا حمل ولا رضاعة', 'لا سكري على إنسولين أو أدوية تحتاج تعديلاً', 'لا اضطراب أكل حالي أو سابق', 'لا قصور كلى أو كبد أو مرض مرارة'];
  DX.screen = function (id, c, D) {
    var d = DX.get(id), stop = [], warn = [], conf = [], age = num(c.age), w = num(c.weight), h = num(c.height), bmi = w > 0 && h > 0 ? w / Math.pow(h / 100, 2) : 0, cond = c.conditions || [];
    if (bmi > 0 && bmi < 18.5) stop.push('BMI أقل من 18.5: لا يُطبَّق نظام لإنقاص الوزن');
    if (age > 0 && age < 18) stop.push('العمر أقل من 18: خارج نطاق هذه الأنظمة (يحتاج متابعة نمو)');
    if (age >= 65) warn.push('عمر 65+: يُفضَّل حفظ الكتلة العضلية (بروتين كافٍ) وتجنّب الصيام والكيتو إلا بإشراف');
    var risky = id === 'keto' || id === 'if';
    if (risky) conf = DX.CONFIRM.slice();
    if (id === 'cycle') conf = ['لا اضطراب أكل حالي أو سابق'];
    if (id === 'highpro') conf = ['لا قصور كلى معروف'];
    if (id === 'dash') warn.push('تأكد من عدم وجود قصور كلى (يرتفع البوتاسيوم)');
    if (has(cond, 'سكري النوع الثاني')) { if (risky || id === 'lowcarb') warn.push('سكري من النوع الثاني: قد تحتاج أدوية السكر تعديلاً مع الكارب المنخفض أو الصيام، بالتنسيق مع الطبيب'); }
    if (has(cond, 'مقاومة الإنسولين / ما قبل السكري') && id === 'cycle') warn.push('مقاومة الإنسولين: تذبذب الكارب بين الأيام قد لا يناسب، يُفضَّل كارب ثابت');
    if (has(cond, 'خمول الغدة')) warn.push('خمول الغدة: تأكد من انتظام العلاج والتحاليل، وتوقع بطء النزول');
    if (c.sex === 'أنثى' && (id === 'keto' || id === 'if')) warn.push('تأكد من عدم وجود حمل أو رضاعة قبل البدء');
    return { stop: stop, warn: warn, confirm: conf, d: d };
  };
  // ----------------------------------------------------------------------------- الطاقة
  var floorK = function (c) { return c.sex === 'ذكر' ? 1500 : 1200; };
  DX.energy = function (c, D, AD, deficit, E, A) {
    var tdee, bmi = 0, obese = false, adj = 0, bmr = 0;
    if (c.kind === 'athlete') {
      var T = A.targets(c, AD), s = 0; T.days.forEach(function (x) { s += x.tdee; }); tdee = s / T.days.length; bmr = T.bmr;
      var w = num(c.weight), h = num(c.height); bmi = w > 0 && h > 0 ? w / Math.pow(h / 100, 2) : 0; var ibw = (h - D.settings.ibw_off) * (c.sex === 'أنثى' ? D.settings.ibw_f : 1); adj = ibw + D.settings.adj * (w - ibw); obese = bmi >= 30;
    } else {
      var T0 = E.targets(Object.assign({}, c, { kcalManual: '', goal: D.settings.goals[2][0], kcalFloor: false, macroMode: 'auto_pf' }), D); tdee = T0.tdee; bmi = T0.bmi; obese = T0.obese; adj = T0.adjbw; bmr = T0.bmr;
    }
    var fl = floorK(c), maxDef = D.settings.max_def || 0.25, warns = [], dfc = deficit;
    if (dfc > tdee * maxDef) { dfc = Math.floor(tdee * maxDef / 50) * 50; warns.push('العجز المطلوب أكبر من ' + Math.round(maxDef * 100) + '% من احتياج الطاقة، خُفِّض إلى ' + dfc + ' سعرة'); }
    var kcal = r5(tdee - dfc);
    if (kcal < fl) { kcal = fl; warns.push('رُفعت السعرات إلى الحد الأدنى الآمن (' + fl + ')'); }
    if (kcal < bmr) warns.push('السعرات أقل من BMR (' + Math.round(bmr) + ')');
    return { tdee: tdee, kcal: kcal, deficit: Math.round(tdee - kcal), floor: fl, bmi: bmi, obese: obese, adj: adj, bmr: bmr, warns: warns };
  };
  // ----------------------------------------------------------------------------- التطبيق
  // يعيد { ok, patch, notes, warns, blocks, energy, P }؛ لا يعدّل العميل. DX.commit يطبّق الرقعة.
  var baseOf = function (id, P) { return id === 'if' ? P.base || 'balanced' : id; };
  DX.apply = function (id, c, P, D, AD, E, A) {
    var d = DX.get(id); if (!d) return { ok: false, blocks: ['نظام غير معروف'] };
    P = DX.pnorm(id, P); var sc = DX.screen(id, c, D), out = { ok: true, id: id, P: P, patch: {}, notes: [], warns: sc.warn.slice(), blocks: sc.stop.slice(), confirm: sc.confirm, sys: c.kind === 'athlete' ? 'ath' : 'ex' };
    if (d.sys === 'ath' && out.sys === 'ex') out.blocks.push('«' + d.n + '» يُنفَّذ بنظام الجرامات (دقة الماكروز)؛ أنشئ عميلاً بنظام الجرامات أو حوّل هذا العميل إليه');
    var base = d.id === 'if' ? DX.get(baseOf(id, P)) : d, BP = d.id === 'if' ? DX.pnorm(base.id, { deficit: P.deficit }) : P;
    if (out.blocks.length) { out.ok = false; return out; }
    var en = DX.energy(c, D, AD, P.deficit, E, A); out.energy = en; out.warns = out.warns.concat(en.warns);
    var pro = num(BP.pro, 1.2), fat = num(BP.fat, 28), cho = num(BP.cho, 0), patch = out.patch, K = en.kcal, adjW = en.obese ? en.adj : num(c.weight);
    var fastK = Math.max(400, num(P.fastK, 500)), fastDays = [1, 4], DN = D.days || ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    // سعرات الأسبوع = 7 × (الاحتياج − العجز)؛ في 5:2 تأخذ أيام الصيام fastK ويعوّض الباقي الفرق
    if (id === 'if' && P.pat === '52') {
      K = r5((7 * en.kcal - 2 * fastK) / 5);
      if (K > en.tdee * 1.05) { K = r5(en.tdee * 1.05); out.warns.push('العجز المطلوب لا يتحقق بيومي صيام فقط عند هذا الاحتياج؛ سيكون العجز الأسبوعي أقل من المطلوب'); }
      out.notes.push('يوما الصيام (' + fastDays.map(function (i) { return DN[i]; }).join(' و') + '): ' + fastK + ' سعرة، وبقية الأيام ' + K + ' سعرة');
    }
    if (out.sys === 'ex') {
      // نسب يدوية (manual) كي لا يعيد تعديل السمنة في المحرك توزيع الماكروز ضد النظام؛ البروتين على الوزن المعدّل للسمنة وبسقف 30%
      var proG = Math.min(pro * adjW, K * 0.3 / 4), proP = proG * 4 / K, fatP = d.id === 'lowcarb' ? Math.max(0.18, 1 - cho / 100 - proP) : fat / 100, choP = d.id === 'lowcarb' ? cho / 100 : 1 - proP - fatP;
      choP = Math.round(choP * 1000) / 1000; proP = Math.round(proP * 1000) / 1000; fatP = Math.round((1 - choP - proP) * 1000) / 1000;
      patch = { kcalManual: K, macroMode: 'manual', choPct: choP, proPct: proP, fatPct: fatP, proGkg: pro, proGkgOb: pro, dayCounts: null, baseCounts: null };
      if (id === 'if') { patch.meals = P.pat === 'tre' ? 3 : 4; } else if (!c.meals || +c.meals < 3) patch.meals = 4;
      out.patch = patch;
    } else {
      var w = num(c.weight), pv = Math.round(pro * adjW / w * 100) / 100, hi = K, lo = K, sched = JSON.parse(JSON.stringify(c.schedule || A.DEFAULT_SCHEDULE)), types = [];
      var norm = 'يوم عادي', hiT = 'يوم كارب مرتفع', loT = 'يوم كارب منخفض', fT = 'يوم صيام (5:2)';
      for (var i = 0; i < 7; i++) types.push(norm);
      var fG, fMode = 'pct', fVal;
      if (id === 'keto') { var carb = P.carb; fVal = Math.max(0, Math.round((K - pv * w * 4 - carb * 4) / K * 1000) / 10); out.notes.push('الكارب الكلي ' + carb + ' جم/يوم؛ الدهون الباقي (' + Math.round(fVal) + '% من السعرات). مدة أولية حتى ' + P.weeks + ' أسبوعاً ثم إعادة تقييم'); }
      else if (id === 'lowcarb') { fVal = Math.max(18, Math.round((100 - cho - (pv * w * 4 / K * 100)) * 10) / 10); }
      else if (id === 'cycle') {
        fMode = 'gkg'; fVal = P.fat; var hd = P.hiDays, loD = 7 - hd, h2 = Math.min(P.hi / 100, 8.75 / (7 + 0.25 * hd)), kl = Math.round((7 * K - hd * K * h2) / loD / 10) * 10; hi = Math.round(K * h2 / 10) * 10; lo = kl;
        var order = hd === 3 ? [0, 2, 4] : hd === 2 ? [1, 4] : [2]; types = []; for (var j = 0; j < 7; j++) types.push(order.indexOf(j) >= 0 ? hiT : loT);
        out.notes.push('أيام مرتفعة ' + hi + ' سعرة (' + hd + ' أيام)، ومنخفضة ' + lo + ' سعرة؛ متوسط الأسبوع ' + Math.round((hd * hi + loD * lo) / 7) + ' سعرة');
      } else { fVal = fat; }
      if (id === 'if' && P.pat === '52') { fastDays.forEach(function (ix) { types[ix] = fT; }); hi = K; lo = fastK; }
      patch = { macroMode: 'manual', pMode: 'gkg', pBase: 'weight', pVal: pv, fMode: fMode, fVal: fVal, kcalMode: 'fixed', kcalTrain: hi, kcalRest: lo, carbMethod: 'remainder' };
      sched = sched.map(function (s, ix) { return { type: types[ix], min: 0, time: s.time || '' }; }); patch.schedule = sched;
      var ph = A.phase(AD, c.phase); if (ph.adj >= 0) { patch.phase = 'إعادة تركيب الجسم'; out.notes.push('المرحلة كانت «' + ph.n + '»؛ ضُبطت على «إعادة تركيب الجسم» ليتسق النظام مع الإنقاص'); }
      out.patch = patch;
    }
    if (id === 'if' && P.pat === 'tre') {
      var s = P.start.split(':'), st = +s[0] * 60 + +s[1], m3 = [st, st + 210, st + 450], fmt = function (m) { m = ((m % 1440) + 1440) % 1440; return ('0' + Math.floor(m / 60)).slice(-2) + ':' + ('0' + m % 60).slice(-2); };
      out.window = { start: P.start, end: fmt(st + 480), times: m3.map(fmt) }; out.notes.push('نافذة الأكل ' + out.window.start + ' إلى ' + out.window.end + ' (8 ساعات): ثلاث وجبات ' + out.window.times.join(' • ') + '. الماء والقهوة والشاي بلا سكر مسموحة خارج النافذة');
      if (out.sys === 'ath') { var am = JSON.parse(JSON.stringify(c.athMeals || AD.meals)), want = [0, 2, 4]; am.forEach(function (m, ix) { var k = want.indexOf(ix); m.on = k >= 0; if (k >= 0) m.t = out.window.times[k]; }); out.patch.athMeals = am; }
    }
    if (id === 'if' && P.pat === '52') {
      out.fastDays = fastDays; out.fastK = fastK;
      if (out.sys === 'ath') { var am2 = JSON.parse(JSON.stringify(c.athMeals || AD.meals)), on = [0, 1, 2, 4], trainW = { 0: 0.3, 1: 0.1, 2: 0.35, 4: 0.25 }, restW = { 0: 0, 1: 0, 2: 0.5, 4: 0.5 }; am2.forEach(function (m, ix) { m.on = on.indexOf(ix) >= 0; if (m.on) { m.train = [trainW[ix], trainW[ix], trainW[ix]]; m.rest = [restW[ix], restW[ix], restW[ix]]; } }); out.patch.athMeals = am2; out.notes.push('يوم الصيام: وجبتان صغيرتان (الغداء والعشاء) بنحو ' + fastK + ' سعرة'); }
      else out.notes.push('يوما الصيام: وجبتان صغيرتان (الغداء والعشاء) من قوالب جاهزة بنحو 500 سعرة، قابلة للتعديل');
    }
    out.patch.diet = { id: id, P: P, sys: out.sys, at: Date.now(), window: out.window || null, fastDays: out.fastDays || null, fastK: out.fastK || null, kcal: K, tdee: Math.round(en.tdee) };
    return out;
  };
  DX.commit = function (c, res) { if (!res || !res.ok) return false; var p = res.patch; Object.keys(p).forEach(function (k) { if (p[k] === null && k !== 'diet') delete c[k]; else c[k] = p[k]; }); if (res.sys === 'ex') { delete c.dayCounts; delete c.baseCounts; } return true; };
  DX.clear = function (c) { delete c.diet; };
  // أيام الصيام 5:2 (نظام الحصص): عدّ خاص بكل يوم يُحسب بالمحرك على سعرات اليوم المخفضة
  DX.fastCounts = function (c, D, E) {
    var dd = c.diet; if (!dd || !dd.fastDays || dd.sys !== 'ex') return null; var out = {};
    dd.fastDays.forEach(function (ix) { var cc = Object.assign({}, c, { kcalManual: dd.fastK, proGkg: 1.2, proGkgOb: 1.2, macroMode: 'auto_pf', fatPct: 0.3 }), st = E.state(cc, D, {}), sc = E.capScale(st.T.kcal, st.T), cap = E.capTotals(ix, st.meals, D, sc), sol = E.solveDay(st.T, { cap: cap, sweets: 0, share: E.PREF.share }, D); out[ix] = sol.counts.slice(); });
    return out;
  };
  // بعد التوليد: يخزّن بيانات النظام في الخطة، ويضبط مواعيد الوجبات لنافذة الصيام
  DX.post = function (plan, c) {
    var dd = c.diet; if (!dd) return plan; var d = DX.get(dd.id); plan.diet = { id: dd.id, n: d ? d.n : dd.id, P: dd.P, window: dd.window, fastDays: dd.fastDays, fastK: dd.fastK, at: dd.at };
    if (dd.window && plan.days && plan.days[0] && plan.days[0].slots) plan.days.forEach(function (dy) { var act = dy.slots.filter(function (s) { return s.lines && s.lines.length; }); act.forEach(function (s, k) { s.time = dd.window.times[Math.min(k, 2)]; }); });
    return plan;
  };
  DX.generate = function (c, D, AD, E, A) {
    var dd = c.diet, plan;
    if (c.kind === 'athlete') plan = A.planWeek(c, AD);
    else {
      var fc = null; if (fc) { c.dayCounts = c.dayCounts || {}; Object.keys(fc).forEach(function (k) { c.dayCounts[k] = fc[k]; }); }
      plan = E.planWeek(c, D);
      if (fc) delete c.dayCounts;
      if (dd && dd.fastDays && dd.sys === 'ex') { dd.fastDays.forEach(function (ix) { DX.fastDay(plan, ix, c, D, E); }); plan.quality = E.planQuality(plan, D); }
    }
    return DX.post(plan, c);
  };
  // ----------------------------------------------------------------------------- يوم الصيام 5:2 (نظام الحصص): قوالب جاهزة بدل المحلّل (500 سعرة لا تتحمل مفروضات حلّال الحصص)
  var FAST_T = [
    { cz: 'both', L: [['دجاج مشوي بدون جلد', 4], ['سلطة خضراء (خيار وطماطم وخس)', 3], ['زيت زيتون', 1]], D: [['زبادي يوناني خالي الدسم', 1.5], ['تفاح', 1], ['خيار', 1]] },
    { cz: 'eg', L: [['سمك بلطي مشوي', 4], ['ملوخية مطبوخة', 2], ['سلطة خضراء (خيار وطماطم وخس)', 2], ['زيت زيتون', 1]], D: [['بيضة كاملة', 1.8], ['طماطم', 1], ['خيار', 1.5], ['عيش بلدي (خبز بلدي مصري)', 1]] },
    { cz: 'sa', L: [['تونة معلبة بالماء', 3], ['جرجير', 3], ['زيت زيتون', 1]], D: [['لبن رائب قليل الدسم', 1], ['برتقال', 1], ['كرفس', 1]] }
  ];
  DX.fastDay = function (plan, ix, c, D, E) {
    var dy = plan.days[ix]; if (!dy) return; var by = E.byName(D), k = (c.diet && c.diet.fastDays ? c.diet.fastDays.indexOf(ix) : 0), cz = c.cuisine || '';
    var pool = FAST_T.filter(function (t) { return t.cz === 'both' || !cz || t.cz === cz; }), tpl = pool[(k < 0 ? 0 : k) % pool.length];
    var L = dy.slots.filter(function (s) { return s.type === 'L'; })[0] || dy.slots[1], Dn = dy.slots.filter(function (s) { return s.type === 'D'; })[0] || dy.slots[dy.slots.length - 1];
    var mk = function (sl, items) { var lines = []; items.forEach(function (it) { var f = by[it[0]]; if (!f) return; var e = Math.round(it[1] * 2) / 2; if (f.us === 'بيضة') e = Math.max(1, Math.round(it[1] * f.upe)) / f.upe; lines.push({ g: f.g, name: f.n, e: e, text: E.lineText(f, e, c.alias), tier: 0, bank: false }); }); var o = Object.assign({}, sl, { lines: lines, meal: null }); return o; };
    dy.slots = [mk(L, tpl.L), mk(Dn, tpl.D)]; dy.fast = true; E.syncCounts(dy); E.dayStats(dy, plan.targets, D); return dy;
  };
  // ----------------------------------------------------------------------------- المدقّق
  DX.check = function (plan, c, D, AD, E, A) {
    var dd = c.diet, out = [], add = function (lvl, msg) { out.push({ lvl: lvl, msg: msg }); }; if (!dd) return out;
    var fastDays = dd.fastDays || [], P = dd.P || {}, id = dd.id, ath = c.kind === 'athlete', days = plan.days || [], w = num(c.weight);
    var rows = days.map(function (dy, i) {
      if (ath) { var g = dy.got || {}; return { i: i, fast: fastDays.indexOf(i) >= 0, k: g.k || 0, p: g.p || 0, c: g.c || 0, f: g.f || 0, fi: g.fi || 0, na: g.na || 0, tk: dy.t ? dy.t.kcal : 0 }; }
      var a = dy.nominal || [0, 0, 0]; return { i: i, fast: fastDays.indexOf(i) >= 0, k: a[0] * 4 + a[1] * 4 + a[2] * 9, p: a[1], c: a[0], f: a[2], fi: 0, na: 0, tk: plan.targets ? plan.targets.kcal : 0 };
    });
    var norm = rows.filter(function (r) { return !r.fast; }), pct = function (r, k) { return r.k > 0 ? (k === 'c' ? r.c * 4 : k === 'p' ? r.p * 4 : r.f * 9) / r.k * 100 : 0; };
    var avg = function (arr, f) { return arr.length ? arr.reduce(function (s, x) { return s + f(x); }, 0) / arr.length : 0; };
    rows.forEach(function (r) { var dv = r.tk > 0 ? (r.k - r.tk) / r.tk : 0; if (r.tk > 0 && !r.fast && (dv > 0.12 || dv < (id === 'keto' ? -0.2 : -0.12))) add('warn', 'سعرات ' + (days[r.i].name || 'اليوم ' + (r.i + 1)) + ' (' + Math.round(r.k) + ') تبعد أكثر من 12% عن الهدف (' + Math.round(r.tk) + ')'); });
    var fl = floorK(c); norm.forEach(function (r) { if (r.k > 0 && r.k < fl * 0.95) add('bad', (days[r.i].name || 'اليوم') + ': السعرات ' + Math.round(r.k) + ' أقل من الحد الآمن ' + fl); });
    var mp = avg(norm, function (r) { return pct(r, 'p'); }), mc = avg(norm, function (r) { return pct(r, 'c'); }), mf = avg(norm, function (r) { return pct(r, 'f'); }), mk = avg(norm, function (r) { return r.k; }), mpg = avg(norm, function (r) { return r.p; });
    var T = ath ? plan.T : plan.targets, adj = ath ? (DX.energy(c, D, AD, 0, E, A).adj) : (T && T.adjbw) || w, wr = (T && T.obese) || num(c.weight) / Math.pow(num(c.height) / 100, 2) >= 30 ? adj : w;
    if (mpg / wr < 1.0 - 0.02) add('warn', 'متوسط البروتين ' + mpg.toFixed(0) + ' جم أقل من 1.0 جم/كجم');
    var tol = 4;
    if (id === 'highpro' && mpg / wr < (P.pro || 1.6) - 0.2) add('warn', 'البروتين أقل من المطلوب للنظام (' + (mpg / wr).toFixed(2) + ' جم/كجم)');
    if (id === 'highpro' && mp > 32) add('warn', 'البروتين ' + mp.toFixed(0) + '% من السعرات (فوق 30%)');
    if ((id === 'balanced' || id === 'mideast' || id === 'med' || id === 'dash' || id === 'lowfat') && P.fat != null && Math.abs(mf - P.fat) > tol + 3) add('warn', 'دهون الخطة ' + mf.toFixed(0) + '% بعيدة عن نسبة النظام (' + P.fat + '%)');
    if (id === 'lowfat' && mf > 27) add('bad', 'دهون الخطة ' + mf.toFixed(0) + '% أعلى من حد قليل الدهن');
    if (id === 'lowcarb' && (mc > (P.cho || 35) + 6 || mc < 20)) add('warn', 'الكارب ' + mc.toFixed(0) + '% خارج نطاق النظام');
    if (id === 'keto') { norm.forEach(function (r) { if (r.c > (P.carb || 40) * 1.25 + 5) add('bad', (days[r.i].name || '') + ': الكارب ' + Math.round(r.c) + ' جم أعلى من حد الكيتو'); if (r.fi && r.fi < 10) add('info', (days[r.i].name || '') + ': الألياف ' + Math.round(r.fi) + ' جم قليلة (اهدف إلى 15 جم+ بخضار ورقية)'); }); }
    if (id === 'cycle') { var hiR = rows.filter(function (r) { return days[r.i] && /مرتفع/.test(days[r.i].type || ''); }), loR = rows.filter(function (r) { return days[r.i] && /منخفض/.test(days[r.i].type || ''); }); if (hiR.length && loR.length && avg(hiR, function (r) { return r.c; }) < avg(loR, function (r) { return r.c; }) * 1.25) add('warn', 'فرق الكارب بين الأيام المرتفعة والمنخفضة أقل من المتوقع'); }
    if (id === 'dash' && ath) { rows.forEach(function (r) { if (r.na && r.na > (P.na || 2300)) add('warn', (days[r.i].name || '') + ': الصوديوم ' + Math.round(r.na) + ' ملجم فوق السقف'); }); }
    if (!ath) {                                    // قيود الأصناف على مستوى الأسبوع (نظام الحصص)
      var by = E.byName(D), cnt = {}, fishDays = {}, legDays = {}, vegN = 0, nutsDays = {}; days.forEach(function (dy, di) { dy.slots.forEach(function (s) { s.lines.forEach(function (l) { if (l.missing) return; var f = by[l.name]; if (!f) return; var r = E.fmeta(f).r; cnt[r] = (cnt[r] || 0) + 1; if (r === 'fish') fishDays[di] = 1; if (r === 'leg') legDays[di] = 1; if (r === 'nuts') nutsDays[di] = 1; if (l.g === 9) vegN += l.e; }); }); });
      var fishW = Object.keys(fishDays).length, legW = Object.keys(legDays).length, vegAvg = vegN / 7;
      if (id === 'med' || id === 'mideast') { if (fishW < 2) add('warn', 'السمك ' + fishW + ' مرة في الأسبوع (المستهدف ≥ 2)'); if (legW < 3) add('warn', 'البقوليات ' + legW + ' أيام (المستهدف ≥ 3)'); }
      if (id === 'dash' && vegAvg < 4) add('warn', 'الخضار ' + vegAvg.toFixed(1) + ' حصة يومياً (المستهدف ≥ 4)');
      if (id === 'lowfat' && (cnt.proc || 0) > 0) add('warn', 'لحوم مصنّعة في خطة قليلة الدهن');
      if ((cnt.juice || 0) > 3) add('warn', 'عصائر كثيرة في الأسبوع');
      var q = plan.quality; if (q && q.hard) add('bad', 'مخالفات صارمة في تركيب الوجبات: ' + q.hard + ' (راجع تبويب الجودة)');
    }
    if (dd.window && days.length) days.forEach(function (dy) { /* مواعيد الوجبات تُضبط في post */ });
    if (dd.fastDays) dd.fastDays.forEach(function (ix) { var r = rows[ix]; if (r && r.k > 0 && Math.abs(r.k - dd.fastK) > dd.fastK * 0.3) add('warn', 'يوم الصيام ' + (days[ix].name || '') + ': ' + Math.round(r.k) + ' سعرة مقابل ' + dd.fastK + ' المطلوبة' + (ath ? ' (وجبتان بكميات واقعية لا تنزلان عادةً عن نحو 650)' : '')); });
    return out;
  };
  // ----------------------------------------------------------------------------- تشكيل الأسبوع (نظام الحصص): خضار DASH، بقوليات ثلاثة أيام، سمك يومان
  var FISH_DAYS = [1, 4], LEG_DAYS = [0, 2, 5];
  var eff = function (dd) { return dd && dd.id === 'if' ? (dd.P && dd.P.base) || 'balanced' : dd && dd.id; };
  DX.dietBase = function (dd) { return eff(dd) === 'dash' ? { v: 4, f: 3, m: 2, e: 2 } : undefined; };
  DX.dietBoost = function (dd, d, t, role) { var id = eff(dd); if (id !== 'med' && id !== 'mideast') return 0; if (role === 'fish') return (t === 'L' || t === 'D') && FISH_DAYS.indexOf(d) >= 0 ? 9 : (t === 'L' ? -2.5 : 0); return 0; };
  DX.dietShape = function (dd, d, sol) {
    var id = eff(dd); if ((id !== 'med' && id !== 'mideast') || LEG_DAYS.indexOf(d) < 0) return null; var cn = sol.counts.slice();
    var tot = cn.reduce(function (a, x) { return a + x; }, 0); if (tot > 36) return null;                  // أيام السعرات الكبيرة: لا نزيد عدد الأصناف في الوجبة
    if (cn[0] >= 1 && cn[1] < 2) { cn[0] -= 1; cn[1] += 1; } else return null;
    return Object.assign({}, sol, { counts: cn });
  };
  // ----------------------------------------------------------------------------- قوائم الأطعمة لنظام الجرامات (تُحقن في Ath.dietTags/dietAllow)
  var T_KETO = {
    protMain: ['سلمون', 'فخذ دجاج', 'لحم بقري مفروم 80/20', 'لحم بقري مفروم 90', 'لحم غنم', 'ستيك بقري', 'سردين', 'تونة معلبة بالزيت', 'بيض كامل مسلوق', 'روبيان', 'بلطي', 'صدر دجاج', 'سمك قد'],
    protB: ['بيض كامل مسلوق', 'جبنة موزاريلا', 'جبنة شيدر', 'جبنة قريش', 'تونة معلبة بالزيت', 'سردين معلب', 'بروتين مصل'],
    protS1: ['جبنة موزاريلا', 'جبنة قريش', 'بيض كامل مسلوق', 'بروتين مصل', 'تونة معلبة بالماء'], protS2: ['جبنة موزاريلا', 'بيض كامل مسلوق', 'بروتين مصل', 'تونة معلبة بالماء'], protN: ['جبنة قريش', 'بروتين مصل', 'جبنة موزاريلا'],
    carbB: [], carbMain: [], carbS1: [], carbS2: [], carbN: [],
    fatB: ['زيت زيتون', 'لوز', 'جوز', 'أفوكادو', 'زبدة (مملحة)', 'سمن', 'زيتون أسود', 'طحينة'], fatMain: ['زيت زيتون', 'أفوكادو', 'زبدة (مملحة)', 'سمن', 'طحينة', 'لوز', 'زيتون أسود', 'جوز'], fatS: ['لوز', 'جوز', 'زيتون أسود', 'أفوكادو'], fatN: ['لوز', 'جوز']
  };
  var T_LOWCARB = {
    carbMain: ['عدس مسلوق', 'حمص مسلوق', 'فاصوليا', 'فول (حب)', 'لوبيا', 'كينوا', 'برغل مطبوخ', 'بطاطا حلوة'],
    carbB: ['شوفان جاف', 'شوفان مطبوخ', 'فول (حب)', 'خبز قمح كامل', 'تفاح', 'توت أزرق', 'فراولة', 'كيوي'], carbS1: ['تفاح', 'توت أزرق', 'فراولة', 'كمثرى', 'برتقال', 'كيوي'], carbS2: ['تفاح', 'توت أزرق', 'فراولة', 'كمثرى', 'برتقال', 'كيوي'], carbN: ['تفاح', 'فراولة']
  };
  DX.dietTags = function (dd) { var id = dd && dd.id === 'if' ? (dd.P && dd.P.base) || 'balanced' : dd && dd.id; return id === 'keto' ? T_KETO : id === 'lowcarb' ? T_LOWCARB : null; };
  DX.dietAllow = function (dd, f) {
    var id = dd && dd.id === 'if' ? (dd.P && dd.P.base) || 'balanced' : dd && dd.id, n = f.n || '';
    if (id === 'keto') { if (f.g === 'خضروات' || f.role === 'v') return (f.c || 0) <= 5.5; return f.role === 'p' || f.role === 'f'; }
    if (id === 'lowcarb') return !/كشري|أرز كبسة|جريش|شوربة عدس/.test(n);
    return true;
  };
  // ----------------------------------------------------------------------------- مشاكل الأخصائي العشر
  DX.PROBLEMS = [
    { id: 'plateau', n: 'ثبات الوزن', ask: ['هل الوزن ثابت 3 أسابيع أو أكثر رغم الالتزام؟', 'هل القياس بنفس الميزان والتوقيت؟', 'هل تغيّر قياس الخصر أو المقاسات؟'], rec: ['highpro', 'cycle'],
      why: 'التكيّف الحراري حقيقي لكن حجمه محدود؛ في أغلب الحالات يكون السبب انحراف الالتزام أو قياس غير دقيق أو انخفاض الاحتياج بعد نقص الوزن، فنبدأ بالتحقق ثم بإعادة حساب الاحتياج.',
      steps: ['نتحقق من الالتزام (سجل غذاء 3 أيام) وطريقة القياس', 'نعيد حساب الاحتياج بالوزن الحالي (يقلّ الاحتياج بنقص الوزن)', 'نرفع البروتين إلى 1.6 جم/كجم (شبع وحفظ كتلة)', 'نضيف 1500–2000 خطوة يومياً', 'اختياري بقرار الأخصائي: أسبوعان استراحة عند الصيانة (diet break) ثم عودة للعجز — دليلها محدود'],
      fix: function (c, D, AD, E, A) { return { dietId: 'highpro', P: { deficit: 400, pro: 1.6 }, extra: ['لا تُخفَّض السعرات أكثر؛ المشكلة غالباً في الالتزام أو القياس'], tip: 'بعد التطبيق راجع الوزن بعد 3 أسابيع' }; } },
    { id: 'hunger', n: 'جوع شديد وضعف الشبع', ask: ['هل يتخطى الفطور أو يؤخر الوجبات؟', 'هل الألياف قليلة والخضار أقل من 3 حصص؟', 'هل يشرب الماء بكميات كافية؟'], rec: ['highpro', 'lowfat'],
      why: 'الجوع غالباً من قلة البروتين والألياف والحجم أو من ترك وجبات ثم الإفراط لاحقاً.',
      steps: ['نرفع البروتين 1.6 جم/كجم ونوزعه على 4 وجبات', 'نضمن خضاراً أو سلطة في كل وجبة رئيسية', 'نزيد الشوربة والفاكهة الكاملة بدل العصير', 'نقلل العجز إلى 400 سعرة إن كان أكبر'],
      fix: function () { return { dietId: 'highpro', P: { deficit: 400, pro: 1.6 }, extra: ['4 وجبات على الأقل', 'خضار في كل وجبة رئيسية'], meals: 4 }; } },
    { id: 'night', n: 'الأكل الليلي والعاطفي', ask: ['هل يأكل ليلاً بعد العشاء؟', 'هل يرتبط بالتوتر أو الملل؟', 'هل ينام متأخراً؟'], rec: ['highpro', 'if'],
      why: 'هذا نمط سلوكي: يخفّفه عشاء كافٍ بالبروتين، ووجبة خفيفة مخطّطة قبل النوم بدل المنع المطلق. إن كان نوبات إفراط متكررة فهذا يتطلب تقييماً نفسياً قبل أي نظام صارم.',
      steps: ['عشاء بالبروتين والألياف 25–30 جم بروتين', 'سناك مخطط مساءً (زبادي، فاكهة، قريش) بدل الأكل العشوائي', 'نافذة أكل تنتهي قبل النوم بساعتين إن ناسبه', 'إحالة لمختص إن وُجدت نوبات إفراط متكررة'],
      fix: function () { return { dietId: 'highpro', P: { deficit: 400, pro: 1.5 }, extra: ['سناك مسائي مخطط ضمن السعرات'], meals: 5, warn: 'نوبات الإفراط المتكررة تحتاج تقييماً متخصصاً ولا يعالجها نظام غذائي' }; } },
    { id: 'weekend', n: 'الولائم وعطلة نهاية الأسبوع', ask: ['هل يلتزم أيام الأسبوع ثم يتجاوز في الإجازة؟', 'هل لديه ولائم أسبوعية ثابتة (غداء الجمعة)؟'], rec: ['cycle', 'balanced'],
      why: 'المهم المتوسط الأسبوعي. نخصص يوماً أو يومين أعلى سعرات مخططين بدل منع الولائم.',
      steps: ['نحدد ميزانية الأسبوع (7 × السعرات)', 'أيام العطلة أعلى 10–15% مخططة مسبقاً', 'يبقى البروتين والخضار ثابتين، وتُخفَّض الأيام العادية قليلاً', 'قواعد الوليمة: طبق واحد، النصف خضار وبروتين، ثم الحلوى باتفاق'],
      fix: function () { return { dietId: 'cycle', P: { deficit: 450, pro: 1.5, hi: 110, hiDays: 2 }, extra: ['اليومان المرتفعان يوافقان أيام الولائم (عدّلهما حسب جدول العميل)'] }; } },
    { id: 'muscle', n: 'فقدان الكتلة العضلية وضعف الطاقة', ask: ['هل النزول سريع (أكثر من 1% من الوزن أسبوعياً)؟', 'هل يشعر بإرهاق أو ضعف أداء؟', 'هل يمارس تمارين مقاومة؟'], rec: ['highpro'],
      why: 'العجز الكبير والبروتين القليل وغياب التمرين يزيدان خسارة العضل. الحل: عجز أصغر وبروتين أعلى وتمرين مقاومة.',
      steps: ['نخفض العجز إلى 300–400 سعرة', 'نرفع البروتين إلى 1.6–2.0 جم/كجم', 'ندرج تمرين مقاومة 2–3 مرات أسبوعياً', 'نراجع الطاقة المتاحة وقياس الخصر بدل الميزان فقط'],
      fix: function () { return { dietId: 'highpro', P: { deficit: 300, pro: 1.8 }, extra: ['تمرين مقاومة 2–3 مرات أسبوعياً'] }; } },
    { id: 'lowcarbSide', n: 'إمساك وإرهاق على الكارب المنخفض', ask: ['هل بدأ منذ أول أسبوعين على كارب منخفض؟', 'هل يشرب ماءً وأملاحاً كافية؟', 'هل الألياف أقل من 15 جم؟'], rec: ['lowcarb', 'med'],
      why: 'غالباً من قلة الألياف والسوائل والصوديوم في الأسابيع الأولى. نرفع الكارب تدريجياً إلى مستوى معتدل ونزيد الألياف.',
      steps: ['ننتقل من كيتو إلى كارب منخفض معتدل (30–35%)', 'ألياف من خضار وبقول وشوفان', '2–3 لتر سوائل ورشة ملح إضافية إن لم يوجد ضغط', 'نراجع الدواء إن وُجد سكري أو ضغط'],
      fix: function () { return { dietId: 'lowcarb', P: { deficit: 400, cho: 35, pro: 1.4 }, extra: ['زد الألياف إلى 25 جم+'] }; } },
    { id: 'insulin', n: 'مقاومة الإنسولين وتكيس المبايض وما قبل السكري', ask: ['هل شُخّصت مقاومة إنسولين أو تكيس مبايض أو ما قبل السكري؟', 'هل يتناول أدوية (ميتفورمين وغيره)؟', 'هل لديه تحاليل حديثة؟'], rec: ['lowcarb', 'med', 'mideast'],
      why: 'الدليل يدعم عموماً نمط كارب مضبوط الجودة وموزّعاً على اليوم وبروتيناً كافياً؛ القرار الدوائي للطبيب والأخصائي ينسّق معه.',
      steps: ['نخفض الكارب إلى 30–40% مع كارب معقد وألياف', 'نوزع الكارب على اليوم ونجنب السكريات والعصائر', 'نمشي 10–15 دقيقة بعد الوجبات', 'ننسّق مع الطبيب إن كان على أدوية'],
      fix: function () { return { dietId: 'lowcarb', P: { deficit: 400, cho: 38, pro: 1.4 }, extra: ['مشي بعد الوجبات'], warn: 'قرار سريري: اعتمد الأرقام بعد مراجعة التحاليل والطبيب' }; } },
    { id: 'time', n: 'ضيق الوقت وقلة الطبخ', ask: ['كم يطبخ في الأسبوع؟', 'هل يأكل خارج البيت يومياً؟', 'هل الميزانية محدودة؟'], rec: ['balanced', 'mideast'],
      why: 'الخطة المعقدة لا تُنفَّذ. نبسّط الأصناف والتحضير ونعتمد وجبات ثابتة متكررة وبدائل جاهزة.',
      steps: ['نضبط نمط الحياة على «تحضير سريع» ونقلل عدد الأصناف', 'وجبات متكررة ثابتة (فول، بيض، قريش، علب تونة، دجاج مشوي)', '3–4 وجبات بدل 6', 'قائمة وجبات خارج البيت (مطعم/سريعة) بحدود'],
      fix: function () { return { dietId: 'balanced', P: { deficit: 450, pro: 1.3 }, extra: [], meals: 4, life: 'quick', budget: 1 }; } },
    { id: 'rebound', n: 'الارتداد بعد الحمية وتثبيت الوزن', ask: ['هل وصل لوزنه المستهدف؟', 'هل بدأ الوزن يرجع؟', 'ما العادات التي توقفت؟'], rec: ['med', 'mideast'],
      why: 'التثبيت مرحلة بحد ذاتها: نرفع السعرات تدريجياً إلى الصيانة ونثبّت العادات ونتابع الوزن أسبوعياً.',
      steps: ['نرفع 100–200 سعرة كل أسبوعين حتى الصيانة', 'نحافظ على البروتين والخطوات والوزن الأسبوعي', 'نضع حدوداً للتدخل: زيادة 2 كجم تعيد العجز المؤقت', 'نطيل فترات المتابعة تدريجياً'],
      fix: function () { return { dietId: 'med', P: { deficit: 250, pro: 1.2 }, extra: ['زد 100–200 سعرة كل أسبوعين حتى الصيانة'], maintain: true }; } },
    { id: 'pressure', n: 'ارتفاع الضغط والصوديوم', ask: ['هل ضغطه مرتفع أو على أدوية ضغط؟', 'هل يكثر من المخلل والأجبان المالحة والمصنّع؟', 'هل يأكل خارج البيت كثيراً؟'], rec: ['dash', 'med'],
      why: 'DASH الأقوى لخفض الضغط، والتقليل من الصوديوم (المخلل، الجبن المالح، المصنّع، المرق المكعب) مهم جداً في مصر والسعودية.',
      steps: ['نطبق DASH بسقف صوديوم 2300 (أو 1500 بقرار الطبيب)', 'نستبدل الجبن المالح بالقريش والمخلل بالسلطة', 'فاكهة وخضار وألبان قليلة الدسم', 'قياس الضغط دورياً والتنسيق مع الطبيب'],
      fix: function () { return { dietId: 'dash', P: { deficit: 400, na: 2300 }, extra: ['استبدل المخلل والجبن المالح بالخضار الطازج'], warn: 'تعديل الدواء قرار الطبيب' }; } }
  ];
  DX.problem = function (id) { return DX.PROBLEMS.filter(function (x) { return x.id === id; })[0] || null; };
  DX.solve = function (pid, c, D, AD, E, A) { var p = DX.problem(pid); if (!p) return null; var f = p.fix(c, D, AD, E, A), d = DX.get(f.dietId); if (d && d.sys === 'ath' && c.kind !== 'athlete') { var alt = DX.get(p.rec.filter(function (r) { return DX.get(r).sys === 'ex'; })[0] || 'balanced'); f = Object.assign({}, f, { dietId: alt.id, P: Object.assign({ deficit: f.P.deficit, pro: f.P.pro }, {}), extra: (f.extra || []).concat(['حُوِّل إلى «' + alt.n + '» لأن العميل بنظام الحصص']) }); }
    return f; };
  var hook = function (E, A) { if (E) { E.dietRule = DX.foodRule; E.dietBase = DX.dietBase; E.dietBoost = DX.dietBoost; E.dietShape = DX.dietShape; } if (A) { A.dietTags = DX.dietTags; A.dietAllow = DX.dietAllow; } };
  if (typeof module !== 'undefined' && module.exports) { module.exports = DX; try { hook(require('./engine.js'), require('./athlete.js')); } catch (e) {} } else { root.DX = DX; hook(root.DPEngine, root.Ath); }
})(typeof window !== 'undefined' ? window : globalThis);
