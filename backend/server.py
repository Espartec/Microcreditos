from fastapi import FastAPI, APIRouter, HTTPException, status
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
from enum import Enum

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
SECRET_KEY = os.environ.get('SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Enums
class UserRole(str, Enum):
    CLIENT = "client"
    LENDER = "lender"
    ADMIN = "admin"

class LoanStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    ACTIVE = "active"
    COMPLETED = "completed"
    DEFAULTED = "defaulted"

class PaymentStatus(str, Enum):
    PENDING = "pending"
    PAID = "paid"
    LATE = "late"
    OVERDUE = "overdue"

# Models
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    name: str
    role: UserRole
    cedula: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: UserRole
    cedula: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class Loan(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_id: str
    client_name: str
    lender_id: Optional[str] = None
    lender_name: Optional[str] = None
    amount: int
    interest_rate: float  # percentage
    term_months: int
    monthly_payment: int
    total_amount: int
    status: LoanStatus
    purpose: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    approved_at: Optional[datetime] = None
    start_date: Optional[datetime] = None

class LoanCreate(BaseModel):
    amount: int
    interest_rate: float
    term_months: int
    purpose: Optional[str] = None

class LoanApproval(BaseModel):
    loan_id: str
    lender_id: str
    start_date: datetime

class Payment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    loan_id: str
    client_id: str
    amount: int
    payment_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    payment_number: int
    notes: Optional[str] = None

class PaymentCreate(BaseModel):
    loan_id: str
    amount: int
    notes: Optional[str] = None

class PaymentSchedule(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    loan_id: str
    client_id: str
    client_name: str
    payment_number: int
    due_date: datetime
    amount: int
    status: PaymentStatus
    paid_date: Optional[datetime] = None

class PaymentScheduleUpdate(BaseModel):
    due_date: datetime

class LoanCalculation(BaseModel):
    amount: int
    interest_rate: float
    term_months: int

class LoanCalculationResult(BaseModel):
    monthly_payment: int
    total_amount: int
    total_interest: int
    schedule: List[dict]

# Helper Functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {"sub": user_id, "exp": expire}
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def calculate_loan(amount: int, interest_rate: float, term_months: int) -> dict:
    monthly_rate = interest_rate / 100 / 12
    if monthly_rate == 0:
        monthly_payment = amount / term_months
    else:
        monthly_payment = amount * (monthly_rate * (1 + monthly_rate)**term_months) / ((1 + monthly_rate)**term_months - 1)
    
    # Redondear a enteros
    monthly_payment = round(monthly_payment)
    total_amount = monthly_payment * term_months
    total_interest = total_amount - amount
    
    schedule = []
    balance = amount
    for i in range(1, term_months + 1):
        interest_payment = balance * monthly_rate
        principal_payment = monthly_payment - interest_payment
        balance -= principal_payment
        schedule.append({
            "payment_number": i,
            "payment": monthly_payment,
            "principal": round(principal_payment),
            "interest": round(interest_payment),
            "balance": round(max(balance, 0))
        })
    
    return {
        "monthly_payment": monthly_payment,
        "total_amount": total_amount,
        "total_interest": total_interest,
        "schedule": schedule
    }

# Auth Routes
@api_router.post("/auth/register", response_model=Token)
async def register(user_data: UserCreate):
    # Check if user exists
    existing = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password
    hashed_password = hash_password(user_data.password)
    
    # Create user
    user = User(
        email=user_data.email,
        name=user_data.name,
        role=user_data.role,
        cedula=user_data.cedula,
        phone=user_data.phone,
        address=user_data.address,
        active=True
    )
    
    user_doc = user.model_dump()
    user_doc["password"] = hashed_password
    user_doc["created_at"] = user_doc["created_at"].isoformat()
    
    await db.users.insert_one(user_doc)
    
    # Create token
    token = create_token(user.id)
    
    return Token(access_token=token, token_type="bearer", user=user)

@api_router.post("/auth/login", response_model=Token)
async def login(credentials: UserLogin):
    user_doc = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(credentials.password, user_doc["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Convert datetime
    if isinstance(user_doc["created_at"], str):
        user_doc["created_at"] = datetime.fromisoformat(user_doc["created_at"])
    
    user = User(**{k: v for k, v in user_doc.items() if k != "password"})
    token = create_token(user.id)
    
    return Token(access_token=token, token_type="bearer", user=user)

# User Routes
@api_router.get("/users", response_model=List[User])
async def get_users(role: Optional[str] = None):
    query = {}
    if role:
        query["role"] = role
    
    users = await db.users.find(query, {"_id": 0, "password": 0}).to_list(1000)
    for user in users:
        if isinstance(user["created_at"], str):
            user["created_at"] = datetime.fromisoformat(user["created_at"])
    return users

@api_router.get("/users/{user_id}", response_model=User)
async def get_user(user_id: str):
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if isinstance(user["created_at"], str):
        user["created_at"] = datetime.fromisoformat(user["created_at"])
    return User(**user)

# Loan Routes
@api_router.post("/loans/calculate", response_model=LoanCalculationResult)
async def calculate_loan_route(data: LoanCalculation):
    result = calculate_loan(data.amount, data.interest_rate, data.term_months)
    return LoanCalculationResult(**result)

@api_router.post("/loans", response_model=Loan)
async def create_loan(loan_data: LoanCreate, client_id: str, client_name: str):
    # Calculate loan details
    calc = calculate_loan(loan_data.amount, loan_data.interest_rate, loan_data.term_months)
    
    loan = Loan(
        client_id=client_id,
        client_name=client_name,
        amount=loan_data.amount,
        interest_rate=loan_data.interest_rate,
        term_months=loan_data.term_months,
        monthly_payment=calc["monthly_payment"],
        total_amount=calc["total_amount"],
        status=LoanStatus.PENDING,
        purpose=loan_data.purpose
    )
    
    loan_doc = loan.model_dump()
    loan_doc["created_at"] = loan_doc["created_at"].isoformat()
    
    await db.loans.insert_one(loan_doc)
    return loan

@api_router.get("/loans", response_model=List[Loan])
async def get_loans(client_id: Optional[str] = None, lender_id: Optional[str] = None, status: Optional[str] = None):
    query = {}
    if client_id:
        query["client_id"] = client_id
    if lender_id:
        query["lender_id"] = lender_id
    if status:
        query["status"] = status
    
    loans = await db.loans.find(query, {"_id": 0}).to_list(1000)
    for loan in loans:
        for field in ["created_at", "approved_at", "start_date"]:
            if field in loan and loan[field] and isinstance(loan[field], str):
                loan[field] = datetime.fromisoformat(loan[field])
        # Convert float amounts to integers for existing data
        for amount_field in ["amount", "monthly_payment", "total_amount"]:
            if amount_field in loan and isinstance(loan[amount_field], float):
                loan[amount_field] = round(loan[amount_field])
    return loans

@api_router.get("/loans/{loan_id}", response_model=Loan)
async def get_loan(loan_id: str):
    loan = await db.loans.find_one({"id": loan_id}, {"_id": 0})
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")
    for field in ["created_at", "approved_at", "start_date"]:
        if field in loan and loan[field] and isinstance(loan[field], str):
            loan[field] = datetime.fromisoformat(loan[field])
    # Convert float amounts to integers for existing data
    for amount_field in ["amount", "monthly_payment", "total_amount"]:
        if amount_field in loan and isinstance(loan[amount_field], float):
            loan[amount_field] = round(loan[amount_field])
    return Loan(**loan)

@api_router.post("/loans/{loan_id}/approve")
async def approve_loan(loan_id: str, approval: LoanApproval):
    loan = await db.loans.find_one({"id": loan_id}, {"_id": 0})
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")
    
    # Get lender info
    lender = await db.users.find_one({"id": approval.lender_id}, {"_id": 0})
    if not lender:
        raise HTTPException(status_code=404, detail="Lender not found")
    
    # Update loan
    await db.loans.update_one(
        {"id": loan_id},
        {"$set": {
            "status": LoanStatus.ACTIVE,
            "lender_id": approval.lender_id,
            "lender_name": lender["name"],
            "approved_at": datetime.now(timezone.utc).isoformat(),
            "start_date": approval.start_date.isoformat()
        }}
    )
    
    # Create payment schedule
    if isinstance(loan["created_at"], str):
        loan["created_at"] = datetime.fromisoformat(loan["created_at"])
    
    for i in range(1, loan["term_months"] + 1):
        due_date = approval.start_date + timedelta(days=30 * i)
        schedule = PaymentSchedule(
            loan_id=loan_id,
            client_id=loan["client_id"],
            client_name=loan["client_name"],
            payment_number=i,
            due_date=due_date,
            amount=loan["monthly_payment"],
            status=PaymentStatus.PENDING
        )
        schedule_doc = schedule.model_dump()
        schedule_doc["due_date"] = schedule_doc["due_date"].isoformat()
        await db.payment_schedules.insert_one(schedule_doc)
    
    return {"message": "Loan approved successfully"}

@api_router.post("/loans/{loan_id}/reject")
async def reject_loan(loan_id: str):
    result = await db.loans.update_one(
        {"id": loan_id},
        {"$set": {"status": LoanStatus.REJECTED}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Loan not found")
    return {"message": "Loan rejected"}

# Payment Routes
@api_router.post("/payments", response_model=Payment)
async def create_payment(payment_data: PaymentCreate, client_id: str):
    # Get loan
    loan = await db.loans.find_one({"id": payment_data.loan_id}, {"_id": 0})
    if not loan:
        raise HTTPException(status_code=404, detail="Préstamo no encontrado")
    
    if loan["status"] != LoanStatus.ACTIVE:
        raise HTTPException(status_code=400, detail="Solo se pueden hacer pagos en préstamos activos")
    
    payment_amount = payment_data.amount
    if payment_amount <= 0:
        raise HTTPException(status_code=400, detail="El monto del pago debe ser mayor a cero")
    
    # Obtener todas las cuotas pendientes ordenadas por número
    pending_schedules = await db.payment_schedules.find(
        {"loan_id": payment_data.loan_id, "status": PaymentStatus.PENDING},
        {"_id": 0}
    ).sort("payment_number", 1).to_list(1000)
    
    if not pending_schedules:
        raise HTTPException(status_code=400, detail="Este préstamo ya está completamente pagado")
    
    # Calcular saldo total pendiente
    total_pending = sum(schedule["amount"] for schedule in pending_schedules)
    
    # Crear el registro de pago
    payment = Payment(
        loan_id=payment_data.loan_id,
        client_id=client_id,
        amount=payment_amount,
        payment_number=pending_schedules[0]["payment_number"],  # Número de la primera cuota pendiente
        notes=payment_data.notes or f"Pago procesado - Saldo pendiente antes: ${total_pending:.2f}"
    )
    
    payment_doc = payment.model_dump()
    payment_doc["payment_date"] = payment_doc["payment_date"].isoformat()
    await db.payments.insert_one(payment_doc)
    
    # Procesar el pago aplicándolo a las cuotas
    remaining_payment = payment_amount
    schedules_to_update = []
    
    for schedule in pending_schedules:
        if remaining_payment <= 0:
            break
            
        schedule_amount = schedule["amount"]
        
        if remaining_payment >= schedule_amount:
            # Pago completo de esta cuota
            schedules_to_update.append({
                "id": schedule["id"],
                "status": PaymentStatus.PAID,
                "amount_paid": schedule_amount,
                "remaining_amount": 0
            })
            remaining_payment -= schedule_amount
        else:
            # Pago parcial de esta cuota
            new_amount = schedule_amount - remaining_payment
            schedules_to_update.append({
                "id": schedule["id"],
                "status": PaymentStatus.PENDING,
                "amount_paid": remaining_payment,
                "remaining_amount": new_amount,
                "update_amount": True
            })
            remaining_payment = 0
    
    # Aplicar las actualizaciones a las cuotas
    for update in schedules_to_update:
        if update["status"] == PaymentStatus.PAID:
            # Marcar cuota como pagada
            await db.payment_schedules.update_one(
                {"id": update["id"]},
                {"$set": {
                    "status": PaymentStatus.PAID,
                    "paid_date": datetime.now(timezone.utc).isoformat()
                }}
            )
        else:
            # Actualizar monto pendiente de la cuota
            await db.payment_schedules.update_one(
                {"id": update["id"]},
                {"$set": {"amount": update["remaining_amount"]}}
            )
    
    # Si hay excedente de pago, reducir la siguiente cuota pendiente
    if remaining_payment > 0:
        next_pending = await db.payment_schedules.find_one(
            {"loan_id": payment_data.loan_id, "status": PaymentStatus.PENDING},
            {"_id": 0},
            sort=[("payment_number", 1)]
        )
        
        if next_pending:
            new_amount = max(0, next_pending["amount"] - remaining_payment)
            await db.payment_schedules.update_one(
                {"id": next_pending["id"]},
                {"$set": {"amount": new_amount}}
            )
            
            # Si la reducción hace que la cuota quede en 0, marcarla como pagada
            if new_amount == 0:
                await db.payment_schedules.update_one(
                    {"id": next_pending["id"]},
                    {"$set": {
                        "status": PaymentStatus.PAID,
                        "paid_date": datetime.now(timezone.utc).isoformat()
                    }}
                )
    
    # Verificar si el préstamo está completamente pagado
    remaining_schedules = await db.payment_schedules.count_documents({
        "loan_id": payment_data.loan_id,
        "status": PaymentStatus.PENDING,
        "amount": {"$gt": 0}
    })
    
    if remaining_schedules == 0:
        # Marcar todas las cuotas restantes como pagadas
        await db.payment_schedules.update_many(
            {
                "loan_id": payment_data.loan_id,
                "status": PaymentStatus.PENDING
            },
            {"$set": {
                "status": PaymentStatus.PAID,
                "paid_date": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        # Marcar préstamo como completado
        await db.loans.update_one(
            {"id": payment_data.loan_id},
            {"$set": {"status": LoanStatus.COMPLETED}}
        )
    
    # Agregar información del procesamiento al pago
    payment.notes += f" | Restante después del pago: ${remaining_payment:.2f}"
    
    return payment

@api_router.get("/loans/{loan_id}/payment-status")
async def get_loan_payment_status(loan_id: str):
    """Obtiene el estado detallado de pagos de un préstamo"""
    loan = await db.loans.find_one({"id": loan_id}, {"_id": 0})
    if not loan:
        raise HTTPException(status_code=404, detail="Préstamo no encontrado")
    
    # Obtener todos los pagos realizados
    payments = await db.payments.find({"loan_id": loan_id}, {"_id": 0}).to_list(1000)
    total_paid = sum(payment["amount"] for payment in payments)
    
    # Obtener cronograma actual
    schedules = await db.payment_schedules.find({"loan_id": loan_id}, {"_id": 0}).sort("payment_number", 1).to_list(1000)
    
    # Calcular totales
    original_total = loan["total_amount"]
    pending_amount = sum(schedule["amount"] for schedule in schedules if schedule["status"] == PaymentStatus.PENDING)
    paid_schedules = len([s for s in schedules if s["status"] == PaymentStatus.PAID])
    total_schedules = len(schedules)
    
    return {
        "loan_id": loan_id,
        "original_total": original_total,
        "total_paid": total_paid,
        "pending_amount": pending_amount,
        "paid_schedules": paid_schedules,
        "total_schedules": total_schedules,
        "completion_percentage": (paid_schedules / total_schedules * 100) if total_schedules > 0 else 0,
        "is_completed": pending_amount == 0,
        "payment_count": len(payments)
    }

@api_router.get("/payments", response_model=List[Payment])
async def get_payments(loan_id: Optional[str] = None, client_id: Optional[str] = None):
    query = {}
    if loan_id:
        query["loan_id"] = loan_id
    if client_id:
        query["client_id"] = client_id
    
    payments = await db.payments.find(query, {"_id": 0}).to_list(1000)
    for payment in payments:
        if isinstance(payment["payment_date"], str):
            payment["payment_date"] = datetime.fromisoformat(payment["payment_date"])
        # Convert float amounts to integers for existing data
        if "amount" in payment and isinstance(payment["amount"], float):
            payment["amount"] = round(payment["amount"])
    return payments

# Payment Schedule Routes
@api_router.get("/schedules", response_model=List[PaymentSchedule])
async def get_schedules(loan_id: Optional[str] = None, client_id: Optional[str] = None, status: Optional[str] = None):
    query = {}
    if loan_id:
        query["loan_id"] = loan_id
    if client_id:
        query["client_id"] = client_id
    if status:
        query["status"] = status
    
    schedules = await db.payment_schedules.find(query, {"_id": 0}).to_list(1000)
    for schedule in schedules:
        for field in ["due_date", "paid_date"]:
            if field in schedule and schedule[field] and isinstance(schedule[field], str):
                schedule[field] = datetime.fromisoformat(schedule[field])
        # Convert float amounts to integers for existing data
        if "amount" in schedule and isinstance(schedule["amount"], float):
            schedule["amount"] = round(schedule["amount"])
    return schedules

@api_router.get("/schedules/today", response_model=List[PaymentSchedule])
async def get_today_schedules():
    today = datetime.now(timezone.utc).date()
    tomorrow = today + timedelta(days=1)
    
    schedules = await db.payment_schedules.find({"status": PaymentStatus.PENDING}, {"_id": 0}).to_list(1000)
    
    result = []
    for schedule in schedules:
        if isinstance(schedule["due_date"], str):
            schedule["due_date"] = datetime.fromisoformat(schedule["due_date"])
        
        schedule_date = schedule["due_date"].date()
        if schedule_date == today:
            result.append(schedule)
    
    return result

@api_router.put("/schedules/{schedule_id}/update-date")
async def update_schedule_date(schedule_id: str, update: PaymentScheduleUpdate):
    result = await db.payment_schedules.update_one(
        {"id": schedule_id},
        {"$set": {"due_date": update.due_date.isoformat()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Schedule not found")
    return {"message": "Schedule updated successfully"}

# Dashboard Stats
@api_router.get("/stats/dashboard")
async def get_dashboard_stats(user_id: str, role: str):
    stats = {}
    
    if role == UserRole.CLIENT:
        # Client stats
        active_loans = await db.loans.count_documents({"client_id": user_id, "status": LoanStatus.ACTIVE})
        pending_loans = await db.loans.count_documents({"client_id": user_id, "status": LoanStatus.PENDING})
        completed_loans = await db.loans.count_documents({"client_id": user_id, "status": LoanStatus.COMPLETED})
        
        # Total debt
        loans = await db.loans.find({"client_id": user_id, "status": LoanStatus.ACTIVE}, {"_id": 0}).to_list(1000)
        total_debt = sum(loan["total_amount"] for loan in loans)
        
        # Paid amount
        payments = await db.payments.find({"client_id": user_id}, {"_id": 0}).to_list(1000)
        total_paid = sum(payment["amount"] for payment in payments)
        
        stats = {
            "active_loans": active_loans,
            "pending_loans": pending_loans,
            "completed_loans": completed_loans,
            "total_debt": round(total_debt, 2),
            "total_paid": round(total_paid, 2),
            "remaining": round(total_debt - total_paid, 2)
        }
    
    elif role == UserRole.LENDER:
        # Lender stats
        active_loans = await db.loans.count_documents({"lender_id": user_id, "status": LoanStatus.ACTIVE})
        completed_loans = await db.loans.count_documents({"lender_id": user_id, "status": LoanStatus.COMPLETED})
        
        loans = await db.loans.find({"lender_id": user_id}, {"_id": 0}).to_list(1000)
        total_lent = sum(loan["amount"] for loan in loans)
        total_expected = sum(loan["total_amount"] for loan in loans if loan["status"] in [LoanStatus.ACTIVE, LoanStatus.COMPLETED])
        
        stats = {
            "active_loans": active_loans,
            "completed_loans": completed_loans,
            "total_lent": round(total_lent, 2),
            "total_expected": round(total_expected, 2)
        }
    
    else:  # Admin
        total_loans = await db.loans.count_documents({})
        pending_loans = await db.loans.count_documents({"status": LoanStatus.PENDING})
        active_loans = await db.loans.count_documents({"status": LoanStatus.ACTIVE})
        total_users = await db.users.count_documents({})
        
        all_loans = await db.loans.find({}, {"_id": 0}).to_list(10000)
        total_volume = sum(loan["amount"] for loan in all_loans)
        
        stats = {
            "total_loans": total_loans,
            "pending_loans": pending_loans,
            "active_loans": active_loans,
            "total_users": total_users,
            "total_volume": round(total_volume, 2)
        }
    
    return stats

# ==================== ADMIN EXTENSIONS ====================
# Importar modelos adicionales
from admin_extensions import (
    SystemConfig, SystemConfigUpdate, UserUpdate, PasswordUpdate,
    LoanProposal, LoanProposalCreate, LoanProposalResponse, ProposalStatus
)

# System Configuration Routes
@api_router.get("/config/system")
async def get_system_config():
    config = await db.system_config.find_one({}, {"_id": 0})
    if not config:
        # Crear configuración por defecto si no existe
        default_config = {
            "id": str(uuid.uuid4()),
            "default_interest_rate": 12.0,
            "available_interest_rates": [8.0, 10.0, 12.0, 15.0, 18.0, 20.0],
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "updated_by": "system"
        }
        await db.system_config.insert_one(default_config)
        config = default_config
    
    if isinstance(config.get("updated_at"), str):
        config["updated_at"] = datetime.fromisoformat(config["updated_at"])
    
    return config

@api_router.put("/config/system")
async def update_system_config(config_update: SystemConfigUpdate, admin_id: str):
    config = await db.system_config.find_one({}, {"_id": 0})
    
    update_data = {
        "default_interest_rate": config_update.default_interest_rate,
        "available_interest_rates": config_update.available_interest_rates,
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "updated_by": admin_id
    }
    
    if config:
        await db.system_config.update_one({"id": config["id"]}, {"$set": update_data})
    else:
        update_data["id"] = str(uuid.uuid4())
        await db.system_config.insert_one(update_data)
    
    return {"message": "Configuración actualizada exitosamente"}

# User Management Routes (Admin only)
@api_router.put("/users/{user_id}")
async def update_user(user_id: str, user_update: UserUpdate):
    update_data = {k: v for k, v in user_update.model_dump().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No hay datos para actualizar")
    
    result = await db.users.update_one({"id": user_id}, {"$set": update_data})
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    return {"message": "Usuario actualizado exitosamente"}

@api_router.put("/users/{user_id}/password")
async def update_user_password(user_id: str, password_update: PasswordUpdate):
    hashed_password = hash_password(password_update.new_password)
    
    result = await db.users.update_one(
        {"id": user_id},
        {"$set": {"password": hashed_password}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    return {"message": "Contraseña actualizada exitosamente"}

@api_router.get("/users/{user_id}/active-loans")
async def check_user_active_loans(user_id: str):
    # Verificar si el usuario tiene préstamos activos
    active_loans_count = await db.loans.count_documents({
        "$or": [
            {"client_id": user_id, "status": {"$in": [LoanStatus.ACTIVE, LoanStatus.PENDING]}},
            {"lender_id": user_id, "status": LoanStatus.ACTIVE}
        ]
    })
    
    return {
        "has_active_loans": active_loans_count > 0,
        "active_loans_count": active_loans_count
    }

@api_router.put("/users/{user_id}/toggle-active")
async def toggle_user_active(user_id: str):
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    new_status = not user.get("active", True)
    
    result = await db.users.update_one(
        {"id": user_id},
        {"$set": {"active": new_status}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    status_text = "activado" if new_status else "desactivado"
    return {"message": f"Usuario {status_text} exitosamente", "active": new_status}

@api_router.get("/users/{lender_id}/assigned-loans")
async def get_lender_assigned_loans(lender_id: str):
    """Obtiene todos los préstamos asignados a un prestamista"""
    loans = await db.loans.find({
        "lender_id": lender_id,
        "status": {"$in": [LoanStatus.ACTIVE, LoanStatus.PENDING]}
    }, {"_id": 0}).to_list(1000)
    
    # Obtener información única de clientes
    client_info = {}
    for loan in loans:
        client_id = loan["client_id"]
        if client_id not in client_info:
            client = await db.users.find_one({"id": client_id}, {"_id": 0, "password": 0})
            if client:
                client_info[client_id] = {
                    "client": client,
                    "active_loans": [],
                    "pending_loans": []
                }
        
        if loan["status"] == LoanStatus.ACTIVE:
            client_info[client_id]["active_loans"].append(loan)
        else:
            client_info[client_id]["pending_loans"].append(loan)
    
    return {
        "clients_count": len(client_info),
        "clients": list(client_info.values()),
        "total_active_loans": len([l for l in loans if l["status"] == LoanStatus.ACTIVE]),
        "total_pending_loans": len([l for l in loans if l["status"] == LoanStatus.PENDING])
    }

@api_router.post("/users/{old_lender_id}/reassign-clients")
async def reassign_lender_clients(old_lender_id: str, new_lender_id: str, admin_id: str):
    """Reasigna todos los clientes de un prestamista a otro"""
    # Verificar que ambos prestamistas existen
    old_lender = await db.users.find_one({"id": old_lender_id}, {"_id": 0})
    new_lender = await db.users.find_one({"id": new_lender_id}, {"_id": 0})
    
    if not old_lender:
        raise HTTPException(status_code=404, detail="Prestamista original no encontrado")
    if not new_lender:
        raise HTTPException(status_code=404, detail="Nuevo prestamista no encontrado")
    if new_lender["role"] != "lender":
        raise HTTPException(status_code=400, detail="El usuario destino debe ser prestamista")
    
    # Actualizar todos los préstamos activos y pendientes
    result = await db.loans.update_many(
        {
            "lender_id": old_lender_id,
            "status": {"$in": [LoanStatus.ACTIVE, LoanStatus.PENDING]}
        },
        {"$set": {
            "lender_id": new_lender_id,
            "lender_name": new_lender["name"]
        }}
    )
    
    # Actualizar schedules de pagos
    await db.payment_schedules.update_many(
        {"loan_id": {"$in": []}},  # Necesitaríamos obtener los loan_ids pero para simplificar...
        {"$set": {"lender_id": new_lender_id}}
    )
    
    return {
        "message": f"Se reasignaron {result.modified_count} préstamos de {old_lender['name']} a {new_lender['name']}",
        "modified_loans": result.modified_count
    }

# Loan Proposal Routes
@api_router.post("/loans/{loan_id}/propose")
async def create_loan_proposal(loan_id: str, proposal_data: LoanProposalCreate):
    # Obtener el préstamo
    loan = await db.loans.find_one({"id": loan_id}, {"_id": 0})
    if not loan:
        raise HTTPException(status_code=404, detail="Préstamo no encontrado")
    
    if loan["status"] != LoanStatus.PENDING:
        raise HTTPException(status_code=400, detail="Solo se pueden crear propuestas para préstamos pendientes")
    
    # Obtener prestamista
    lender = await db.users.find_one({"id": proposal_data.lender_id}, {"_id": 0})
    if not lender:
        raise HTTPException(status_code=404, detail="Prestamista no encontrado")
    
    # Calcular nuevo préstamo con tasa propuesta
    if isinstance(loan["created_at"], str):
        loan["created_at"] = datetime.fromisoformat(loan["created_at"])
    
    new_calc = calculate_loan(loan["amount"], proposal_data.proposed_interest_rate, loan["term_months"])
    
    # Crear propuesta
    proposal = LoanProposal(
        id=str(uuid.uuid4()),
        loan_id=loan_id,
        client_id=loan["client_id"],
        client_name=loan["client_name"],
        lender_id=proposal_data.lender_id,
        lender_name=lender["name"],
        original_interest_rate=loan["interest_rate"],
        proposed_interest_rate=proposal_data.proposed_interest_rate,
        original_monthly_payment=loan["monthly_payment"],
        proposed_monthly_payment=new_calc["monthly_payment"],
        original_total_amount=loan["total_amount"],
        proposed_total_amount=new_calc["total_amount"],
        reason=proposal_data.reason,
        status=ProposalStatus.PENDING,
        created_at=datetime.now(timezone.utc)
    )
    
    proposal_doc = proposal.model_dump()
    proposal_doc["created_at"] = proposal_doc["created_at"].isoformat()
    proposal_doc["start_date"] = proposal_data.start_date.isoformat()
    
    await db.loan_proposals.insert_one(proposal_doc)
    
    return proposal

@api_router.get("/proposals", response_model=List[LoanProposal])
async def get_proposals(client_id: Optional[str] = None, status: Optional[str] = None):
    query = {}
    if client_id:
        query["client_id"] = client_id
    if status:
        query["status"] = status
    
    proposals = await db.loan_proposals.find(query, {"_id": 0}).to_list(1000)
    for proposal in proposals:
        if isinstance(proposal["created_at"], str):
            proposal["created_at"] = datetime.fromisoformat(proposal["created_at"])
        if "responded_at" in proposal and proposal["responded_at"] and isinstance(proposal["responded_at"], str):
            proposal["responded_at"] = datetime.fromisoformat(proposal["responded_at"])
    
    return proposals

@api_router.post("/proposals/{proposal_id}/respond")
async def respond_to_proposal(proposal_id: str, response: LoanProposalResponse):
    # Obtener propuesta
    proposal = await db.loan_proposals.find_one({"id": proposal_id}, {"_id": 0})
    if not proposal:
        raise HTTPException(status_code=404, detail="Propuesta no encontrada")
    
    if proposal["status"] != ProposalStatus.PENDING:
        raise HTTPException(status_code=400, detail="Esta propuesta ya fue respondida")
    
    # Actualizar estado de la propuesta
    new_status = ProposalStatus.ACCEPTED if response.accepted else ProposalStatus.REJECTED
    await db.loan_proposals.update_one(
        {"id": proposal_id},
        {"$set": {
            "status": new_status,
            "responded_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    if response.accepted:
        # Obtener la fecha de inicio de la propuesta
        start_date_str = proposal.get("start_date")
        if isinstance(start_date_str, str):
            start_date = datetime.fromisoformat(start_date_str)
        else:
            start_date = start_date_str
        
        # Actualizar el préstamo con la nueva tasa
        await db.loans.update_one(
            {"id": proposal["loan_id"]},
            {"$set": {
                "interest_rate": proposal["proposed_interest_rate"],
                "monthly_payment": proposal["proposed_monthly_payment"],
                "total_amount": proposal["proposed_total_amount"],
                "status": LoanStatus.ACTIVE,
                "lender_id": proposal["lender_id"],
                "lender_name": proposal["lender_name"],
                "approved_at": datetime.now(timezone.utc).isoformat(),
                "start_date": start_date.isoformat()
            }}
        )
        
        # Obtener el préstamo actualizado
        loan = await db.loans.find_one({"id": proposal["loan_id"]}, {"_id": 0})
        
        # Crear cronograma de pagos con la nueva tasa
        for i in range(1, loan["term_months"] + 1):
            due_date = start_date + timedelta(days=30 * i)
            schedule = PaymentSchedule(
                loan_id=loan["id"],
                client_id=loan["client_id"],
                client_name=loan["client_name"],
                payment_number=i,
                due_date=due_date,
                amount=loan["monthly_payment"],
                status=PaymentStatus.PENDING
            )
            schedule_doc = schedule.model_dump()
            schedule_doc["due_date"] = schedule_doc["due_date"].isoformat()
            await db.payment_schedules.insert_one(schedule_doc)
        
        return {"message": "Propuesta aceptada y préstamo activado exitosamente"}
    else:
        return {"message": "Propuesta rechazada"}

@api_router.get("/proposals/count")
async def get_proposals_count(client_id: str):
    count = await db.loan_proposals.count_documents({
        "client_id": client_id,
        "status": ProposalStatus.PENDING
    })
    return {"count": count}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
