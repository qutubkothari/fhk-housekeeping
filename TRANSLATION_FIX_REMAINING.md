# Remaining Translation Updates

## TaskDetail.jsx - Need to add translations for:
1. Import useLanguage at top: `import { useLanguage } from '../contexts/LanguageContext'`
2. Add hook: `const { t } = useLanguage()`
3. Replace "حدث خطأ أثناء بدء المهمة" with `t('error')`
4. Replace "تفاصيل الغرفة" with `{t('roomDetails')}`
5. All room/task labels

## ServiceRequest.jsx - Need to add translations for:
1. Import useLanguage at top: `import { useLanguage } from '../contexts/LanguageContext'`
2. Add hook: `const { t } = useLanguage()`
3. Replace "حدث خطأ أثناء إرسال الطلب" with `t('requestError')`
4. Replace "طلب خدمة" with `{t('serviceRequest')}`
5. Replace "أبلغ عن مشكلة أو اطلب خدمة للغرفة" with `{t('reportOrRequest')}`
6. All form labels and buttons

## Quick Fix Commands:
The translation keys are already in translations.js. Just need to:
- Replace all hardcoded Arabic strings with t('keyName')
- Refer to translations.js for correct key names
