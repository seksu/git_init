export const join = (...paths: string[]) => {
  return paths.reduce((acc, value) => {
    const path = value?.replace(/(^\/|\/$)/g, '');
    if (!path) {
      return acc;
    }

    return `${acc}/${path}`;
  }, '');
};
