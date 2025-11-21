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
class PaymentFrequency(BaseModel):
    id: str
    name: str  # "Diario", "Día de por medio", "Semanal", "Mensual"
    days: int  # 1, 2, 7, 30
    active: bool = True

class SystemConfig(BaseModel):
    id: str
    default_interest_rate: float
    available_interest_rates: List[float]
    payment_frequencies: List[PaymentFrequency] = []
    default_system_fee: float = 0.5  # Porcentaje de sistematización (0.5%)
    available_system_fees: List[float] = [0.0, 0.5, 1.0, 1.5, 2.0]
    default_insurance_fee: float = 1.0  # Porcentaje de seguro (1.0%)
    available_insurance_fees: List[float] = [0.0, 0.5, 1.0, 1.5, 2.0, 3.0]
    updated_at: datetime
    updated_by: str

class SystemConfigUpdate(BaseModel):
    default_interest_rate: float
    available_interest_rates: List[float]
    payment_frequencies: Optional[List[dict]] = None
    default_system_fee: Optional[float] = None
    available_system_fees: Optional[List[float]] = None
    default_insurance_fee: Optional[float] = None
    available_insurance_fees: Optional[List[float]] = None

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
    original_monthly_payment: int
    proposed_monthly_payment: int
    original_total_amount: int
    proposed_total_amount: int
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

# Modelos para gestión financiera
class MonthlyExpense(BaseModel):
    id: str
    description: str
    amount: int
    category: Optional[str] = None  # Ahora opcional
    month: int  # 1-12
    year: int
    is_fixed: bool = False  # True si es gasto fijo/recurrente
    created_at: datetime
    created_by: str

class MonthlyExpenseCreate(BaseModel):
    description: str
    amount: int
    category: Optional[str] = None
    month: int
    year: int
    is_fixed: bool = False

class FixedExpense(BaseModel):
    id: str
    description: str
    amount: int
    created_at: datetime
    created_by: str
    active: bool = True

class FixedExpenseCreate(BaseModel):
    description: str
    amount: int

class MonthlyUtility(BaseModel):
    month: int
    year: int
    total_interest_collected: int
    total_payments: int
    active_loans_count: int
    completed_loans_count: int

class FinancialComparison(BaseModel):
    month: int
    year: int
    total_utility: int  # intereses cobrados
    total_expenses: int  # gastos
    net_profit: int  # utilidad - gastos
    expenses_breakdown: List[dict]  # desglose por categoría
