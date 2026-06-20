from __future__ import annotations

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from uuid import uuid4
from typing import Dict, Optional

from .graph import MedicalWorkflowState
from .mcp_tools import ask_patient_tool, recommend_interim_care_tool

app = FastAPI(
    title="IA Medical Assistant",
    description="API FastAPI pour un workflow multi-agents médical académique avec LangGraph et MCP.",
    version="0.1.0",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

workflow_store: Dict[str, MedicalWorkflowState] = {}


class StartRequest(BaseModel):
    patient_name: str = Field(..., example="Omar Karim")
    patient_age: Optional[int] = Field(None, example=35)
    patient_gender: str = Field(..., example="Masculin")
    chief_complaint: str = Field(..., example="Douleur abdominale et nausées")


class StartResponse(BaseModel):
    workflow_id: str
    next_question: str


class AnswerRequest(BaseModel):
    answer: str = Field(..., example="Oui, j'ai de la fièvre depuis 2 jours.")


class PhysicianReviewRequest(BaseModel):
    physician_review: str = Field(..., example="Recommandation de surveillance, hydratation et évaluation en urgence si aggravation.")


class WorkflowStatus(BaseModel):
    workflow_id: str
    current_question_index: int
    total_questions: int
    interim_summary: str
    interim_recommendation: str
    physician_review: str
    completed: bool


@app.get("/", response_model=dict)
def root() -> Dict[str, str]:
    return {"message": "IA Medical Assistant API active"}


@app.post("/workflow/start", response_model=StartResponse)
def start_workflow(request: StartRequest) -> StartResponse:
    workflow_id = str(uuid4())
    state = MedicalWorkflowState.create(
        workflow_id=workflow_id,
        patient_name=request.patient_name,
        patient_age=request.patient_age,
        patient_gender=request.patient_gender,
        chief_complaint=request.chief_complaint,
    )
    workflow_store[workflow_id] = state
    question = ask_patient_tool(
        question_number=state.current_question_index + 1,
        question_text=state.next_question,
        answers=state.question_answers,
    )
    return StartResponse(workflow_id=workflow_id, next_question=question)


@app.post("/workflow/answer/{workflow_id}")
def answer_question(workflow_id: str, request: AnswerRequest) -> Dict[str, str]:
    state = workflow_store.get(workflow_id)
    if state is None:
        raise HTTPException(status_code=404, detail="Workflow introuvable")

    state.record_answer(request.answer)
    if state.current_question_index < len(state.question_answers) + 1 and state.next_question is not None:
        question = ask_patient_tool(
            question_number=state.current_question_index + 1,
            question_text=state.next_question,
            answers=state.question_answers,
        )
        return {"next_question": question}

    state.build_clinical_synthesis()
    state.build_interim_recommendation()
    return {
        "next_step": "physician_review",
        "interim_summary": state.interim_summary,
        "interim_recommendation": state.interim_recommendation,
    }


@app.post("/workflow/physician-review/{workflow_id}")
def physician_review(workflow_id: str, request: PhysicianReviewRequest) -> Dict[str, str]:
    state = workflow_store.get(workflow_id)
    if state is None:
        raise HTTPException(status_code=404, detail="Workflow introuvable")
    state.physician_review = request.physician_review
    state.build_final_report()
    return {"final_report": state.final_report}


@app.get("/workflow/report/{workflow_id}", response_model=WorkflowStatus)
def get_report(workflow_id: str) -> WorkflowStatus:
    state = workflow_store.get(workflow_id)
    if state is None:
        raise HTTPException(status_code=404, detail="Workflow introuvable")
    return WorkflowStatus(
        workflow_id=state.workflow_id,
        current_question_index=state.current_question_index,
        total_questions=len(state.question_answers),
        interim_summary=state.interim_summary,
        interim_recommendation=state.interim_recommendation,
        physician_review=state.physician_review,
        completed=state.completed,
    )
