const fs = require('fs');

async function testFetch() {
  const apiKey = '186f2ee01bdef4cc26c2f3b5c67ea8fff4c6f773-6e9f0673833c85a38e3ca2440f34b2663f79e022da13eb8ad9d3c1a71f2fe286';
  const buffer = Buffer.alloc(2048, 'a'); // 2kb dummy file
  const blob = new Blob([buffer], { type: 'image/png' });
  
  const formData = new FormData();
  formData.append('file', blob, 'test.png');

  try {
    const response = await fetch('https://blob.squarecloud.app/v1/objects?name=my_test_image', {
      method: 'POST',
      headers: {
        'Authorization': apiKey,
      },
      body: formData
    });
    
    const text = await response.text();
    console.log("Status:", response.status);
    console.log("Response:", text.substring(0, 500));
  } catch (err) {
    console.error("Fetch Error:", err);
  }
}

testFetch();
