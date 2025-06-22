export const logger = {
  info: (message: string) => console.log(`ℹ️ [INFO]: ${message}`),
  error: (message: string) => console.error(`❌ [ERROR]: ${message}`),
};

export function log(str: string, data: any) {
  if (typeof data === 'object' && data !== null) {
      console.log(str, JSON.stringify(data, getCircularReplacer()));
  } else {
      console.log(str, data);
  }
  console.log('-------------------------------------');
}
function getCircularReplacer() {
  const seen = new WeakSet();
  return (key: string, value: any) => {
      if (typeof value === 'object' && value !== null) {
          if (seen.has(value)) {
              return '[Circular]';
          }
          seen.add(value);
      }
      return value;
  };
}
