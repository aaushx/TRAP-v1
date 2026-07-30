from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, cast, Date, desc
from app.database.engine import get_db_session
from app.api.deps import get_current_user
from app.models.user import User
from app.models.problem import Problem
from app.models.company import Company
from app.models.roadmap import Roadmap, RoadmapCategory, RoadmapTopic
from sqlalchemy.orm import selectinload
from datetime import date, timedelta
from typing import Dict, List, Any

router = APIRouter()

@router.get("/stats")
async def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session)
) -> dict:
    """Return dashboard statistics for the authenticated user, fetching real counts from DB."""
    
    # 1. Total Problems Solved
    problems_stmt = select(func.count()).select_from(Problem).where(Problem.user_id == current_user.id)
    problems_result = await session.execute(problems_stmt)
    problems_solved = problems_result.scalar() or 0

    # 2. Total Companies Applied
    companies_stmt = select(func.count()).select_from(Company).where(Company.user_id == current_user.id)
    companies_result = await session.execute(companies_stmt)
    companies_tracked = companies_result.scalar() or 0

    # 3. Active Goals
    roadmaps_stmt = select(func.count()).select_from(Roadmap).where(
        Roadmap.user_id == current_user.id,
        Roadmap.status == 'active'
    )
    roadmaps_result = await session.execute(roadmaps_stmt)
    active_goals = roadmaps_result.scalar() or 0

    # 4. Activity Feed (3 most recently created Problems/Companies combined)
    recent_problems_stmt = select(Problem.id, Problem.title, Problem.created_at).where(Problem.user_id == current_user.id).order_by(desc(Problem.created_at)).limit(3)
    recent_problems_result = await session.execute(recent_problems_stmt)
    
    recent_companies_stmt = select(Company.id, Company.name.label("title"), Company.created_at).where(Company.user_id == current_user.id).order_by(desc(Company.created_at)).limit(3)
    recent_companies_result = await session.execute(recent_companies_stmt)
    
    activities: List[Dict[str, Any]] = []
    for row in recent_problems_result.all():
        activities.append({
            "id": f"prob-{row.id}",
            "type": "problem", 
            "description": f"Added problem: {row.title}", 
            "timestamp": row.created_at.isoformat()
        })
    
    for row in recent_companies_result.all():
        activities.append({
            "id": f"comp-{row.id}",
            "type": "company", 
            "description": f"Tracked company: {row.title}", 
            "timestamp": row.created_at.isoformat()
        })
        
    activities.sort(key=lambda x: x["timestamp"], reverse=True)
    recent_activity = activities[:3]

    # 5. Heatmap Data (Problem completions by date)
    heatmap_stmt = select(
        cast(Problem.created_at, Date).label("date"),
        func.count().label("count")
    ).where(Problem.user_id == current_user.id).group_by(cast(Problem.created_at, Date)).order_by(desc(cast(Problem.created_at, Date)))
    
    heatmap_result = await session.execute(heatmap_stmt)
    
    heatmap_data: Dict[str, int] = {}
    problem_dates = []
    
    for row in heatmap_result.all():
        date_str = row.date.strftime("%Y-%m-%d") if isinstance(row.date, date) else str(row.date)
        heatmap_data[date_str] = row.count
        problem_dates.append(row.date)
        
    # 6. Current Streak Calculation
    current_streak = 0
    today = date.today()
    yesterday = today - timedelta(days=1)
    
    # Sort descending just to be safe
    problem_dates.sort(reverse=True)
    
    if problem_dates:
        # Check if they did a problem today or yesterday to have an active streak
        if problem_dates[0] == today or problem_dates[0] == yesterday:
            current_streak = 1
            check_date = problem_dates[0]
            
            for d in problem_dates[1:]:
                # If the next date is exactly one day before, streak continues
                if d == check_date - timedelta(days=1):
                    current_streak += 1
                    check_date = d
                # If it's the same day (multiple problems on same day), ignore
                elif d == check_date:
                    continue
                # If there's a gap > 1 day, streak is broken
                else:
                    break

    return {
        "data": {
            "user": {
                "full_name": current_user.full_name,
                "email": current_user.email,
            },
            "stats": {
                "problems_solved": problems_solved,
                "companies_tracked": companies_tracked,
                "active_goals": active_goals,
                "current_streak": current_streak,
                "daily_goal_progress": problems_solved, # simplified for now
                "daily_goal_target": 5, # default
            },
            "recent_activity": recent_activity,
            "heatmap_data": heatmap_data,
        }
    }


