# BirthdayBot
An AWS Lambda function that runs every day to send birthday wishes to Yalies.

## Set up AWS
- Create an AWS Lambda function called `yaliesBirthdayBot`
- Get your AWS SES account set up
- Follow [this post](https://stackoverflow.com/a/52836905/4699945) to allow Lambda functions to send emails
- (ERIC TODO) I'm currently working on setting up an AWS schedule to run the lambda function

## Deploy
- `cd lambda && npm install`
- Run `deploy.sh` to create a zip, then deploy that zip to Lambda
- Run `invoke.sh` to run the Lambda function in the cloud, to test
