# AWS Deployment via Terraform

This directory contains the Terraform configuration required to deploy the Nocturnal StrixX Hackathon Portal to AWS using ECS Fargate.

## Prerequisites
1. **Terraform**: Make sure Terraform is installed locally.
2. **AWS CLI**: Installed and configured (`aws configure`).
3. **Docker**: Running locally to build and push images.

## Deployment Steps

### 1. Initialize and Apply Terraform
Initialize the Terraform directory to download the AWS provider:
```bash
terraform init
```

Apply the terraform configuration to create the infrastructure (VPC, ECR, ECS Cluster, etc.).
You will be prompted to enter the values for `portal_api_key` and `openai_api_key`:
```bash
terraform apply
```

Note: If you want to pass variables without being prompted, you can create a `terraform.tfvars` file or pass them via CLI:
```bash
terraform apply -var="portal_api_key=YOUR_KEY" -var="openai_api_key=YOUR_KEY"
```

Once applied, Terraform will output the URLs for the newly created ECR repositories:
- `frontend_repository_url`
- `backend_repository_url`

### 2. Build and Push Docker Images
Authenticate Docker with your new ECR registry:
```bash
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <YOUR_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com
```

#### Backend
Navigate to the root directory and build the backend image:
```bash
cd backend
docker build -t hackathon-portal-backend .
docker tag hackathon-portal-backend:latest <backend_repository_url>:latest
docker push <backend_repository_url>:latest
```

#### Frontend
Navigate to the frontend directory and build the image (make sure to pass the Portal API key as a build arg!):
```bash
cd ../frontend
docker build --build-arg VITE_PORTAL_API_KEY=YOUR_PORTAL_API_KEY -t hackathon-portal-frontend .
docker tag hackathon-portal-frontend:latest <frontend_repository_url>:latest
docker push <frontend_repository_url>:latest
```

### 3. Restart ECS Tasks (if necessary)
Since the ECS Services were created by Terraform *before* the images existed in ECR, they might be failing to start initially. Once the images are pushed, ECS will automatically retry and pull the images.
If you need to force a restart, you can use the AWS CLI:
```bash
aws ecs update-service --cluster hackathon-portal-cluster --service frontend-service --force-new-deployment
aws ecs update-service --cluster hackathon-portal-cluster --service backend-service --force-new-deployment
```

### 4. Access the Application
Since we chose to deploy without a Load Balancer (to save costs), you can access the frontend by navigating to the ECS Console, finding the `frontend-service`, clicking on the running Task, and looking for its **Public IP**.
Open `http://<Public-IP>` in your browser to access the portal!
