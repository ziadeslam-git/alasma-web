# Spike F1.1: الدخول والتجديد والخروج بين Next.js والـ API الحقيقي (ADR-18)

التاريخ: 2026-10-20. التجربة على الجهاز المحلي: `next dev` على المنفذ 3000، والـ API الحقيقي (Development، قاعدة LocalDB) على المنفذ 5290، ومتصفح Chromium حقيقي عبر Playwright. السكربت في مجلد مؤقت خارج المستودع، والكلمات السرية عشوائية ومؤقتة في الذاكرة فقط.

## السؤال

هل يعمل `login` و`refresh` و`logout` بشكل موثوق من Next.js في الوضعين اللذين يسمح بهما ADR-18، وأيهما نختار؟

- **Mode A (same-origin proxy):** المتصفح يكلّم `http://localhost:3000/api/v1/...` وNext يعيد التوجيه (`rewrites`) إلى الـ API.
- **Mode B (direct cross-origin):** المتصفح على `http://localhost:3000` يكلّم الـ API على منفذه مباشرة مع `credentials: 'include'`.

## الإعداد الذي وُجد في الباك إند

| البند                                    | القيمة                                                                                                                                        |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `Cors:AllowedOrigins` (Development)      | `http://localhost:3000` فقط                                                                                                                   |
| `AppLinks:FrontendBaseUrl` (Development) | `http://localhost:3000`                                                                                                                       |
| اسم الـ cookie                           | `alasma_rt` (قابل للتغيير بـ `RefreshCookie:CookieName`)                                                                                      |
| خصائص الـ cookie                         | `HttpOnly; Secure; SameSite=Lax` (قابلة للتغيير بـ `RefreshCookie:SameSite`)؛ `Path=/api/v1/auth`؛ بلا `Domain` (host-only)؛ تنتهي بعد 7 أيام |
| حارس الـ Origin                          | على `refresh` و`logout`: يقارن scheme وhost وport بقائمة `AllowedOrigins`، ويرفض الطلب بلا `Origin`                                           |
| الـ access token                         | 5 دقائق، في جسم الرد فقط                                                                                                                      |
| Lockout                                  | 5 محاولات فاشلة، قفل 15 دقيقة                                                                                                                 |
| Rate limit للدخول                        | 5 طلبات في الدقيقة لكل IP في الإنتاج (الإعداد المحلي 1000، فلم يظهر في التجربة)                                                               |

## النتائج لكل فحص ولكل وضع

| #   | الفحص                                                               | Mode A (proxy)                                                                                                                                                                            | Mode B (مباشر)                                                     |
| --- | ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| a   | Login                                                               | 200، `accessToken` في الجسم. الـ cookie في المتصفح: `domain=localhost`، `path=/api/v1/auth`، `httpOnly=true`، `secure=true`، `sameSite=Lax`، تنتهي بعد 7 أيام. `document.cookie` لا يراها | نفس النتيجة والسمات تمامًا                                         |
| a   | الـ `Set-Cookie` الخام                                              | يمرّ عبر الـ proxy كما هو (بلا `Domain`)                                                                                                                                                  | كما أرسله الـ API                                                  |
| b   | Refresh بعد فتح صفحة جديدة                                          | 200، الـ cookie تدوّرت (قيمة جديدة)، و`GET /me` بالـ token الجديد = 200                                                                                                                   | 200، تدوير، و`GET /me` = 200                                       |
| c   | Refresh بلا `Origin`                                                | 403 `auth_origin_not_allowed`                                                                                                                                                             | 403 نفسه                                                           |
| c   | Refresh بـ `Origin: http://evil.example` أو `http://localhost:3001` | 403 `auth_origin_not_allowed`                                                                                                                                                             | 403 نفسه                                                           |
| d   | Logout                                                              | 204، الـ cookie اختفت من المتصفح، وRefresh بعدها = 401 `auth_refresh_invalid`                                                                                                             | نفس النتيجة                                                        |
| e   | إعادة استخدام token قديم بعد التدوير                                | 401 `auth_refresh_invalid`، وبعدها حتى الـ token الجديد يفشل 401: كل جلسات المستخدم أُلغيت (ADR-16 مؤكد). الـ access token القديم يظل صالحًا حتى انتهاء الـ 5 دقائق                       | نفس النتيجة                                                        |
| f   | 5 طلبات refresh متوازية من صفحة واحدة                               | واحد فقط 200 والأربعة الباقية 401. بعد الانتهاء **اختفت الـ cookie من المتصفح** وأي refresh لاحق = 401                                                                                    | واحد فقط 200 (ترتيب مختلف) والباقي 401، وانتهت الجلسة بنفس الطريقة |
| h   | CORS                                                                | غير مطلوب (same-origin)                                                                                                                                                                   | انظر الجدول التالي                                                 |
| i   | `Secure` على `http://localhost`                                     | Chromium قبل الـ cookie وأرسلها مع الطلبات التالية                                                                                                                                        | نفس النتيجة                                                        |

