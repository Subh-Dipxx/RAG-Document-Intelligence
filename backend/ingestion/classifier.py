from __future__ import annotations
import re
from typing import Dict, Any, List

def classify_document_content(text: str = "", file_name: str = "", title: str = "") -> Dict[str, Any]:
    """
    Classify document content based strictly on its internal text and title/filename
    into Education, Sports, News, Entertainment, or Others.
    """
    combined_text = f"{title} {file_name} {text}".lower()

    # Domain Classification Regex
    edu_pattern = r"\b(edu|education|school|course|learn|teach|teacher|study|class|syllabus|lecture|academi|academic|university|student|tutorial|textbook|exam|assignment|sem|semester|pe|resume|cv|degree|diploma|thesis|math|physics|chemistry|biology|engineering|homework|grade)\b"
    sports_pattern = r"\b(sport|sports|cricket|football|soccer|basketball|tennis|badminton|baseball|hockey|nba|match|league|tournament|athlete|olympic|game|score|player|team|stadium|championship|fitness|workout|athletics)\b"
    news_pattern = r"\b(news|headline|press|journal|bulletin|newspaper|broadcast|reporting|gazette|reporter|breaking|daily|editorial|article|report|notice)\b"
    entertainment_pattern = r"\b(movie|film|cinema|theater|tv|show|actor|actress|concert|song|music|album|drama|video|gaming|celebrity|pop|fun|comedy|series|anime|entertain|entertainment|media|play|novel|story)\b"
    finance_pattern = r"\b(finance|bank|tax|invoice|price|budget|audit|revenue|sale|market|stock|invest|payment|billing|fiscal|profit|expense|business)\b"
    tech_pattern = r"\b(tech|technology|code|api|dev|system|software|program|data|algorithm|cyber|network|server|config|database|ai|ml|python|java|web)\b"

    if re.search(edu_pattern, combined_text, re.IGNORECASE):
        category = "Education"
    elif re.search(sports_pattern, combined_text, re.IGNORECASE):
        category = "Sports"
    elif re.search(news_pattern, combined_text, re.IGNORECASE):
        category = "News"
    elif re.search(entertainment_pattern, combined_text, re.IGNORECASE):
        category = "Entertainment"
    elif re.search(finance_pattern, combined_text, re.IGNORECASE):
        category = "Finance & Business"
    elif re.search(tech_pattern, combined_text, re.IGNORECASE):
        category = "Technology & Data"
    else:
        category = "Others"

    # Extract keywords/topics from internal text or filename/title
    source_words = text[:3000] if text else f"{title} {file_name}"
    words = re.findall(r"\b[a-zA-Z0-9]{2,}\b", source_words)
    common_words = {
        "the", "and", "for", "that", "this", "with", "from", "have", "were", "which", "your", "been",
        "page", "text", "file", "document", "data", "sheet", "test", "null", "pdf", "docx", "xlsx", "txt", "content"
    }
    unique_topics: List[str] = []
    for w in words:
        wl = w.lower()
        formatted = w.capitalize()
        if wl not in common_words and formatted not in unique_topics:
            unique_topics.append(formatted)
        if len(unique_topics) >= 5:
            break

    return {
        "category": category,
        "topics": unique_topics if unique_topics else [category],
        "content_snippet": text[:300] if text else f"Document: {title or file_name}"
    }
