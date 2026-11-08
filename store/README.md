# نشر «القرآن والسنة TV» على Google Play

كل ما تحتاجه لصفحة التطبيق في Google Play Console موجود هنا. انسخ النصوص كما هي.

## الملفات

| الملف | أين يُرفع في Play Console |
|---|---|
| `QuranSunnah-TV.aab` (من صفحة التنزيلات: releases/tag/app) | Release → Create new release |
| `../icon-512.png` | App icon (512×512) |
| `feature-graphic.png` | Feature graphic (1024×500) |
| `phone-tv.png`, `phone-radio.png`, `phone-reciters.png`, `phone-lectures.png`, `phone-hadith.png` | Phone screenshots |

رابط سياسة الخصوصية: https://bmeshary-crypto.github.io/quran/privacy.html

## نصوص صفحة المتجر (Main store listing)

**اسم التطبيق (30 حرفًا كحد أقصى):**
القرآن والسنة TV

**الوصف المختصر (80 حرفًا كحد أقصى):**
قنوات وإذاعات القرآن، تلاوات القرّاء، محاضرات العلماء والأحاديث النبوية

**الوصف الكامل:**

القرآن والسنة TV تطبيق مجاني بلا إعلانات، يجمع لك في مكان واحد:

📺 قنوات القرآن والسنة: قناة القرآن الكريم وقناة السنة النبوية من السعودية، وقنوات قرآنية ودعوية أخرى، بثًا مباشرًا.

📻 إذاعات القرآن: أكثر من 130 إذاعة لتلاوات القرّاء والأذكار والرقية، تُفحص بانتظام ليبقى ما يعمل فقط.

🎙️ تلاوات القرّاء: أكثر من 240 قارئًا بمختلف الروايات، مع الاستماع للسورة كاملة والانتقال تلقائيًا للسورة التالية.

🎓 محاضرات العلماء: دروس ومحاضرات الشيخ ابن باز، والشيخ ابن عثيمين، والشيخ الألباني، والشيخ أبي إسحاق الحويني، والشيخ محمد حسان، والشيخ محمد حسين يعقوب، وغيرهم من علماء أهل السنة، وشروح الأربعين النووية والسيرة النبوية. تُحدَّث يوميًا.

📜 الأحاديث النبوية: صحيح البخاري، وصحيح مسلم، والسنن الأربع، والموطأ، والأربعون النووية وغيرها، مع البحث داخل كل كتاب، وحديث جديد كل يوم.

⭐ المفضلة: احفظ قنواتك وإذاعاتك وقرّاءك المفضلين للوصول السريع.

بدون تسجيل، وبدون إعلانات، ولا يجمع أي بيانات عنك.

إعداد وبرمجة المهندس / مصطفى عوض السيد — صدقة جارية عني وعن والدي ووالدتي.

## إعدادات التطبيق (App content)

**Category (الفئة):** Books & Reference أو Lifestyle (الأنسب: Books & Reference)

**Privacy policy:** الرابط أعلاه.

**Ads:** No, my app does not contain ads.

**App access:** All functionality is available without special access.

**Target audience:** اختر 13+ (13–15، 16–17، 18+). لا تختر أعمار أقل من 13، لأنها تفرض شروط "Families" إضافية على محتوى يوتيوب المضمّن.

**Content rating (استبيان التصنيف):**
- Category: Reference, News, or Educational
- Violence / Sexuality / Language / Drugs: No لكل الأسئلة
- User-generated content / users can interact: No
- Shares location: No
- Digital purchases: No
- النتيجة المتوقعة: Everyone / 3+

**Data safety (أمان البيانات):**
- Does your app collect or share any of the required user data types? **No**
- Is all of the user data collected by your app encrypted in transit? **Yes**
- Do you provide a way for users to request that their data is deleted? **No** (لا توجد بيانات لدينا أصلًا)

**Government apps:** No. **Financial features:** None. **Health:** None. **News app:** No.

## الاختبار المغلق (للحسابات الشخصية الجديدة)

1. Testing → Closed testing → Create track، ارفع ملف `.aab`.
2. أضف بريد 12 شخصًا على الأقل (أصدقاء أو أقارب لديهم أندرويد) وأرسل لهم رابط الانضمام.
3. يجب أن يبقى الـ12 مشتركين 14 يومًا متواصلة.
4. بعدها اضغط Apply for production، وأجب عن أسئلة الاختبار القصيرة، وتراجع Google الطلب خلال أيام.

## مفتاح التوقيع

ملف `.aab` موقّع بـ"مفتاح الرفع" (upload key). عند أول رفع اختر **Use Google-generated key** (Play App Signing)، وGoogle تحفظ مفتاح التوقيع النهائي. لو ضاع مفتاح الرفع يمكن طلب استبداله من Google دون خسارة التطبيق.

## تحديثات لاحقة

عند أي تعديل على التطبيق: ارفع `versionCode` في `android/app/build.gradle` بواحد، وادفع التعديل، فيُبنى `.aab` جديد تلقائيًا في صفحة التنزيلات. ارفعه في Play Console كإصدار جديد.
القوائم (المحاضرات، الإذاعات، القنوات) تتحدث من الموقع مباشرة، ولا تحتاج إصدارًا جديدًا.
