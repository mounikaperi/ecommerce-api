const paytm = require('paytmchecksum');
const { v4: uuidv4 } = require('uuid');
const https = require('https');
const asyncErrorHandler = require('../middlewares/asyncErrorHandler');
const Payment = require('../models/paymentModel');
const ErrorHandler = require('../handlers/ErrorHandler');
const { getCallbackUrl, getPaymentRedirectUrl } = require('../utils/urlConfig');

const processPayment = asyncErrorHandler(async(req, res, next) => {
  const { amount, email, phoneNo } = req.body;
  const params = {};
  params["MID"] = process.env.PAYTM_MID;
  params["WEBSITE"] = process.env.PAYTM_WEBSITE;
  params["CHANNEL_ID"] = process.env.PAYTM_CHANNEL_ID;
  params["INDUSTRY_TYPE_ID"] = process.env.PAYTM_INDUSTRY_TYPE;
  params["ORDER_ID"] = "oid" + uuidv4();
  params["CUST_ID"] = process.env.PAYTM_CUST_ID;
  params["TXN_AMOUNT"] = JSON.stringify(amount);
  params["CALLBACK_URL"] = getCallbackUrl(req.get("host"));
  params["EMAIL"] = email;
  params["MOBILE_NO"] = phoneNo;
  const paytmCheckSum = paytm.generateSignature(params, process.env.PAYTM_MERCHANT_KEY);
  paytmCheckSum.then((checkSum) => {
    const paytmParams = {
      ...params,
      "CHECKSUMHASH": checkSum,
    };
    res.status(200).json({
      paytmParams
    });
  }).catch((error) => {
    console.log(error);
  });
});

const paytmResponse = (req, res, next) => {
  const paytmChecksum = req.body.CHECKSUMHASH;
  delete req.body.CHECKSUMHASH;
  const isVerifySignature = paytm.verifySignature(req.body, process.env.PAYTM_MERCHANT_KEY, paytmChecksum);
  if (isVerifySignature) {
    const paytmParams = {};
    paytmParams.body = {
      "mid": req.body.MID,
      "orderId": req.body.ORDERID
    };
    paytm.generateSignature(JSON.stringify(paytmParams.body), process.env.PAYTM_MERCHANT_KEY).then((checksum) => {
      paytmParams.head = {
        "signature": checksum
      };
      const postData = JSON.stringify(paytmParams);
      const options = {
        hostname: 'securegw-stage.paytm.in',
        port: 443,
        path: '/v3/order/status',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': postData.length
        } 
      };
      let response = "";
      const postRequest = https.request(options, postResponse => {
        postResponse.on('data', chunk => response += chunk);
        postResponse.on('end', () => {
          const { body } = JSON.parse(response);
          addPayment(body);
          response.redirect(getPaymentRedirectUrl(req.get("host"), body.orderId));
        });
      });
      postRequest.write(postData);
      postRequest.end();
    });
  } else {
    console.log("Checksum Mismatched");
  }
}

const addPayment = async (data) => {
  try {
    await Payment.create(data);
  } catch (error) {
    console.log("Payment Failed!");
  }
}

const getPaymentStatus = asyncErrorHandler(async(req, res, next) => {
  const payment = await Payment.findOne({ orderId: req.params.id });
  if (!payment) {
    return next(new ErrorHandler("Payment Details Not Found", 404));
  }
  const txn = {
    id: payment.txnId,
    status: payment.resultInfo.resultStatus,
  }
  res.status(200).json({
    success: true,
    txn,
  });
})

module.exports = {
  processPayment,
  paytmResponse,
  getPaymentStatus
}