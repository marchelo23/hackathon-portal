# Security group for the frontend (allows incoming HTTP traffic)
resource "aws_security_group" "frontend_sg" {
  name        = "hackathon-portal-frontend-sg"
  description = "Allow inbound HTTP traffic and all outbound"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTP from anywhere"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "hackathon-portal-frontend-sg"
  }
}

# Security group for the backend (no inbound, all outbound)
resource "aws_security_group" "backend_sg" {
  name        = "hackathon-portal-backend-sg"
  description = "Allow all outbound traffic only"
  vpc_id      = aws_vpc.main.id

  # No ingress blocks - backend is not publicly accessible via any ports

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "hackathon-portal-backend-sg"
  }
}
