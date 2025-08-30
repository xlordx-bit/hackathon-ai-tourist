from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import asyncio
import logging

app = FastAPI()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class Alert(BaseModel):
    id: str
    user_id: str
    alert_type: str  # 'panic', 'anomaly', 'geofence'
    severity: str  # 'low', 'medium', 'high'
    location: dict  # {'latitude': float, 'longitude': float}
    timestamp: datetime = datetime.now()
    description: Optional[str] = None
    status: str = 'pending'  # 'pending', 'processing', 'resolved'

class EmergencyContact(BaseModel):
    user_id: str
    name: str
    phone: str
    relationship: str

class AlertService:
    def __init__(self):
        self.alerts: List[Alert] = []
        self.emergency_contacts: dict = {}  # user_id -> List[EmergencyContact]
        
    async def process_alert(self, alert: Alert):
        # Simulate alert processing
        await asyncio.sleep(1)
        
        # Update alert status
        alert.status = 'processing'
        
        # Notify emergency contacts
        if alert.user_id in self.emergency_contacts:
            await self.notify_emergency_contacts(alert)
            
        # Notify nearest police units
        await self.notify_police_units(alert)
        
        alert.status = 'resolved'
        logger.info(f"Alert {alert.id} processed successfully")
        
    async def notify_emergency_contacts(self, alert: Alert):
        contacts = self.emergency_contacts.get(alert.user_id, [])
        for contact in contacts:
            # Simulate sending notifications
            logger.info(f"Notifying emergency contact: {contact.name}")
            await asyncio.sleep(0.5)
            
    async def notify_police_units(self, alert: Alert):
        # Simulate notifying nearest police units
        logger.info(f"Notifying police units for alert: {alert.id}")
        await asyncio.sleep(1)

service = AlertService()

@app.post("/alert")
async def create_alert(alert: Alert, background_tasks: BackgroundTasks):
    try:
        service.alerts.append(alert)
        background_tasks.add_task(service.process_alert, alert)
        return {"message": "Alert created successfully", "alert_id": alert.id}
    except Exception as e:
        logger.error(f"Error creating alert: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/emergency-contact")
async def add_emergency_contact(contact: EmergencyContact):
    try:
        if contact.user_id not in service.emergency_contacts:
            service.emergency_contacts[contact.user_id] = []
        service.emergency_contacts[contact.user_id].append(contact)
        return {"message": "Emergency contact added successfully"}
    except Exception as e:
        logger.error(f"Error adding emergency contact: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/alerts/{user_id}")
async def get_user_alerts(user_id: str):
    try:
        user_alerts = [alert for alert in service.alerts if alert.user_id == user_id]
        return {"alerts": user_alerts}
    except Exception as e:
        logger.error(f"Error retrieving alerts: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
