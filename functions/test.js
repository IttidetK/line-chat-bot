// test.js
const { exec } = require('child_process');

// ข้อมูล input ที่ต้องการส่งไปยัง Python
const userInput = "ขอคู่มือของกระเบื้องหลังคาเซรามิคเอสซีจี รุ่นเอ็กซ์เซลล่า คลาสสิค สีออบสิเดียน เกรย์";

// function runPythonScript(input) {
//     return new Promise((resolve, reject) => {

// เรียกใช้งาน Python script พร้อมส่ง userInput
exec(`python E:\\Linechatbot_webhook\\functions\\utils\\gemini.py "${userInput}"`, (error, stdout, stderr) => {
    // if (error) {
    //     console.error(`Error executing Python script: ${error.message}`);
    //     return;
    // }
    // if (stderr) {
    //     console.error(`Python error: ${stderr}`);
    //     return;
    // }

    // แปลง output จาก Python script (ในรูปแบบ JSON) ให้เป็น JavaScript object
    try {
         var output = JSON.parse(stdout);
        // resolve(output.result); 
        console.log(output.result);
    } catch (parseError) {
        console.error(`Error parsing JSON: ${parseError.message}`);
    }
});
// });

// }
// runPythonScript(userInput)
//     .then(result => {
//         console.log("Python script result:", result); // ใช้งาน output ที่แปลงแล้ว
//     })
//     .catch(error => {
//         console.error(error); // จัดการ error
//     });

// console.log(output.result);