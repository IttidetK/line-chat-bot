const { onRequest } = require("firebase-functions/v2/https");
// Set the maximum instances to 10 for all functions
const { setGlobalOptions } = require("firebase-functions/v2");
setGlobalOptions({ maxInstances: 10 });
const line = require("./utils/line");
const firestore = require("./utils/firestore");
const NodeCache = require("node-cache");
const { exec } = require('child_process');
const myCache = new NodeCache();

exports.webhook = onRequest(async (req, res) => {
  if (req.method === "POST") {
    const events = req.body.events;

    for (const event of events) {
      var userId = event.source.userId;
      var replyToken = event.replyToken;
      var userData = await firestore.getUser(userId);

      var userMode = "bot";
      if (userData == undefined) {
        let profile = await line.getUserProfile(userId);
        await firestore.updateUser(profile.data, userMode);
      } else {
        userMode = userData.mode;
      }

      switch (event.type) {
        case "message":
          if (event.message.type === "text") {
            var notifyStatus = myCache.get("NotifyTheStaff");
            if (notifyStatus === undefined) {
              notifyStatus = [];
            }

            if (event.message.text.toLowerCase() == "mode") {
              await line.reply(replyToken, [
                {
                  type: "text",
                  text:
                    "ตอนนี้คุณอยู่ในโหมดคคุยกับ " +
                    userMode +
                    " หากต้องการเปลี่ยนโหมดสามารถเลือกได้เลยค่ะ",
                  quickReply: {
                    items: [
                      {
                        type: "action",
                        action: {
                          type: "message",
                          label: "Bot",
                          text: "Bot",
                        },
                      },
                      {
                        type: "action",
                        action: {
                          type: "message",
                          label: "Staff",
                          text: "Staff",
                        },
                      },
                    ],
                  },
                },
              ]);
              return res.end();
            } 
             else if (event.message.text.toLowerCase() == "bot") {
              console.log("Change mode to Bot");
              await line.reply(replyToken, [
                {
                  type: "text",
                  text: "คุณได้เปลี่ยนเป็นโหมดคุยกับ Bot แล้ว สามารถสอบถามต่อได้เลยค่ะ",
                },
              ]);
              await firestore.updateUser(userData, "bot");
              return res.end();
            } else if (event.message.text.toLowerCase() == "staff") {
              console.log("Change mode to Staff");
              await line.reply(replyToken, [
                {
                  type: "text",
                  text: "คุณได้เปลี่ยนเป็นโหมดคุยกับ Staff แล้ว สามารถสอบถามต่อได้เลยค่ะ",
                },
              ]);
              await firestore.updateUser(userData, "staff");
              return res.end();
            }
            console.log("User Mode " + userMode);

            if (userMode == "staff") {
              if (!notifyStatus.includes(userId)) {
                notifyStatus.push(userId);
                await line.notify({
                  message:
                    "\nมีผู้ใช้ชื่อ : " +
                    userData.displayName +
                    "\nข้อความ : " + event.message.text+
                    "\nรูปโปรไฟล์ : ",
                  imageFullsize: userData.pictureUrl,
                  imageThumbnail: userData.pictureUrl,
                });
                await line.reply(replyToken, [
                  {
                    type: "text",
                    text: "เราได้แจ้งเตือนไปยัง Staff แล้วค่ะ รอสักครู่นะคะ",
                  },
                ]);
              }
              myCache.set("NotifyTheStaff", notifyStatus, 600);
              return res.end();
            } else if (userMode == "bot") {
                let question = event.message.text;
                await line.loading(userId);
                // เรียกใช้งาน Python script พร้อมส่ง userInput
                exec(`python E:\\Linechatbot_webhook\\functions\\utils\\gemini.py "${question}"`, (error, stdout, stderr) => {
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
                        const msg = JSON.parse(stdout);
                        console.log(msg.result);
                //     } catch (parseError) {
                //         console.error(`Error parsing JSON: ${parseError.message}`);
                //     }
                // });
              // const msg = await gemini.chat(question);
              // console.log(msg);
              // if (msg.includes("ขออภัยครับ ไม่พบข้อมูลดังกล่าว")) {
              //   line.reply(replyToken, [
              //     {
              //       type: "text",
              //       text: "ขออภัยครับ ไม่พบข้อมูลดังกล่าว ตอนนี้คุณอยู่ในโหมดคคุยกับ Bot คุณสามารถถามคำถามต่อไป หรือหากต้องการเปลี่ยนโหมดเป็น Staff สามารถเลือกได้เลยค่ะ",

              //       quickReply: {
              //         items: [
              //           {
              //             type: "action",
              //             action: {
              //               type: "message",
              //               label: "Staff",
              //               text: "Staff",
              //             },
              //           },
              //         ],
              //       },
              //     },
              //   ]);
              // } else {
                line.reply(replyToken, [
                  {
                    type: "text",
                    sender: {
                      name: "Gemini",
                      iconUrl: "https://wutthipong.info/images/geminiicon.png",
                    },
                    text: msg.result,
                  },
                ]);
              // }
            } catch (parseError) {
              console.error(`Error parsing JSON: ${parseError.message}`);
          }
      });
              return res.end();
            }
          }
        //   if (event.message.type === "image" && userMode == "bot") {
        //     const imageBinary = await line.getImageBinary(event.message.id);
        //     await line.loading(userId);
        //     const msg = await gemini.multimodal(imageBinary);
        //     await line.reply(replyToken, [
        //       {
        //         type: "text",
        //         sender: {
        //           name: "Gemini",
        //           iconUrl: "https://wutthipong.info/images/geminiicon.png",
        //         },
        //         text: msg,
        //       },
        //     ]);
        //     return res.end();
        //   }
          break;
      }
    }
  }
  return res.send(req.method);
});
