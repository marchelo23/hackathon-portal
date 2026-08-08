variable "aws_region" {
  description = "AWS region to deploy to"
  type        = string
  default     = "us-east-1"
}

variable "portal_api_key" {
  description = "API Key for Portal SDK"
  type        = string
  sensitive   = true
}

variable "openai_api_key" {
  description = "API Key for OpenAI"
  type        = string
  sensitive   = true
}
