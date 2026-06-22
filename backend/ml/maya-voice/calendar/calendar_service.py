from __future__ import annotations

"""
Google Calendar integration for Maya Voice.
Supports: list events, create event, move/update event.
"""

import os
from datetime import datetime, timedelta, timezone
from typing import Optional

from config import settings

_GCAL_AVAILABLE = False
try:
    from google.auth.transport.requests import Request
    from google.oauth2.credentials import Credentials
    from google_auth_oauthlib.flow import InstalledAppFlow
    from googleapiclient.discovery import build
    from googleapiclient.errors import HttpError
    _GCAL_AVAILABLE = True
except ImportError:
    pass


class CalendarEvent:
    def __init__(
        self,
        event_id: str,
        title: str,
        start: datetime,
        end: datetime,
        description: str = "",
        location: str = "",
    ) -> None:
        self.event_id = event_id
        self.title = title
        self.start = start
        self.end = end
        self.description = description
        self.location = location

    def to_dict(self) -> dict:
        return {
            "event_id": self.event_id,
            "title": self.title,
            "start": self.start.isoformat(),
            "end": self.end.isoformat(),
            "description": self.description,
            "location": self.location,
        }

    def to_voice_summary(self) -> str:
        start_str = self.start.strftime("%I:%M %p")
        return f"{self.title} at {start_str}"


class GoogleCalendarService:
    def __init__(self) -> None:
        self._service = None

    def _get_service(self):
        if self._service:
            return self._service
        if not _GCAL_AVAILABLE:
            return None

        creds = None
        token_path = settings.GOOGLE_TOKEN_FILE
        creds_path = settings.GOOGLE_CREDENTIALS_FILE

        if os.path.exists(token_path):
            creds = Credentials.from_authorized_user_file(token_path, settings.GOOGLE_CALENDAR_SCOPES)

        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                creds.refresh(Request())
            elif os.path.exists(creds_path):
                flow = InstalledAppFlow.from_client_secrets_file(creds_path, settings.GOOGLE_CALENDAR_SCOPES)
                creds = flow.run_local_server(port=0)
                with open(token_path, "w") as f:
                    f.write(creds.to_json())
            else:
                return None

        self._service = build("calendar", "v3", credentials=creds)
        return self._service

    def list_today(self, max_results: int = 10) -> list[CalendarEvent]:
        """Return today's calendar events."""
        service = self._get_service()
        if service is None:
            return []

        now = datetime.now(timezone.utc)
        start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_day = start_of_day + timedelta(days=1)

        try:
            events_result = service.events().list(
                calendarId="primary",
                timeMin=start_of_day.isoformat(),
                timeMax=end_of_day.isoformat(),
                maxResults=max_results,
                singleEvents=True,
                orderBy="startTime",
            ).execute()
            return [self._parse_event(e) for e in events_result.get("items", [])]
        except Exception:
            return []

    def list_free_slots(self, date: datetime, duration_minutes: int = 60) -> list[str]:
        """Identify free time slots on the given date."""
        events = self.list_today()
        busy = [(e.start, e.end) for e in events]
        busy.sort(key=lambda x: x[0])

        slots = []
        candidate = date.replace(hour=8, minute=0, second=0, microsecond=0)
        end_of_day = date.replace(hour=20, minute=0, second=0, microsecond=0)
        delta = timedelta(minutes=duration_minutes)

        while candidate + delta <= end_of_day:
            slot_end = candidate + delta
            conflict = any(
                not (slot_end <= b_start or candidate >= b_end)
                for b_start, b_end in busy
            )
            if not conflict:
                slots.append(candidate.strftime("%I:%M %p"))
            candidate += timedelta(minutes=30)

        return slots[:5]

    def create_event(
        self,
        title: str,
        start: datetime,
        duration_minutes: int = 60,
        description: str = "",
    ) -> Optional[CalendarEvent]:
        service = self._get_service()
        if service is None:
            return None

        end = start + timedelta(minutes=duration_minutes)
        body = {
            "summary": title,
            "description": description,
            "start": {"dateTime": start.isoformat(), "timeZone": "UTC"},
            "end": {"dateTime": end.isoformat(), "timeZone": "UTC"},
        }
        try:
            event = service.events().insert(calendarId="primary", body=body).execute()
            return self._parse_event(event)
        except Exception:
            return None

    def move_event(self, event_id: str, new_start: datetime) -> bool:
        service = self._get_service()
        if service is None:
            return False
        try:
            event = service.events().get(calendarId="primary", eventId=event_id).execute()
            old_start = datetime.fromisoformat(event["start"]["dateTime"])
            old_end = datetime.fromisoformat(event["end"]["dateTime"])
            duration = old_end - old_start
            new_end = new_start + duration
            event["start"]["dateTime"] = new_start.isoformat()
            event["end"]["dateTime"] = new_end.isoformat()
            service.events().update(calendarId="primary", eventId=event_id, body=event).execute()
            return True
        except Exception:
            return False

    @staticmethod
    def _parse_event(raw: dict) -> CalendarEvent:
        start_str = raw.get("start", {}).get("dateTime") or raw.get("start", {}).get("date", "")
        end_str = raw.get("end", {}).get("dateTime") or raw.get("end", {}).get("date", "")
        try:
            start = datetime.fromisoformat(start_str)
            end = datetime.fromisoformat(end_str)
        except ValueError:
            now = datetime.now(timezone.utc)
            start, end = now, now + timedelta(hours=1)
        return CalendarEvent(
            event_id=raw.get("id", ""),
            title=raw.get("summary", "Untitled"),
            start=start,
            end=end,
            description=raw.get("description", ""),
            location=raw.get("location", ""),
        )


calendar_service = GoogleCalendarService()
