const localeMap = {
    en: 'en_US',
    ar: 'ar_AE',
};

const getLocaleId = (locale) => {
    return localeMap[locale] || 'en_US';
};

export { getLocaleId };
