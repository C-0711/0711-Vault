# 0711 Vault Infrastructure - Hetzner Cloud
# German hosting, DSGVO compliant
# Datacenter: Nürnberg (nbg1) oder Falkenstein (fsn1)

terraform {
  required_version = ">= 1.5.0"
  
  required_providers {
    hcloud = {
      source  = "hetznercloud/hcloud"
      version = "~> 1.45"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.24"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.12"
    }
  }
  
  backend "s3" {
    # Use any S3-compatible storage (Hetzner Object Storage, MinIO, etc.)
    bucket   = "0711-terraform-state"
    key      = "vault/terraform.tfstate"
    endpoint = "https://fsn1.your-objectstorage.com"
    region   = "eu-central-1"
    
    skip_credentials_validation = true
    skip_metadata_api_check     = true
    skip_region_validation      = true
    force_path_style            = true
  }
}

# ===========================================
# VARIABLES
# ===========================================

variable "hcloud_token" {
  description = "Hetzner Cloud API Token"
  type        = string
  sensitive   = true
}

variable "environment" {
  description = "Environment (staging/production)"
  type        = string
  default     = "production"
}

variable "location" {
  description = "Hetzner location"
  type        = string
  default     = "nbg1"  # Nürnberg
  # Alternatives: fsn1 (Falkenstein), hel1 (Helsinki)
}

variable "domain" {
  description = "Base domain"
  type        = string
  default     = "0711.io"
}

variable "ssh_keys" {
  description = "SSH key IDs for server access"
  type        = list(string)
  default     = []
}

# ===========================================
# PROVIDER
# ===========================================

provider "hcloud" {
  token = var.hcloud_token
}

# ===========================================
# NETWORK
# ===========================================

resource "hcloud_network" "vault" {
  name     = "vault-${var.environment}"
  ip_range = "10.0.0.0/16"
}

resource "hcloud_network_subnet" "vault" {
  network_id   = hcloud_network.vault.id
  type         = "cloud"
  network_zone = "eu-central"
  ip_range     = "10.0.1.0/24"
}

# ===========================================
# FIREWALL
# ===========================================

resource "hcloud_firewall" "vault" {
  name = "vault-${var.environment}"
  
  # SSH (restrict to your IPs in production)
  rule {
    direction = "in"
    protocol  = "tcp"
    port      = "22"
    source_ips = ["0.0.0.0/0", "::/0"]
  }
  
  # HTTP/HTTPS
  rule {
    direction = "in"
    protocol  = "tcp"
    port      = "80"
    source_ips = ["0.0.0.0/0", "::/0"]
  }
  
  rule {
    direction = "in"
    protocol  = "tcp"
    port      = "443"
    source_ips = ["0.0.0.0/0", "::/0"]
  }
  
  # Kubernetes API (restrict in production)
  rule {
    direction = "in"
    protocol  = "tcp"
    port      = "6443"
    source_ips = ["0.0.0.0/0", "::/0"]
  }
  
  # Internal traffic
  rule {
    direction = "in"
    protocol  = "tcp"
    port      = "any"
    source_ips = ["10.0.0.0/16"]
  }
  
  rule {
    direction = "in"
    protocol  = "udp"
    port      = "any"
    source_ips = ["10.0.0.0/16"]
  }
}

# ===========================================
# K3S CLUSTER (Lightweight Kubernetes)
# ===========================================

# Control Plane
resource "hcloud_server" "control_plane" {
  name        = "vault-cp-${var.environment}"
  server_type = var.environment == "production" ? "cpx31" : "cpx21"
  image       = "ubuntu-22.04"
  location    = var.location
  ssh_keys    = var.ssh_keys
  
  firewall_ids = [hcloud_firewall.vault.id]
  
  network {
    network_id = hcloud_network.vault.id
    ip         = "10.0.1.10"
  }
  
  user_data = <<-EOF
    #!/bin/bash
    set -e
    
    # Install K3s (lightweight Kubernetes)
    curl -sfL https://get.k3s.io | sh -s - server \
      --disable traefik \
      --disable servicelb \
      --flannel-iface ens10 \
      --node-ip 10.0.1.10 \
      --advertise-address 10.0.1.10 \
      --tls-san ${hcloud_server.control_plane.ipv4_address} \
      --tls-san vault-cp-${var.environment}.${var.domain}
    
    # Wait for K3s
    until kubectl get nodes; do sleep 5; done
    
    # Save token for workers
    cat /var/lib/rancher/k3s/server/node-token > /root/k3s-token
  EOF
  
  labels = {
    role        = "control-plane"
    environment = var.environment
  }
}

# Worker Nodes
resource "hcloud_server" "workers" {
  count = var.environment == "production" ? 3 : 2
  
  name        = "vault-worker-${count.index + 1}-${var.environment}"
  server_type = var.environment == "production" ? "cpx41" : "cpx31"
  image       = "ubuntu-22.04"
  location    = var.location
  ssh_keys    = var.ssh_keys
  
  firewall_ids = [hcloud_firewall.vault.id]
  
  network {
    network_id = hcloud_network.vault.id
    ip         = "10.0.1.${20 + count.index}"
  }
  
  user_data = <<-EOF
    #!/bin/bash
    set -e
    
    # Wait for control plane
    sleep 60
    
    # Get token from control plane (you'll need to transfer this securely)
    # For now, we'll use cloud-init with the token
    
    # Install K3s agent
    curl -sfL https://get.k3s.io | K3S_URL=https://10.0.1.10:6443 \
      K3S_TOKEN="${var.k3s_token}" \
      sh -s - agent \
      --flannel-iface ens10 \
      --node-ip 10.0.1.${20 + count.index}
  EOF
  
  labels = {
    role        = "worker"
    environment = var.environment
  }
  
  depends_on = [hcloud_server.control_plane]
}

