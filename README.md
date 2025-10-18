# BirthdayBot

A Google Cloud Function that runs every day to send birthday wishes to Yalies. Uses Gemini API for poem generation and AWS SES for sending emails.

> This project was originally AWS Lambda + OpenAI. I was able to use AI tools to convert it over to Google Cloud Functions + Gemini. So excuse the AI slop 😅
>
> Old code is still available in `/lambda`, but all production code runs from `birthday-bot-cloud-function` now.

## Set up DKIM

Yale's new ValiMail policy requires your SES account to be DKIM-verified.

## Set up AWS
- Put your AWS credentials file in `birthday-bot-cloud-function/aws-credentials.json`

## Set up Google Cloud Functions

1. **Create a GCP Project**
	- Go to [Google Cloud Console](https://console.cloud.google.com/)
	- Create a new project or select an existing one.

2. **Enable APIs**
	- Enable the Cloud Functions API.
	- Enable the Gmail API (if using Gmail SMTP).
	- Enable the Gemini API (Generative Language API).

3. **Configure Secrets**
	- Copy `birthday-bot-cloud-function/secrets.js.template` to `secrets.js` and fill in:
	  - `YALIES_API_KEY`: Your Yalies API key
	  - `GEMINI_API_KEY`: Your Gemini API key ([get it here](https://ai.google.dev/))
	  - `GMAIL_USER`: Gmail address to send from
	  - `GMAIL_PASS`: App password (see [Google App Passwords](https://support.google.com/accounts/answer/185833))

4. **Create a Service Account**
	- To create a service account email, follow these steps:
		1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
		2. Select your project.
		3. Navigate to **IAM & Admin** > **Service Accounts**.
		4. Click on **Create Service Account**.
		5. Enter a name and description for the service account.
		6. Click **Create**.
		7. Assign the role **Cloud Functions Invoker** to the service account.
		8. Click **Done**.
		9. After creating the service account, click on it to view details.
		10. Under the **Keys** tab, click **Add Key** > **Create New Key**.
		11. Choose **JSON** and click **Create**. This will download a JSON file with your service account credentials.
	- Make sure to keep this JSON file secure, as it contains sensitive information.

5. **Install dependencies**
	- `cd birthday-bot-cloud-function && npm install`

6. **Deploy the Cloud Function**
	- Run:
	  ```fish
	  gcloud functions deploy birthdayBotGCF \
		 --runtime=nodejs20 \
		 --trigger-http \
		 --entry-point=birthdayBotGCF \
		 --region=us-central1 \
		 --service-account=<YOUR_SERVICE_ACCOUNT_EMAIL> \
	  ```
	- Adjust region/runtime as needed.
	- Grant the Cloud Scheduler service account permission to invoke the function:
	  ```fish
	  gcloud functions add-iam-policy-binding birthdayBotGCF \
		 --member=serviceAccount:<CLOUD_SCHEDULER_SERVICE_ACCOUNT_EMAIL> \
		 --role=roles/cloudfunctions.invoker
	  ```

7. **Set up a timer/cron (Cloud Scheduler)**
	- Go to [Cloud Scheduler](https://console.cloud.google.com/cloudscheduler)
	- Create a new job:
	  - Frequency: `0 9 * * *` (every day at 9am)
	  - Target: HTTP
	  - URL: Your function's HTTPS endpoint
	  - HTTP Method: POST
	  - **Authentication:** Select "Add OIDC token"
	    - **Service account email:** Use the same service account email you created above (`<CLOUD_SCHEDULER_SERVICE_ACCOUNT_EMAIL>`)
	    - **Audience:** Use the default or set to your function's URL
	  - (Optionally) Add other settings as needed
