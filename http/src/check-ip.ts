import axios from 'axios';

async function checkIP() {
  try {
    const response = await axios.get('https://api.ipify.org?format=json');
    console.log('🌐 Public IP:', response.data.ip);
    
    // Проверяем, не заблокирован ли IP
    const ipCheck = await axios.get(`https://api.abuseipdb.com/api/v2/check?ipAddress=${response.data.ip}`, {
      headers: {
        'Key': 'your-api-key-here', // Нужен API ключ
        'Accept': 'application/json'
      }
    });
    
    console.log('🔍 IP Status:', ipCheck.data);
  } catch (error) {
    console.error('❌ Error checking IP:', error);
  }
}

checkIP(); 