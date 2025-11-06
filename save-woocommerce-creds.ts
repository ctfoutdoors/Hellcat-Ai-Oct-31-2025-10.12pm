import { encryptCredential } from './server/services/apiService';

const storeUrl = 'https://www.catchthefever.com';
const consumerKey = 'ck_9356f447df19b961bfdb66e043dbf498bb1b5d3b';
const consumerSecret = 'cs_a2502193e3215e83e3654cb299df40339ff1b576';

// Encrypt each credential
const encryptedUrl = encryptCredential(storeUrl);
const encryptedKey = encryptCredential(consumerKey);
const encryptedSecret = encryptCredential(consumerSecret);

console.log('-- WooCommerce Credentials (Encrypted)');
console.log(`INSERT INTO credentialsVault (serviceName, serviceType, credentialKey, credentialValue, isActive, testStatus, createdAt, updatedAt) VALUES`);
console.log(`('Catch The Fever Store', 'WOOCOMMERCE', 'store_url', '${JSON.stringify(encryptedUrl)}', 1, 'NOT_TESTED', NOW(), NOW()),`);
console.log(`('Catch The Fever Store', 'WOOCOMMERCE', 'consumer_key', '${JSON.stringify(encryptedKey)}', 1, 'NOT_TESTED', NOW(), NOW()),`);
console.log(`('Catch The Fever Store', 'WOOCOMMERCE', 'consumer_secret', '${JSON.stringify(encryptedSecret)}', 1, 'NOT_TESTED', NOW(), NOW());`);
