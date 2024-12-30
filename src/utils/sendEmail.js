const sendGridEmail = require('@sendgrid/mail');

sendGridEmail.setApiKey(process.env.SENDGRID_API_KEY);

const sendEmail = async (options) => {
  const emailMessage = {
    to: options.email,
    from: process.env.SENDGRID_MAIL,
    templateId: options.templateId,
    dynamic_template_data: options.data
  }
  sendGridEmail.send(emailMessage).then(() => {
    console.log("Email sent");
  }).catch((error) => {
    console.log(error);
  });
};

module.exports = sendEmail;