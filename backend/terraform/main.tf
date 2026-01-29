# 0711 Vault Infrastructure
# Terraform configuration for cloud deployment

terraform {
  required_version = ">= 1.5.0"
  
  required_providers {
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.24"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.12"
    }
    # Choose your cloud provider:
    # AWS
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.31"
    }
    # Or GCP
    # google = {
    #   source  = "hashicorp/google"
    #   version = "~> 5.10"
    # }
    # Or Azure
    # azurerm = {
    #   source  = "hashicorp/azurerm"
    #   version = "~> 3.85"
    # }
  }
  
  backend "s3" {
    bucket         = "0711-terraform-state"
    key            = "vault/terraform.tfstate"
    region         = "eu-central-1"
    encrypt        = true
    dynamodb_table = "terraform-locks"
  }
}

# ===========================================
# VARIABLES
# ===========================================

variable "environment" {
  description = "Environment (staging/production)"
  type        = string
}

variable "region" {
  description = "AWS region"
  type        = string
  default     = "eu-central-1"
}

variable "domain" {
  description = "Base domain"
  type        = string
  default     = "0711.io"
}

variable "cluster_name" {
  description = "EKS cluster name"
  type        = string
  default     = "vault-cluster"
}

variable "node_instance_types" {
  description = "EC2 instance types for nodes"
  type        = list(string)
  default     = ["t3.large", "t3.xlarge"]
}

variable "min_nodes" {
  description = "Minimum nodes"
  type        = number
  default     = 3
}

variable "max_nodes" {
  description = "Maximum nodes"
  type        = number
  default     = 10
}

# ===========================================
# PROVIDER
# ===========================================

provider "aws" {
  region = var.region
  
  default_tags {
    tags = {
      Project     = "0711-vault"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

# ===========================================
# VPC
# ===========================================

module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.4"
  
  name = "vault-${var.environment}-vpc"
  cidr = "10.0.0.0/16"
  
  azs             = ["${var.region}a", "${var.region}b", "${var.region}c"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
  
  enable_nat_gateway     = true
  single_nat_gateway     = var.environment == "staging"
  enable_dns_hostnames   = true
  enable_dns_support     = true
  
  # Tags for EKS
  public_subnet_tags = {
    "kubernetes.io/role/elb" = 1
  }
  private_subnet_tags = {
    "kubernetes.io/role/internal-elb" = 1
  }
}

# ===========================================
# EKS CLUSTER
# ===========================================

module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 19.21"
  
  cluster_name    = "${var.cluster_name}-${var.environment}"
  cluster_version = "1.28"
  
  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets
  
  cluster_endpoint_public_access = true
  
  # Managed node groups
  eks_managed_node_groups = {
    general = {
      name           = "general"
      instance_types = var.node_instance_types
      
      min_size     = var.min_nodes
      max_size     = var.max_nodes
      desired_size = var.min_nodes
      
      labels = {
        role = "general"
      }
    }
    
    # GPU nodes for Ollama (optional)
    gpu = {
      name           = "gpu"
      instance_types = ["g4dn.xlarge"]
      ami_type       = "AL2_x86_64_GPU"
      
      min_size     = 0
      max_size     = 2
      desired_size = 0
      
      labels = {
        role = "gpu"
        "nvidia.com/gpu" = "true"
      }
      
      taints = [{
        key    = "nvidia.com/gpu"
        value  = "true"
        effect = "NO_SCHEDULE"
      }]
    }
  }
  
  # IRSA for external-secrets
  enable_irsa = true
}

# ===========================================
# RDS (PostgreSQL)
# ===========================================

module "rds" {
  source  = "terraform-aws-modules/rds/aws"
  version = "~> 6.3"
  
  identifier = "vault-${var.environment}"
  
  engine               = "postgres"
  engine_version       = "16.1"
  family               = "postgres16"
  major_engine_version = "16"
  instance_class       = var.environment == "production" ? "db.r6g.large" : "db.t3.medium"
  
  allocated_storage     = 100
  max_allocated_storage = 500
  
  db_name  = "vault"
  username = "vault"
  port     = 5432
  
  multi_az               = var.environment == "production"
  db_subnet_group_name   = module.vpc.database_subnet_group_name
  vpc_security_group_ids = [aws_security_group.rds.id]
  
  backup_retention_period = 30
  backup_window          = "03:00-04:00"
  maintenance_window     = "Mon:04:00-Mon:05:00"
  
  performance_insights_enabled = true
  
  # Enable pgvector extension
  parameters = [
    {
      name  = "shared_preload_libraries"
      value = "pg_stat_statements,pgvector"
    }
  ]
  
  deletion_protection = var.environment == "production"
}

resource "aws_security_group" "rds" {
  name_prefix = "vault-rds-"
  vpc_id      = module.vpc.vpc_id
  
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [module.eks.node_security_group_id]
  }
}

# ===========================================
# ELASTICACHE (Redis)
# ===========================================

resource "aws_elasticache_cluster" "redis" {
  cluster_id           = "vault-${var.environment}"
  engine               = "redis"
  node_type            = var.environment == "production" ? "cache.r6g.large" : "cache.t3.medium"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  port                 = 6379
  
  subnet_group_name  = aws_elasticache_subnet_group.redis.name
  security_group_ids = [aws_security_group.redis.id]
}

resource "aws_elasticache_subnet_group" "redis" {
  name       = "vault-${var.environment}"
  subnet_ids = module.vpc.private_subnets
}

resource "aws_security_group" "redis" {
  name_prefix = "vault-redis-"
  vpc_id      = module.vpc.vpc_id
  
  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [module.eks.node_security_group_id]
  }
}

# ===========================================
# S3 (Object Storage)
# ===========================================

resource "aws_s3_bucket" "vault" {
  bucket = "0711-vault-${var.environment}"
}

resource "aws_s3_bucket_versioning" "vault" {
  bucket = aws_s3_bucket.vault.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "vault" {
  bucket = aws_s3_bucket.vault.id
  
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.vault.arn
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "vault" {
  bucket = aws_s3_bucket.vault.id
  
  rule {
    id     = "delete-old-versions"
    status = "Enabled"
    
    noncurrent_version_expiration {
      noncurrent_days = 90
    }
  }
}

# ===========================================
# KMS
# ===========================================

resource "aws_kms_key" "vault" {
  description             = "KMS key for Vault encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true
}

resource "aws_kms_alias" "vault" {
  name          = "alias/vault-${var.environment}"
  target_key_id = aws_kms_key.vault.key_id
}

# ===========================================
# SECRETS MANAGER
# ===========================================

resource "aws_secretsmanager_secret" "vault" {
  name = "vault/${var.environment}/credentials"
}

resource "aws_secretsmanager_secret_version" "vault" {
  secret_id = aws_secretsmanager_secret.vault.id
  secret_string = jsonencode({
    postgres_password = random_password.postgres.result
    redis_password    = random_password.redis.result
    jwt_secret        = random_password.jwt.result
  })
}

resource "random_password" "postgres" {
  length  = 32
  special = false
}

resource "random_password" "redis" {
  length  = 32
  special = false
}

resource "random_password" "jwt" {
  length  = 64
  special = false
}

# ===========================================
# OUTPUTS
# ===========================================

output "cluster_endpoint" {
  value = module.eks.cluster_endpoint
}

output "cluster_name" {
  value = module.eks.cluster_name
}

output "rds_endpoint" {
  value = module.rds.db_instance_endpoint
}

output "redis_endpoint" {
  value = aws_elasticache_cluster.redis.cache_nodes[0].address
}

output "s3_bucket" {
  value = aws_s3_bucket.vault.bucket
}
