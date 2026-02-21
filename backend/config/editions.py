# P1-01: Vault Edition Configuration Schema
from enum import Enum
from typing import Dict, List, Optional
from pydantic import BaseModel

class VaultEdition(str, Enum):
    CORE = "core"
    INTELLIGENCE = "intelligence"
    ENTERPRISE = "enterprise"

class PipelineConfig(BaseModel):
    enabled: bool = False
    auto_extract: bool = True
    schema: str = "ETIM-9.0"
    max_concurrent_jobs: int = 5
    webhook_url: str = "internal://ai-builder"

class EditionLimits(BaseModel):
    storage_gb: int
    users: int
    extractions_per_month: int
    containers: int
    api_requests_per_day: int
    mcp_agents: int
    dpp_certifications: int

class EditionFeatures(BaseModel):
    secure_storage: bool = True
    folder_management: bool = True
    sharing: bool = True
    s3_api: bool = True
    intelligence_pipeline: bool = False
    container_export: bool = False
    citations: bool = False
    bigc_agents: bool = False
    dpp_certification: bool = False
    mcp_integration: bool = False
    custom_schemas: bool = False
    priority_support: bool = False
    sla_guarantee: bool = False

EDITION_CONFIGS: Dict[VaultEdition, dict] = {
    VaultEdition.CORE: {
        "name": "Vault Core",
        "price_monthly": 99,
        "price_annual": 990,
        "tagline": "Secure enterprise storage",
        "limits": EditionLimits(
            storage_gb=100,
            users=10,
            extractions_per_month=0,
            containers=0,
            api_requests_per_day=1000,
            mcp_agents=0,
            dpp_certifications=0
        ),
        "features": EditionFeatures(
            secure_storage=True,
            folder_management=True,
            sharing=True,
            s3_api=True,
            intelligence_pipeline=False,
            container_export=False,
            citations=False,
        )
    },
    VaultEdition.INTELLIGENCE: {
        "name": "Vault Intelligence",
        "price_monthly": 499,
        "price_annual": 4990,
        "tagline": "Storage that thinks",
        "limits": EditionLimits(
            storage_gb=500,
            users=50,
            extractions_per_month=5000,
            containers=50000,
            api_requests_per_day=10000,
            mcp_agents=0,
            dpp_certifications=100
        ),
        "features": EditionFeatures(
            secure_storage=True,
            folder_management=True,
            sharing=True,
            s3_api=True,
            intelligence_pipeline=True,
            container_export=True,
            citations=True,
            priority_support=True,
        )
    },
    VaultEdition.ENTERPRISE: {
        "name": "Vault Enterprise",
        "price_monthly": None,  # Custom
        "price_annual": None,
        "tagline": "Full platform power",
        "limits": EditionLimits(
            storage_gb=-1,  # Unlimited
            users=-1,
            extractions_per_month=-1,
            containers=-1,
            api_requests_per_day=-1,
            mcp_agents=-1,
            dpp_certifications=-1
        ),
        "features": EditionFeatures(
            secure_storage=True,
            folder_management=True,
            sharing=True,
            s3_api=True,
            intelligence_pipeline=True,
            container_export=True,
            citations=True,
            bigc_agents=True,
            dpp_certification=True,
            mcp_integration=True,
            custom_schemas=True,
            priority_support=True,
            sla_guarantee=True,
        )
    }
}

def get_edition_config(edition: VaultEdition) -> dict:
    return EDITION_CONFIGS[edition]

def check_feature_access(edition: VaultEdition, feature: str) -> bool:
    config = EDITION_CONFIGS[edition]
    return getattr(config["features"], feature, False)

def check_limit(edition: VaultEdition, limit: str, current_value: int) -> bool:
    config = EDITION_CONFIGS[edition]
    max_value = getattr(config["limits"], limit, 0)
    if max_value == -1:  # Unlimited
        return True
    return current_value < max_value