@router.get("/readiness")
async def get_placement_readiness(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session)
) -> dict:
    """Return placement readiness statistics based on active goals."""
    
    # Fetch active goals with categories and topics
    stmt = (
        select(Roadmap)
        .where(Roadmap.user_id == current_user.id, Roadmap.status == 'active')
        .options(
            selectinload(Roadmap.categories).selectinload(RoadmapCategory.topics)
        )
    )
    result = await session.execute(stmt)
    active_goals = result.scalars().all()
    
    if not active_goals:
        return {
            "placement_readiness_index": 0,
            "strengths": [],
            "needs_improvement": [],
            "daily_focus": ["Create a Goal to see your focus!"],
            "remaining_study_time": 0
        }
        
    total_topics_count = 0
    completed_topics_count = 0
    remaining_hours = 0.0
    
    category_stats = {} # { category_name: {"total": 0, "completed": 0} }
    incomplete_topics = [] # list of topic objects
    
    for roadmap in active_goals:
        for category in roadmap.categories:
            cat_name = category.name
            if cat_name not in category_stats:
                category_stats[cat_name] = {"total": 0, "completed": 0}
                
            for topic in category.topics:
                total_topics_count += 1
                category_stats[cat_name]["total"] += 1
                
                if topic.status == "completed" or topic.status == "mastered":
                    completed_topics_count += 1
                    category_stats[cat_name]["completed"] += 1
                else:
                    incomplete_topics.append({
                        "id": str(topic.id),
                        "name": topic.name,
                        "category": cat_name,
                        "goal": roadmap.title,
                        "difficulty": topic.difficulty,
                        "estimated_hours": topic.estimated_hours,
                        "status": topic.status
                    })
                    if topic.estimated_hours:
                        remaining_hours += topic.estimated_hours
                        
    # Calculate readiness index
    readiness_index = 0
    if total_topics_count > 0:
        readiness_index = int((completed_topics_count / total_topics_count) * 100)
        
    # Calculate category percentages
    category_percentages = []
    for cat_name, stats in category_stats.items():
        if stats["total"] > 0:
            percentage = (stats["completed"] / stats["total"]) * 100
            category_percentages.append({
                "name": cat_name,
                "percentage": int(percentage),
                "completed": stats["completed"],
                "total": stats["total"]
            })
            
    # Sort categories by percentage
    category_percentages.sort(key=lambda x: x["percentage"])
    
    needs_improvement = [cat["name"] for cat in category_percentages[:3]] if len(category_percentages) > 0 else []
    strengths = [cat["name"] for cat in category_percentages[-3:]] if len(category_percentages) > 0 else []
    strengths.reverse() # Highest first
    
    # Get daily focus (prioritize in_progress first)
    in_progress_topics = [t["name"] for t in incomplete_topics if t["status"] == "in_progress"]
    not_started_topics = [t["name"] for t in incomplete_topics if t["status"] == "not_started"]
    
    daily_focus = in_progress_topics + not_started_topics
    daily_focus = daily_focus[:3] # Take up to 3
    
    if not daily_focus:
        daily_focus = ["You're all caught up!"]
        
    if not needs_improvement:
        needs_improvement = ["No weaknesses identified."]
        
    if not strengths:
        strengths = ["Start learning to discover strengths!"]
    
    return {
        "placement_readiness_index": readiness_index,
        "strengths": strengths,
        "needs_improvement": needs_improvement,
        "daily_focus": daily_focus,
        "remaining_study_time": round(remaining_hours, 1)
    }

