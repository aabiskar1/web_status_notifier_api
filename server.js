const express = require('express');
const app = express();
const axios = require('axios')
var admin = require("firebase-admin");
var serviceAccount = require("./serviceAccountKey.json");
const nodemailer = require("nodemailer");



/**
 * 
 * 
 * 
 * ADD A VAR HERE FOR EACH WEBSITE ADDED. 
 * This variable is use to check if notification is already sent.
 * 
 * 
 * 
 */
var status_aab= "";
var status_binacurry= "";
var status_getwelldeals= "";
var status_test= "";

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const adminFirestore = admin.firestore();


app.listen(process.env.PORT||'3000',()=>{



    console.log(`Server is running on port: ${process.env.PORT || "3000"}`)
 
    setInterval(function(){ 


      /**
       * @param website_name
       * @param name
       * @param status_variable_name
       */
      checkStatus("https://aabiskar.com",'aabiskar.com',status_aab);
      checkStatus("https://getwelldeals.com",'getwelldeals',status_getwelldeals);
      checkStatus("https://binacurry.co.kr",'binacurry',status_binacurry);


    },3000) 
    //900000 millisec = 15 minutes

});



const checkStatus = (link,name,status_var) => {
   
  axios({
    method: "GET",
    url: link,
    headers: { "Content-Type": "application/json" },
  })
    .then(function (response) {
      //handle success
    
      if ((response.status = 200  || response.statusCode == 201 || response.statusCode == 202)) {
          console.log("working")
          
          if(status_var != "up"){
            status_var = "up";
            console.log(status_var + link)
            writeStatusUp(link,name,status_var,response.status);
          }
          else{
           
          }


      }
    })
    .catch(function (error) {
      // console.log(error);
      if(status_var != "down"){
        let error_code;    
        status_var = "down"
        console.log(status_var)
        if(error.code){
          error_code = error.code;
        }
        else{
          error_code = error.response.status;
        }
        writeStatusDown(link,name,status_var,error_code);
      }
      else{console.log("notification for " + link + " already sent")};
    });

};


async function writeStatusDown(website,name,status_value,status_code){
  const data = {
    website: website,
    status: status_value,
    status_code: status_code.toString(),
    last_update:  new Date(),
  };
  
  const res = await adminFirestore.collection('websites').doc(name).set(data);
  sendMail(name).catch(console.error);
  sendNotification(website);
}

async function writeStatusUp(website,name,status_value,status_code){

  const data = {
    website: website,
    status: status_value,
    status_code: status_code.toString(),
    last_update:  new Date(),
  };
  
  const res = await adminFirestore.collection('websites').doc(name).set(data);
 

}


// async..await is not allowed in global scope, must use a wrapper
async function sendMail(website) {

  console.log(website + "is the website");
  // Generate test SMTP service account from ethereal.email
  // Only needed if you don't have a real mail account for testing
  let testAccount = await nodemailer.createTestAccount();

  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    host: "mail.aabiskar.com",
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
      user: YOUR_EMAIL, // generated ethereal user
      pass: YOUR_PASSWORD, // generated ethereal password
    },
  });

  // send mail with defined transport object
  let info = await transporter.sendMail({
    from: '"Web Status Notifier 👻" <status@aabiskar.com>', // sender address
    to: "aabiskar1@live.com, baz@example.com", // list of receivers
    subject: website + " is down", // Subject line
    text: website + " is currently down. Please check it asap", // plain text body
 
  });

  console.log("Message sent: %s", info.messageId);
  // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

  // Preview only available when sending through an Ethereal account
  console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
}

async function sendNotification(website){
console.log("in notification");
// The topic name can be optionally prefixed with "/topics/".
var topic = 'status';

var message = {
  notification: {
    title: 'Website Down',
    body:  website + ' is down'
  },
  topic: topic
};

// Send a message to devices subscribed to the provided topic.
admin.messaging().send(message)
  .then((response) => {
    // Response is a message ID string.
    console.log('Successfully sent message:', response);
  })
  .catch((error) => {
    console.log('Error sending message:', error);
  });


}



