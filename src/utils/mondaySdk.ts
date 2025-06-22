import mondaySDK from 'monday-sdk-js';

const monday = mondaySDK({ token: process.env.ACCESS_TOKEN });
monday.setApiVersion('2025-04');
export default monday;
