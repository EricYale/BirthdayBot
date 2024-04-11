#!/bin/bash

zip -r deployment_package.zip .
aws lambda update-function-code --function-name yaliesBirthdayBot \
--zip-file fileb://deployment_package.zip
