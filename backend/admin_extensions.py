"""
Extensiones administrativas para el sistema de préstamos
Incluye: gestión de usuarios, configuraciones del sistema, y propuestas de préstamos
"""
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime
from enum import Enum

# Enums adicionales
class ProposalStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"

# Modelos para configuración del sistema
class SystemConfig(BaseModel):
    id: str
    default_interest_rate: float
    available_interest_rates: List[float]
    updated_at: datetime
    updated_by: str

class SystemConfigUpdate(BaseModel):
    default_interest_rate: float
    available_interest_rates: List[float]

# Modelos para gestión de usuarios
class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    cedula: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    active: Optional[bool] = None

class PasswordUpdate(BaseModel):
    new_password: str

# Modelos para propuestas de préstamo
class LoanProposal(BaseModel):
    id: str
    loan_id: str
    client_id: str
    client_name: str
    lender_id: str
    lender_name: str
    original_interest_rate: float
    proposed_interest_rate: float
    original_monthly_payment: float
    proposed_monthly_payment: float
    original_total_amount: float
    proposed_total_amount: float
    reason: Optional[str] = None
    status: ProposalStatus
    created_at: datetime
    responded_at: Optional[datetime] = None

class LoanProposalCreate(BaseModel):
    loan_id: str
    lender_id: str
    proposed_interest_rate: float
    reason: Optional[str] = None
    start_date: datetime

class LoanProposalResponse(BaseModel):
    proposal_id: str
    accepted: bool
