from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class FundDocumentResponse(BaseModel):
    id: UUID
    fund_id: UUID
    document_type: str
    file_url: str
    created_at: datetime

    model_config = {"from_attributes": True}

