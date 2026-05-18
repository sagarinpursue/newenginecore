import ar from './locales/ar_ae.js';
import en from './locales/en-us.js';

const dictionary = {
    en_US: en,
    ar_AE: ar,
};
const t = (localeId, key, values = {}, defaultText = undefined) => {
    const languageDictionary = dictionary[localeId] ?? dictionary['en_US'];

    if (languageDictionary && languageDictionary[key]) {
        const text = languageDictionary[key];
        return replacePlaceholders(text, values);
    }

    if (dictionary.en_US[key]) {
        const text = dictionary.en_US[key];
        return replacePlaceholders(text, values);
    }

    return defaultText ?? `Unknown key: ${key}`;
};

const replacePlaceholders = (text, values) => {
    Object.keys(values).forEach((varName) => {
        text = text.replaceAll(`{${varName}}`, values[varName] ?? 'N/A');
    });
    return text;
};

export { t };
