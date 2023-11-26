const AWS = require('aws-sdk');

AWS.config.update({ 
    accessKeyId : "AKIAVMR7QWW2ET6LS7HO",
    secretAccessKey : "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",
    region: 'us-west-1' });
const sns = new AWS.SNS();

const postToSNSTopic = async (email,url, topicARN) => {
    const message = {
        email,
        url
    }
  const params = {
    Message: JSON.stringify(message),
    Subject: 'New Post',
    TopicArn: topicARN,
  };

  try {
    const result = await sns.publish(params).promise();
    console.log('Message sent:', result.MessageId);
    return result;
  } catch (error) {
    console.error('Error publishing message:', error);
    throw error;
  }
};

module.exports = { postToSNSTopic };