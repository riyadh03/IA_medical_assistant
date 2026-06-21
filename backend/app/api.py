from fastapi import APIRouter, HTTPException, FastAPI
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
import sys
import os

from app.graph import compiled_graph
from app.database import save_workflow, get_workflow, list_workflows
from langgraph.types import Command

router = APIRouter(prefix="/consultation", tags=["consultation"])

# ==============================================================================
# Pydantic Schemas
# ==============================================================================

class StartConsultationRequest(BaseModel):
    patient_name: str = Field(..., example="Jean Dupont")
    patient_age: int = Field(..., example=45)
    patient_gender: str = Field(..., example="Masculin")
    chief_complaint: str = Field(..., example="Fièvre modérée et toux sèche depuis 3 jours.")

class StartConsultationResponse(BaseModel):
    workflow_id: str
    next_question: Optional[str] = None
    status: str

class AnswerRequest(BaseModel):
    answer: str = Field(..., example="Depuis environ 3 jours, ça a commencé après un coup de froid.")

class AnswerResponse(BaseModel):
    workflow_id: str
    status: str
    next_question: Optional[str] = None
    diagnostic_summary: Optional[str] = None
    interim_care: Optional[str] = None

class PhysicianReviewRequest(BaseModel):
    physician_review: str = Field(..., example="Repos à la maison, hydratation, paracétamol 1g en cas de fièvre.")

class ReportResponse(BaseModel):
    workflow_id: str
    final_report: str

class WorkflowStatusResponse(BaseModel):
    workflow_id: str
    patient_name: str
    patient_age: int
    patient_gender: str
    chief_complaint: str
    status: str
    current_question_index: int
    question_answers: List[dict]
    next_question: Optional[str] = None
    diagnostic_summary: Optional[str] = None
    interim_care: Optional[str] = None
    physician_review: Optional[str] = None
    final_report: Optional[str] = None

# ==============================================================================
# State Recovery Helper
# ==============================================================================

def ensure_graph_state(workflow_id: str):
    """
    Ensures that the compiled_graph's MemorySaver checkpointer has the current
    state loaded from SQLite. This makes the API completely resilient to restarts.
    """
    config = {"configurable": {"thread_id": workflow_id}}
    state_snapshot = compiled_graph.get_state(config)
    
    # If in-memory state is empty, reload it from SQLite
    if not state_snapshot.values:
        db_state = get_workflow(workflow_id)
        if db_state:
            print(f"🔄 [State Recovery] Chargement de l'état {workflow_id} depuis SQLite dans MemorySaver...")
            compiled_graph.update_state(config, {
                "workflow_id": db_state["workflow_id"],
                "patient_name": db_state["patient_name"],
                "patient_age": db_state["patient_age"],
                "patient_gender": db_state["patient_gender"],
                "chief_complaint": db_state["chief_complaint"],
                "question_count": db_state["current_question_index"],
                "question_answers": db_state["question_answers"],
                "diagnostic_summary": db_state["diagnostic_summary"],
                "interim_care": db_state["interim_care"],
                "physician_review": db_state["physician_review"],
                "final_report": db_state["final_report"],
                "status": db_state["status"]
            })
        else:
            raise HTTPException(status_code=404, detail="Consultation introuvable.")

# ==============================================================================
# API Endpoint Implementations
# ==============================================================================

@router.post("/start", response_model=StartConsultationResponse)
def start_consultation(req: StartConsultationRequest):
    workflow_id = str(uuid.uuid4())
    config = {"configurable": {"thread_id": workflow_id}}
    
    initial_state = {
        "workflow_id": workflow_id,
        "patient_name": req.patient_name,
        "patient_age": req.patient_age,
        "patient_gender": req.patient_gender,
        "chief_complaint": req.chief_complaint,
        "question_count": 0,
        "question_answers": [],
        "status": "waiting_patient"
    }
    
    # Save initially to SQLite database
    save_workflow(initial_state)
    
    # Start graph execution (will run supervisor, then diagnostic agent, then pause at first question)
    compiled_graph.invoke(initial_state, config)
    
    # Retrieve the state from checkpointer to extract the first question
    state_snapshot = compiled_graph.get_state(config)
    next_question = None
    
    if state_snapshot.next:
        tasks = state_snapshot.tasks
        if tasks and tasks[0].interrupts:
            interrupt_val = tasks[0].interrupts[0].value
            if isinstance(interrupt_val, dict) and interrupt_val.get("type") == "patient_question":
                next_question = interrupt_val.get("question")
    
    # Save the updated status and question count back to DB
    updated_values = state_snapshot.values
    save_workflow(updated_values)
    
    return StartConsultationResponse(
        workflow_id=workflow_id,
        next_question=next_question,
        status="waiting_patient"
    )

