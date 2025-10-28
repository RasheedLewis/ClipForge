export const arrayMove = <T>(array: T[], from: number, to: number) => {
  const newArray = [...array];
  const startIndex = from < 0 ? newArray.length + from : from;
  if (startIndex < 0 || startIndex >= newArray.length) {
    return newArray;
  }

  const item = newArray.splice(startIndex, 1)[0];
  const endIndex = to < 0 ? newArray.length + to : to;
  newArray.splice(endIndex, 0, item);
  return newArray;
};