# GPU Worker (optional, for Ollama)
resource "hcloud_server" "gpu_worker" {
  count = var.environment == "production" ? 1 : 0
  
  name        = "vault-gpu-${var.environment}"
  server_type = "ccx33"  # Dedicated CPU, can attach GPU
  image       = "ubuntu-22.04"
  location    = var.location
  ssh_keys    = var.ssh_keys
  
  firewall_ids = [hcloud_firewall.vault.id]
  
  network {
    network_id = hcloud_network.vault.id
    ip         = "10.0.1.50"
  }
  
  labels = {
    role        = "gpu"
    environment = var.environment
  }
}

# ===========================================
# LOAD BALANCER
# ===========================================

resource "hcloud_load_balancer" "vault" {
  name               = "vault-lb-${var.environment}"
  load_balancer_type = var.environment == "production" ? "lb21" : "lb11"
  location           = var.location
}

resource "hcloud_load_balancer_network" "vault" {
  load_balancer_id = hcloud_load_balancer.vault.id
  network_id       = hcloud_network.vault.id
  ip               = "10.0.1.5"
}

resource "hcloud_load_balancer_target" "workers" {
  count            = var.environment == "production" ? 3 : 2
  type             = "server"
  load_balancer_id = hcloud_load_balancer.vault.id
  server_id        = hcloud_server.workers[count.index].id
  use_private_ip   = true
}

# HTTPS
resource "hcloud_load_balancer_service" "https" {
  load_balancer_id = hcloud_load_balancer.vault.id
  protocol         = "tcp"
  listen_port      = 443
  destination_port = 443
  
  health_check {
    protocol = "tcp"
    port     = 443
    interval = 10
    timeout  = 5
    retries  = 3
  }
}

# HTTP (redirect to HTTPS)
resource "hcloud_load_balancer_service" "http" {
  load_balancer_id = hcloud_load_balancer.vault.id
  protocol         = "tcp"
  listen_port      = 80
  destination_port = 80
}

# ===========================================
# VOLUMES (Persistent Storage)
# ===========================================

# PostgreSQL Volume
resource "hcloud_volume" "postgres" {
  name      = "vault-postgres-${var.environment}"
  size      = var.environment == "production" ? 100 : 50
  location  = var.location
  format    = "ext4"
  
  labels = {
    service     = "postgres"
    environment = var.environment
  }
}

resource "hcloud_volume_attachment" "postgres" {
  volume_id = hcloud_volume.postgres.id
  server_id = hcloud_server.workers[0].id
  automount = true
}

# Neo4j Volume
resource "hcloud_volume" "neo4j" {
  name      = "vault-neo4j-${var.environment}"
  size      = var.environment == "production" ? 50 : 20
  location  = var.location
  format    = "ext4"
  
  labels = {
    service     = "neo4j"
    environment = var.environment
  }
}

# MinIO Volume (if not using external S3)
resource "hcloud_volume" "minio" {
  name      = "vault-minio-${var.environment}"
  size      = var.environment == "production" ? 500 : 100
  location  = var.location
  format    = "ext4"
  
  labels = {
    service     = "minio"
    environment = var.environment
  }
}

# Ollama Models Volume
resource "hcloud_volume" "ollama" {
  name      = "vault-ollama-${var.environment}"
  size      = 50
  location  = var.location
  format    = "ext4"
  
  labels = {
    service     = "ollama"
    environment = var.environment
  }
}

# ===========================================
# DNS (Optional - use with Hetzner DNS)
# ===========================================

# If using Hetzner DNS, uncomment:
# resource "hcloud_rdns" "lb" {
#   load_balancer_id = hcloud_load_balancer.vault.id
#   ip_address       = hcloud_load_balancer.vault.ipv4
#   dns_ptr          = "api.${var.domain}"
# }

# ===========================================
# OUTPUTS
# ===========================================

output "control_plane_ip" {
  value       = hcloud_server.control_plane.ipv4_address
  description = "Control plane public IP"
}

output "worker_ips" {
  value       = [for w in hcloud_server.workers : w.ipv4_address]
  description = "Worker node public IPs"
}

output "load_balancer_ip" {
  value       = hcloud_load_balancer.vault.ipv4
  description = "Load balancer public IP - Point DNS here"
}

output "private_network" {
  value       = hcloud_network.vault.ip_range
  description = "Private network CIDR"
}

output "kubeconfig_command" {
  value       = "ssh root@${hcloud_server.control_plane.ipv4_address} 'cat /etc/rancher/k3s/k3s.yaml' | sed 's/127.0.0.1/${hcloud_server.control_plane.ipv4_address}/g' > kubeconfig.yaml"
  description = "Command to get kubeconfig"
}

output "dns_records" {
  value = <<-EOT
    Create these DNS records:
    
    A    api.${var.domain}      → ${hcloud_load_balancer.vault.ipv4}
    A    ws.${var.domain}       → ${hcloud_load_balancer.vault.ipv4}
    A    storage.${var.domain}  → ${hcloud_load_balancer.vault.ipv4}
  EOT
  description = "Required DNS records"
}
