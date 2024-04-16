# BirthdayBot
An AWS Lambda function that runs every day to send birthday wishes to Yalies.

## Set up AWS
- Create an AWS Lambda function called `yaliesBirthdayBot`
- Get your AWS SES account set up
- Follow [this post](https://stackoverflow.com/a/52836905/4699945) to allow Lambda functions to send emails
- Follow [this guide](https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-run-lambda-schedule.html) to set up a CloudWatch rule to run the lambda function on a scheduled interval
- Follow [this guide](https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-troubleshooting.html#eb-lam-function-not-invoked) to allow the CloudWatch rule to invoke the Lambda function

## Deploy
- `cd lambda && npm install`
- Run `deploy.sh` to create a zip, then deploy that zip to Lambda
- Run `invoke.sh` to run the Lambda function in the cloud, to test
