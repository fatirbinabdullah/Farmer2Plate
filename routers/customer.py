# routers/customer.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database.db import get_db
from models.user import User, UserRole
from schemas.customer import CustomerRegister, CustomerLogin, CustomerResponse, CustomerUpdate
from core.security import hash_password, verify_password, create_access_token

# কাস্টমারের জন্য API গুচ্ছের রাউটার
router = APIRouter(prefix="/customer", tags=["Customer"])


# ✅ কাস্টমার অ্যাকাউন্ট তৈরি করা (Register)
@router.post("/register", response_model=CustomerResponse)
def register_customer(data: CustomerRegister, db: Session = Depends(get_db)):
    # ডাটাবেসে চেক করা হচ্ছে ফোন নম্বরটি আগে ব্যহার হয়েছে কি না
    existing = db.query(User).filter(User.phone == data.phone).first()

    if existing:
        raise HTTPException(status_code=400, detail="Phone already registered")

    # কাস্টমারের ডাটাবেস অবজেক্ট তৈরি
    customer = User(
        name=data.name,
        phone=data.phone,
        password=hash_password(data.password), # পাসওয়ার্ড হ্যাস করে সেভ করা
        role=UserRole.customer,
        address=data.address,
        latitude=data.latitude,
        longitude=data.longitude
    )

    db.add(customer)
    db.commit()
    db.refresh(customer)

    return customer


# ✅ কাস্টমার লগইন (JWT)
@router.post("/login")
def login_customer(data: CustomerLogin, db: Session = Depends(get_db)):
    # কাস্টমারের নম্বরটি ডাটাবেস থেকে খুঁজে বের করা
    customer = db.query(User).filter(
        User.phone == data.phone,
        User.role == UserRole.customer
    ).first()

    # যদি কাস্টমার না পাওয়া যায় বা পাসওয়ার্ড ভুল হয়
    if not customer or not verify_password(data.password, customer.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # যদি অ্যাডমিন অ্যাকাউন্ট ব্লক করে রাখে
    if not customer.is_active:
        raise HTTPException(status_code=403, detail="এই অ্যাকাউন্টটি নিষ্ক্রিয় করা হয়েছে। অনুগ্রহ করে অ্যাডমিনের সাথে যোগাযোগ করুন।")

    # সফল হলে টোকেন তৈরি করা
    token = create_access_token(
        data={"user_id": customer.id, "role": customer.role}
    )

    return {
        "access_token": token,
        "token_type": "bearer"
    }


# ✅ কাস্টমারের প্রোফাইল ডাটা রিড করা
@router.get("/profile/{customer_id}", response_model=CustomerResponse)
def get_customer(customer_id: int, db: Session = Depends(get_db)):
    customer = db.query(User).filter(
        User.id == customer_id,
        User.role == UserRole.customer
    ).first()

    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    return customer


# ✅ কাস্টমারের প্রোফাইল আপডেট করা
@router.put("/update/{customer_id}", response_model=CustomerResponse)
def update_customer(customer_id: int, data: CustomerUpdate, db: Session = Depends(get_db)):
    customer = db.query(User).filter(
        User.id == customer_id,
        User.role == UserRole.customer
    ).first()

    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    # রিকোয়েস্টে যে ভ্যালুগুলো দেওয়া হয়েছে শুধুমাত্র সেগুলোই আপডেট করা
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(customer, key, value)

    db.commit()
    db.refresh(customer)

    return customer


# ❌ কাস্টমারের অ্যাকাউন্ট ডিলিট করা
@router.delete("/delete/{customer_id}")
def delete_customer(customer_id: int, db: Session = Depends(get_db)):
    customer = db.query(User).filter(
        User.id == customer_id,
        User.role == UserRole.customer
    ).first()

    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    db.delete(customer)
    db.commit()

    return {"message": "Customer deleted"}