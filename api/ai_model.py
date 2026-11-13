from pydantic import BaseModel, Field
from typing import Literal

class GoalProgress(BaseModel):
    score: int = Field(ge=0, le=100)
    trend: Literal["improving", "stable", "declining", "unknown"]
    explanation: str

class RecommendedSession(BaseModel):
    type: Literal["easy_run", "intensity_run", "long_run", "strength"]
    distance_km: float | None
    duration_minutes: int | None
    description: str

class CoachingAdvice(BaseModel):
    goal_progress: GoalProgress
    motivation: str
    feedback_on_last_run: str
    recommended_sessions: list[RecommendedSession] = Field(max_length=3)
    plan_adjustments: list[str]
    warning: str | None
