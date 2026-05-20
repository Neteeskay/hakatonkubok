from fastapi import APIRouter

from app.api.v1.endpoints import admin, applications, auth, funds, reports, tasks, volunteers

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(volunteers.router, prefix="/volunteers", tags=["volunteers"])
api_router.include_router(funds.router, prefix="/funds", tags=["funds"])
api_router.include_router(tasks.router, prefix="/tasks", tags=["tasks"])
api_router.include_router(applications.router, prefix="/applications", tags=["applications"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])