### CORS في Mode B

| الطلب                                | النتيجة                                                                                                                                                                                                                        |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Preflight من `http://localhost:3000` | 204، `Access-Control-Allow-Origin: http://localhost:3000`، `Allow-Credentials: true`، `Allow-Methods: GET,POST,PUT,PATCH,DELETE`، `Allow-Headers: Authorization,Content-Type,Idempotency-Key,X-Correlation-Id`، `Max-Age: 600` |
| Preflight من `http://evil.example`   | 204 بلا أي رؤوس CORS، فيحجبه المتصفح                                                                                                                                                                                           |
| الرد الفعلي (حتى عند 401)            | يحمل `Allow-Origin` و`Allow-Credentials` و`Expose-Headers: X-Correlation-Id`. **لا يحمل `Retry-After`**                                                                                                                        |

### الدخول بكلمة مرور خاطئة (g)

- بريد غير موجود: 401 `auth_invalid_credentials` بنفس الرسالة تمامًا، فلا يمكن معرفة وجود الحساب.
- 6 محاولات خاطئة على مستخدم واحد: كلها 401 `auth_invalid_credentials`، لا يتغير الرمز ولا الرسالة.
- بعد الـ 5 محاولات، **كلمة المرور الصحيحة** ترجع أيضًا 401 بنفس الرسالة: القفل (15 دقيقة) موجود فعلًا لكن غير مميّز في الرد، ولا يوجد `Retry-After`.

### ما الذي يراه سيرفر Next (الفحص 3)

أُخذت الرؤوس الفعلية التي أرسلها Chromium، لكل وضع بعد تسجيل الدخول:

| الطلب                                           | هل أُرسلت `alasma_rt`؟      |
| ----------------------------------------------- | --------------------------- |
| `GET http://localhost:3000/` (تنقّل لصفحة Next) | لا (في الوضعين)             |
| `GET /api/v1/me` و`GET /api/v1/ping`            | لا                          |
| `POST /api/v1/auth/refresh`                     | نعم، لكن هذا الطلب نفسه فقط |

السبب: `Path=/api/v1/auth` فلا يرسل المتصفح الـ cookie إلا لمسارات `/api/v1/auth/*`. إذن Server Components وmiddleware في Next **لا يرون الـ cookie أبدًا** لأي صفحة. في Mode A يمرّ بها طلب `/api/v1/auth/*` عبر طبقة الـ rewrite فقط (لا عبر كود التطبيق). في Mode B لا يمرّ شيء منها عبر Next أصلًا. النتيجة: لا حماية Route على السيرفر، والصفحات الخاصة Client-rendered، والأمان الحقيقي في الـ API (كما في الـ Architecture).

## القرار

1. **التطوير: Mode A.** الطلبات تذهب إلى `/api/v1/*` على أصل Next، و`next.config.ts` يعيد توجيهها إلى `API_ORIGIN`. لا CORS ولا preflight، والـ `Origin` يطابق `AllowedOrigins` تلقائيًا. هذا هو الوضع الذي يستخدمه `createBrowserClient` افتراضيًا (`baseUrl` = أصل الصفحة).
2. **الإنتاج: نفس الفكرة (طلبات الـ API من نفس أصل الموقع)** بأحد شكلين، والأفضل الأول:
   - دومين واحد، وreverse proxy (Nginx أو Cloudflare أو غيره) يرسل `/api/v1/*` إلى الـ API وباقي المسارات إلى Next. يعمل `SameSite=Lax` بلا أي إعداد إضافي ولا يحتاج CORS.
   - دومينان من نفس الـ registrable domain (مثل `www.example.com` و`api.example.com`) مع Mode B: لازم CORS صريح و`credentials: 'include'`. يعمل `SameSite=Lax` لأن الموقعين same-site.
   - **لا يصلح** دومينان مختلفان (مثل `alasma.com` و`api.something.net`): الـ cookie `Lax` لن تُرسل مع طلبات `fetch` عبر المواقع.
