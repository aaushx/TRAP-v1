"""Re-exports CompanyQuestion and UserQuestionProgress from company_dsa to maintain
backward compatibility with existing imports across repositories and services.
"""
from app.models.company_dsa import CompanyQuestion, UserQuestionProgress

__all__ = ["CompanyQuestion", "UserQuestionProgress"]
