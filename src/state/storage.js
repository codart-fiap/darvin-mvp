const NAMESPACE = 'darvin'; //
export const setItem = (key, value) => {
  try {
    const serializedValue = JSON.stringify(value);
    localStorage.setItem(`${NAMESPACE}/${key}`, serializedValue);
  } catch (error) {
    console.error(`Error setting item ${key} in localStorage`, error);
  }
};
export const getItem = (key) => {
  try {
    const serializedValue = localStorage.getItem(`${NAMESPACE}/${key}`);
    if (serializedValue === null) { return null; }
    return JSON.parse(serializedValue);
  } catch (error) {
    console.error(`Error getting item ${key} from localStorage`, error);
    return null;
  }
};