from pydantic import BaseModel, ConfigDict


class ApiMessage(BaseModel):
    message: str


class OrmModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)

