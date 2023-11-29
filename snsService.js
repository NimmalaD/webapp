const AWS = require('aws-sdk');
const AWS_REGION = process.env.AWS_REGION
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN

AWS.config.update({
    region: AWS_REGION });

const sns = new AWS.SNS();

const postToSNSTopic = async (email,url) => {
    const message = {
        email,
        url
    }
  const params = {
    Message: JSON.stringify(message),
    Subject: 'New Post',
    TopicArn: SNS_TOPIC_ARN,
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