#!/bin/bash

aws lambda invoke --function-name yaliesBirthdayBot run.out --log-type Tail --query 'LogResult' --output text | base64 -d
