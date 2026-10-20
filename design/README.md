# design/ — مرجع التصميم (READ-ONLY)

هذا المجلد نسخة مرجعية من تصميم "الأسمى" (Design Canvas v38). **لا يُعدَّل ولا يُستورد منه في الكود.**
المرجع المرئي الحي: https://claude.ai/artifact/462f612Gm99FZ9L6LcMYKn

## المحتوى
- `*.dc.html` — 76 Board (كل ملف = شاشة). الصيغة صيغة الـ Canvas (`{{holes}}`, `sc-for`, `sc-if`, `<dc-import>`) ولا تعمل خارجه.
- `ds/al-asma/tokens.css` — الـ design tokens (ألوان، مسافات، radius، خطوط، classes للنصوص). **المصدر الوحيد** ← ينتقل إلى `src/styles/tokens.css`.
- `site.css` (~58KB) · `mobile.css` (~10KB) · `account.css` (~3KB) · `admin.css` (~26KB).
- `canvas.json` — أبعاد كل Board ومكانها وهل هو تفاعلي.
- `_blob/24a523…svg` — اللوجو. الـ HTML يشير إليه بـ `/_blob/24a523f9f8546d4a3412a99fb59ba59f`. نسخة للإنتاج: `assets/logo-alasma.svg`.

## غير موجود هنا (عن قصد أو لعدم توفره)
- `support.js` (runtime الـ Canvas) — غير متاح محليًا، فلا يمكن فتح الـ Boards مباشرة من الملفات.
- الخطوط: لا ملفات. تُحمَّل من Google Fonts (انظر مهمة F1.4 — نستخدم `next/font/google`).
- الأيقونات: لا ملفات. كلها SVG مضمّنة كـ `data:` URI داخل `site.css` (CSS mask).
- صور الكتب: لا يوجد. أغلفة الكتب في التصميم مرسومة بـ CSS (`.cv`) كـ placeholder.
- ملفان SVG إضافيان في أصول التصميم (`ff939f…` و `6e97805…`) لم أتمكن من تنزيلهما ولا يستخدمهما أي Board.
