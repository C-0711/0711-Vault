# Hetzner Cloud Variables

variable "k3s_token" {
  description = "K3s cluster token (generate with: openssl rand -hex 32)"
  type        = string
  sensitive   = true
}

# ===========================================
# SERVER TYPES (Hetzner Cloud)
# ===========================================
# 
# Shared vCPU (CPX):
#   cpx11:  2 vCPU,  2 GB RAM,  40 GB SSD  -  €4.85/mo
#   cpx21:  3 vCPU,  4 GB RAM,  80 GB SSD  -  €8.98/mo
#   cpx31:  4 vCPU,  8 GB RAM, 160 GB SSD  - €16.90/mo
#   cpx41:  8 vCPU, 16 GB RAM, 240 GB SSD  - €31.90/mo
#   cpx51: 16 vCPU, 32 GB RAM, 360 GB SSD  - €63.90/mo
#
# Dedicated vCPU (CCX):
#   ccx13:  2 vCPU,   8 GB RAM,  80 GB SSD  - €14.90/mo
#   ccx23:  4 vCPU,  16 GB RAM, 160 GB SSD  - €29.90/mo
#   ccx33:  8 vCPU,  32 GB RAM, 240 GB SSD  - €54.90/mo
#   ccx43: 16 vCPU,  64 GB RAM, 360 GB SSD  - €99.90/mo
#   ccx53: 32 vCPU, 128 GB RAM, 600 GB SSD  - €179.90/mo
#
# Dedicated ARM (CAX):
#   cax11:  2 vCPU,  4 GB RAM,  40 GB SSD  -  €3.85/mo
#   cax21:  4 vCPU,  8 GB RAM,  80 GB SSD  -  €6.90/mo
#   cax31:  8 vCPU, 16 GB RAM, 160 GB SSD  - €13.90/mo
#   cax41: 16 vCPU, 32 GB RAM, 320 GB SSD  - €26.90/mo
#
# ===========================================

# ===========================================
# VOLUME PRICING
# ===========================================
#
# €0.052/GB/month (SSD)
# 50 GB  = €2.60/mo
# 100 GB = €5.20/mo
# 500 GB = €26.00/mo
#
# ===========================================

# ===========================================
# LOAD BALANCER PRICING
# ===========================================
#
# lb11:  25 targets,   5 services  -  €5.83/mo
# lb21:  75 targets,  25 services  - €12.49/mo
# lb31: 150 targets, 100 services  - €35.90/mo
#
# ===========================================

# ===========================================
# TRAFFIC
# ===========================================
#
# 20 TB included per server!
# Additional: €1.00/TB
#
# ===========================================
