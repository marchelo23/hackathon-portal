# AWS Deployment via Terraform

This directory contains the Terraform configuration required to deploy the Nocturnal StrixX Hackathon Portal to AWS using ECS Fargate and CloudFront.

## Architecture
- **Backend**: Runs on ECS Fargate (Node.js) and connects securely to Portal SDK and OpenAI.
- **Frontend**: Static files hosted on S3 and served via CloudFront CDN (which provides a free HTTPS domain).

## Prerequisites
1. **Terraform**: Make sure Terraform is installed locally.
2. **AWS CLI**: Installed and configured (`aws configure`).
3. **Docker**: Running locally to build and push the backend image.

## Deployment Steps

### 1. Initialize and Apply Terraform
```bash
terraform init
terraform apply -auto-approve
```
Once applied, Terraform will output:
- `backend_repository_url` (ECR for backend)
- `cloudfront_domain_name` (Your public HTTPS URL!)
- `frontend_bucket_name` (The S3 bucket for frontend files)

### 2. Build and Push Backend
Authenticate Docker with your ECR registry:
```bash
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <YOUR_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com
```

Navigate to the root directory and build the backend image:
```bash
cd backend
docker build -t hackathon-portal-backend .
docker tag hackathon-portal-backend:latest <backend_repository_url>:latest
docker push <backend_repository_url>:latest
```
*(If the ECS Service fails to start initially, run: `aws ecs update-service --cluster hackathon-portal-cluster --service backend-service --force-new-deployment`)*

### 3. Build and Upload Frontend to S3
Navigate to the frontend directory and build the static files:
```bash
cd frontend
pnpm install
pnpm run build
```

Then sync the `dist` folder to your new S3 bucket:
```bash
aws s3 sync dist/ s3://<frontend_bucket_name>
```

### 4. Access the Application
Open `https://<cloudfront_domain_name>` in your browser to access the portal!
