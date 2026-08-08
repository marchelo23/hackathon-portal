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
