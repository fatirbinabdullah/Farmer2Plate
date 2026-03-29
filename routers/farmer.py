# routers/farmer.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database.db import get_db
from models.user import User, UserRole
from schemas.farmer import FarmerRegister, FarmerLogin, FarmerResponse, FarmerUpdate
from core.security import hash_password, verify_password, create_access_token, get_current_user
from core.config import settings

# farmer related API
router = APIRouter(prefix="/farmer", tags=["Farmer"])


# farmer register
@router.post("/register", response_model=FarmerResponse)
def register_farmer(data: FarmerRegister, db: Session = Depends(get_db)):
    # check if phone number already registered
    existing = db.query(User).filter(User.phone==data.phone).first()

    if existing:
        raise HTTPException(status_code=400, detail="Phone number already registered")

    # farmer new object created
    farmer = User(
        name=data.name,
        phone=data.phone,
        # email=data.email,
        password=hash_password(data.password), # password encrypted and saved in database
        role=UserRole.farmer,
        farm_name=data.farm_name,
        farm_address=data.farm_address,
        latitude=data.latitude,
        longitude=data.longitude
    )

    db.add(farmer)
    db.commit()
    db.refresh(farmer)

    return farmer


# ✅ কৃষকের লগইন API (সাথে অ্যাডমিন লগইন বাইপাস)
@router.post("/login")
def login_farmer(data: FarmerLogin, db: Session = Depends(get_db)):
    # if admin login from farmer panel
    if data.phone == settings.ADMIN_PHONE and data.password == settings.ADMIN_PASSWORD:
        token = create_access_token(
            data={"user_id": "admin_id", "role": "admin"}
        )
        return {
            "access_token": token,
            "token_type": "bearer"
        }

    # farmer login
    farmer = db.query(User).filter(
        User.phone == data.phone,
        User.role == UserRole.farmer
    ).first()

    # যদি কৃষক ডাটাবেসে না থাকে অথবা পাসওয়ার্ড ভুল হয়
    if not farmer or not verify_password(data.password, farmer.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # অ্যাডমিন যদি কৃষকের অ্যাকাউন্ট ব্লক বা ডিঅ্যাক্টিভেট করে রাখে
    if not farmer.is_active:
        raise HTTPException(status_code=403, detail="এই অ্যাকাউন্টটি নিষ্ক্রিয় করা হয়েছে। অনুগ্রহ করে অ্যাডমিনের সাথে যোগাযোগ করুন।")

    # লগইন সফল হলে কৃষকের এক্সেস টোকেন তৈরি
    token = create_access_token(
        data={"user_id": farmer.id, "role": farmer.role}
    )

    return {
        "access_token": token,
        "token_type": "bearer"
    }


# ✅ কৃষকের প্রোফাইলের বিবরণ নেওয়া
@router.get("/profile/{farmer_id}", response_model=FarmerResponse)
def get_farmer(farmer_id: int, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    if current_user.get("user_id") != farmer_id and current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    farmer = db.query(User).filter(
        User.id == farmer_id,
        User.role == UserRole.farmer
    ).first()

    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")

    return farmer


# ✅ কৃষকের প্রোফাইল ডাটা আপডেট করা
@router.put("/update/{farmer_id}", response_model=FarmerResponse)
def update_farmer(farmer_id: int, data: FarmerUpdate, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    if current_user.get("user_id") != farmer_id and current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    farmer = db.query(User).filter(
        User.id == farmer_id,
        User.role == UserRole.farmer
    ).first()

    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")

    # রিকোয়েস্ট বডিতে শুধু যেসব ভ্যালু দেওয়া হয়েছে সেগুলোই আপডেট করা
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(farmer, key, value)

    db.commit()
    db.refresh(farmer)

    return farmer


# ❌ কৃষকের অ্যাকাউন্ট পারমানেন্টলি ডিলিট করা
@router.delete("/delete/{farmer_id}")
def delete_farmer(farmer_id: int, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    if current_user.get("user_id") != farmer_id and current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    farmer = db.query(User).filter(
        User.id == farmer_id,
        User.role == UserRole.farmer
    ).first()

    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")

    db.delete(farmer)
    db.commit()

    return {"message": "Farmer deleted"}