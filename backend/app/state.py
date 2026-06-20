from typing import Annotated, List, Dict
from typing_extensions import TypedDict, Literal
from langgraph.graph.message import add_messages

class MedicalState(TypedDict, total=False):
    # Identifiers and patient demographics
    workflow_id: str
    patient_name: str
    patient_age: int
    patient_gender: str
    chief_complaint: str
    
    # LangGraph conversational messages
    messages: Annotated[list, add_messages]
    
    # Tracking questions
    question_count: int
    question_answers: List[Dict[str, str]]
    
    # Clinical and review information
    diagnostic_summary: str
    interim_care: str
    physician_review: str
    final_report: str
    
    # Flow and current node target
    next: Literal["diagnostic_agent", "physician_review", "report_agent", "FINISH"]
    status: str