@router.post("/{workflow_id}/answer", response_model=AnswerResponse)
def answer_question(workflow_id: str, req: AnswerRequest):
    ensure_graph_state(workflow_id)
    config = {"configurable": {"thread_id": workflow_id}}
    
    # Resume graph execution with the patient's answer
    compiled_graph.invoke(Command(resume=req.answer), config)
    
    # Get the new state snapshot
    state_snapshot = compiled_graph.get_state(config)
    updated_values = state_snapshot.values
    
    # Save the latest state values to SQLite
    save_workflow(updated_values)
    
    # Default response structure
    res = AnswerResponse(
        workflow_id=workflow_id,
        status=updated_values.get("status", "waiting_patient")
    )
    
    # Check where the graph is currently suspended
    if state_snapshot.next:
        tasks = state_snapshot.tasks
        if tasks and tasks[0].interrupts:
            interrupt_val = tasks[0].interrupts[0].value
            
            # Case 1: Suspended on another patient question
            if isinstance(interrupt_val, dict) and interrupt_val.get("type") == "patient_question":
                res.next_question = interrupt_val.get("question")
                res.status = "waiting_patient"
                
            # Case 2: Suspended on physician review (all 5 questions are done!)
            elif isinstance(interrupt_val, dict) and interrupt_val.get("type") == "physician_review":
                res.status = "waiting_physician"
                res.diagnostic_summary = interrupt_val.get("diagnostic_summary")
                res.interim_care = interrupt_val.get("interim_care")
                
                # Explicitly override the status in DB to reflect waiting for physician
                updated_values["status"] = "waiting_physician"
                save_workflow(updated_values)
                
    return res

@router.post("/{workflow_id}/physician-review", response_model=ReportResponse)
def submit_physician_review(workflow_id: str, req: PhysicianReviewRequest):
    ensure_graph_state(workflow_id)
    config = {"configurable": {"thread_id": workflow_id}}
    
    # Verify that the graph is currently paused on physician review
    state_snapshot = compiled_graph.get_state(config)
    is_waiting_physician = False
    
    if state_snapshot.next:
        tasks = state_snapshot.tasks
        if tasks and tasks[0].interrupts:
            interrupt_val = tasks[0].interrupts[0].value
            if isinstance(interrupt_val, dict) and interrupt_val.get("type") == "physician_review":
                is_waiting_physician = True
                
    if not is_waiting_physician:
        raise HTTPException(status_code=400, detail="La consultation n'est pas en attente d'avis médical.")
        
    # Resume the graph with the physician's review/treatment
    final_state = compiled_graph.invoke(Command(resume=req.physician_review), config)
    
    # Save the finalized state (with final_report and status="completed") to DB
    save_workflow(final_state)
    
    return ReportResponse(
        workflow_id=workflow_id,
        final_report=final_state.get("final_report", "")
    )

@router.get("", response_model=List[WorkflowStatusResponse])
def get_all_consultations():
    workflows = list_workflows()
    res = []
    for w in workflows:
        # Check next question dynamically from graph state for active runs
        next_question = None
        if w["status"] == "waiting_patient":
            try:
                ensure_graph_state(w["workflow_id"])
                config = {"configurable": {"thread_id": w["workflow_id"]}}
                state_snapshot = compiled_graph.get_state(config)
                if state_snapshot.next:
                    tasks = state_snapshot.tasks
                    if tasks and tasks[0].interrupts:
                        interrupt_val = tasks[0].interrupts[0].value
                        if isinstance(interrupt_val, dict) and interrupt_val.get("type") == "patient_question":
                            next_question = interrupt_val.get("question")
            except Exception:
                pass
                
        res.append(WorkflowStatusResponse(
            workflow_id=w["workflow_id"],
            patient_name=w["patient_name"],
            patient_age=w["patient_age"],
            patient_gender=w["patient_gender"],
            chief_complaint=w["chief_complaint"],
            status=w["status"],
            current_question_index=w["current_question_index"],
            question_answers=w["question_answers"],
            next_question=next_question,
            diagnostic_summary=w["diagnostic_summary"],
            interim_care=w["interim_care"],
            physician_review=w["physician_review"],
            final_report=w["final_report"]
        ))
    return res

@router.get("/{workflow_id}", response_model=WorkflowStatusResponse)
def get_consultation_status(workflow_id: str):
    db_state = get_workflow(workflow_id)
    if not db_state:
        raise HTTPException(status_code=404, detail="Consultation introuvable.")
        
    # Retrieve current active question from graph state if we are waiting for patient
    next_question = None
    if db_state["status"] == "waiting_patient":
        try:
            ensure_graph_state(workflow_id)
            config = {"configurable": {"thread_id": workflow_id}}
            state_snapshot = compiled_graph.get_state(config)
            if state_snapshot.next:
                tasks = state_snapshot.tasks
                if tasks and tasks[0].interrupts:
                    interrupt_val = tasks[0].interrupts[0].value
                    if isinstance(interrupt_val, dict) and interrupt_val.get("type") == "patient_question":
                        next_question = interrupt_val.get("question")
        except Exception as e:
            print(f"⚠️ [API] Failed to fetch active question from state: {e}")
            
    return WorkflowStatusResponse(
        workflow_id=db_state["workflow_id"],
        patient_name=db_state["patient_name"],
        patient_age=db_state["patient_age"],
        patient_gender=db_state["patient_gender"],
        chief_complaint=db_state["chief_complaint"],
        status=db_state["status"],
        current_question_index=db_state["current_question_index"],
        question_answers=db_state["question_answers"],
        next_question=next_question,
        diagnostic_summary=db_state["diagnostic_summary"],
        interim_care=db_state["interim_care"],
        physician_review=db_state["physician_review"],
        final_report=db_state["final_report"]
    )

@router.get("/{workflow_id}/report", response_model=ReportResponse)
def get_final_report(workflow_id: str):
    db_state = get_workflow(workflow_id)
    if not db_state:
        raise HTTPException(status_code=404, detail="Consultation introuvable.")
        
    if not db_state.get("final_report"):
        raise HTTPException(status_code=400, detail="Le rapport final n'a pas encore été généré.")
        
    return ReportResponse(
        workflow_id=workflow_id,
        final_report=db_state["final_report"]
    )
