export const camelToSnake = (str) => {
    return str.replace(/([A-Z])/g, '_$1').toLowerCase();
};

export const snakeToCamel = (str) => {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
};