3. الـ rewrites في Next تكفي في التطوير، ويمكن استخدامها في الإنتاج لكنها تضيف قفزة شبكة لكل طلب API، وتجعل Next نقطة فشل. لذلك الأفضل في الإنتاج reverse proxy.

## متطلبات الاستضافة في الإنتاج

- HTTPS إلزامي على الموقع والـ API (الـ cookie `Secure`).
- `Cors:AllowedOrigins` يحتوي أصل الموقع بالضبط (scheme وhost وport)، مثل `https://www.example.com`، لأن حارس الـ Origin على `refresh` و`logout` يقارن الثلاثة. نفس القائمة تحكم CORS.
- `AppLinks:FrontendBaseUrl` يشير إلى نفس الأصل (روابط التأكيد واستعادة كلمة المرور).
- الـ reverse proxy يمرّر `Origin` و`Cookie` و`Set-Cookie` كما هي ولا يضيف `Domain` للـ cookie.
- إن اختير Mode B: `RefreshCookie:SameSite` تبقى `Lax` طالما الدومينان same-site.
- كل بيئة (staging وproduction) تضع أصلها في `AllowedOrigins`، ولا تُترك `localhost` في الإنتاج.

## تغييرات مطلوبة في الباك إند (وصف فقط، لم يُنفَّذ)

1. **تجديد متزامن (الأهم).** الطلبات المتوازية تنتج جلسة ضائعة: واحد ينجح والباقي يفشل، وردّ الفشل يمسح الـ cookie من المتصفح فيضيع الـ token الجديد. المقترح: نافذة سماح قصيرة (10 إلى 30 ثانية) تقبل الـ token السابق مرة ثانية وترجع نفس الـ token الجديد، أو على الأقل عدم إرسال حذف الـ cookie عند `auth_refresh_invalid` الناتج عن سباق. حتى ذلك الحين لازم single-flight في الواجهة، ولازم قفل بين التبويبات (مثل Web Locks API) لأن تبويبين مفتوحين يعيدان نفس المشكلة.
2. **رمز الخطأ للاستخدام المتكرر.** إعادة استخدام token قديم ترجع `auth_refresh_invalid` وليس `refresh_reused` (الرمز موجود في الكود). لو أرادت الواجهة رسالة مختلفة عند اكتشاف سرقة محتملة فلازم الرمز المميز.
3. **القفل.** الرد لا يفرّق بين كلمة مرور خاطئة وحساب مقفول، ولا يرسل `Retry-After`. مقبول أمنيًا (وهو المعتمد في الـ Notion)، لكن لو أردنا رسالة "الحساب مقفول مؤقتًا" لزم رمز جديد مثل `auth_locked_out` مع `Retry-After`.
4. **Rate limit.** الحد 5 طلبات في الدقيقة للدخول والتسجيل لكل IP: خلف reverse proxy لازم الـ API يقرأ عنوان العميل الحقيقي (`X-Forwarded-For` بإعداد موثوق) وإلا يشترك كل الزوار في حصة واحدة.

## ملاحظات أخرى

- **سلوك المتصفحات الأخرى (غير مجرَّب):** Chromium يقبل `Secure` على `http://localhost`. المعروف أن Firefox يقبله أيضًا، وأن Safari قد يرفض `Secure` على HTTP حتى لـ localhost؛ يلزم اختبار Safari على https محلي قبل الاعتماد عليه في التطوير.
- الـ cookies لا تعزل بالمنفذ: `alasma_rt` على `localhost` مشتركة بين `:3000` و`:5290` وأي تطبيق آخر على `localhost`، فلا يُشغَّل تطبيقان مختلفان على نفس الاسم محليًا.
- الـ access token يظل صالحًا حتى بعد إلغاء الجلسة (JWT بلا حالة)، لمدة أقصاها 5 دقائق.
- بيانات تجريبية بقيت في قاعدة التطوير: مستخدمون بريدهم `spike-*@example.com` فقط.
